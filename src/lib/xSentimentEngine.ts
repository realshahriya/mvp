import fs from 'node:fs/promises';
import path from 'node:path';

type SentimentLabel = 'positive' | 'neutral' | 'negative';

type XUser = {
    id: string;
    username?: string;
    name?: string;
    verified?: boolean;
    public_metrics?: {
        followers_count?: number;
        following_count?: number;
        tweet_count?: number;
        listed_count?: number;
    };
};

type XTweet = {
    id: string;
    text?: string;
    created_at?: string;
    author_id?: string;
    public_metrics?: {
        like_count?: number;
        retweet_count?: number;
        reply_count?: number;
        quote_count?: number;
    };
};

export type SentimentBreakdown = {
    positive: number;
    neutral: number;
    negative: number;
};

export type SentimentReport = {
    query: string;
    chainId: string;
    fetchedAt: string;
    hashtagTotals: Array<{ bucket: string; count: number }>;
    hashtagFrequency: Record<string, number>;
    sentimentPercentages: SentimentBreakdown;
    engagementTotals: { likes: number; retweets: number; replies: number; quotes: number };
    engagementTrend: Array<{ bucket: string; likes: number; retweets: number; replies: number; quotes: number; count: number }>;
    topInfluentialPosts: Array<{
        id: string;
        text: string;
        author: string;
        influenceScore: number;
        metrics: { likes: number; retweets: number; replies: number; quotes: number };
        createdAt?: string;
        url?: string;
    }>;
    baselineComparison: {
        hashtagAvg: number;
        engagementAvg: number;
        sentimentAvg: SentimentBreakdown;
        deltas: {
            hashtagDelta: number;
            engagementDelta: number;
            sentimentDelta: SentimentBreakdown;
        };
    };
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { ts: number; data: SentimentReport }>();
const historyFile = path.join(process.cwd(), 'data', 'x-sentiment-history.json');

const positiveLexicon = [
    'bullish', 'moon', 'mooning', 'pump', 'pumping', 'great', 'good', 'excellent', 'strong',
    'win', 'winning', 'love', 'amazing', 'solid', 'green', 'support', 'breakout', 'up',
];
const negativeLexicon = [
    'scam', 'rug', 'rugged', 'dump', 'dumping', 'bad', 'weak', 'bearish', 'down', 'loss',
    'fraud', 'hack', 'exploit', 'crash', 'red', 'panic', 'sell', 'selloff',
];

export function extractHashtags(text: string): string[] {
    const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
    return matches.map((t) => t.toLowerCase());
}

export function classifySentiment(text: string): SentimentLabel {
    const lower = text.toLowerCase();
    const tokens = lower.match(/[a-z0-9]+/g) || [];
    let score = 0;
    for (const t of tokens) {
        if (positiveLexicon.includes(t)) score += 1;
    }
    for (const t of tokens) {
        if (negativeLexicon.includes(t)) score -= 1;
    }
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
}

export function computeInfluenceScore(user?: XUser): number {
    if (!user) return 0;
    const followers = user.public_metrics?.followers_count ?? 0;
    const listed = user.public_metrics?.listed_count ?? 0;
    const verifiedBoost = user.verified ? 1.15 : 1;
    const base = Math.log10(Math.max(1, followers)) * 18 + Math.log10(Math.max(1, listed + 1)) * 12;
    const score = Math.min(100, Math.max(0, base * verifiedBoost));
    return Math.round(score);
}

function bucketize(createdAt?: string): string {
    if (!createdAt) return 'unknown';
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return 'unknown';
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const hh = String(d.getUTCHours()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:00`;
}

function ensureDir(dir: string) {
    return fs.mkdir(dir, { recursive: true }).catch(() => {});
}

async function loadHistory(): Promise<Record<string, Array<{ ts: string; hashtagTotal: number; engagementTotal: number; sentiment: SentimentBreakdown }>>> {
    try {
        const raw = await fs.readFile(historyFile, 'utf-8');
        return JSON.parse(raw) as Record<string, Array<{ ts: string; hashtagTotal: number; engagementTotal: number; sentiment: SentimentBreakdown }>>;
    } catch {
        return {};
    }
}

async function storeHistory(key: string, entry: { ts: string; hashtagTotal: number; engagementTotal: number; sentiment: SentimentBreakdown }) {
    await ensureDir(path.dirname(historyFile));
    const history = await loadHistory();
    const list = history[key] || [];
    list.push(entry);
    history[key] = list.slice(-120);
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2), 'utf-8');
}

function buildQuery(term: string, chainId: string): string {
    const trimmed = term.trim();
    const base = trimmed.replace(/\s+/g, ' ').toLowerCase();
    if (!base) return '';
    const words = base.split(' ').filter(Boolean);
    const variations = new Set<string>();
    for (const w of words) {
        variations.add(`"${w}"`);
        variations.add(`#${w}`);
        if (w.length <= 10) variations.add(`$${w}`);
    }
    if (base.length > 3) variations.add(`"${base}"`);
    if (chainId && chainId !== '1') variations.add(chainId);
    return Array.from(variations).join(' OR ');
}

async function fetchWithRetry(url: string, init: RequestInit, retries: number): Promise<Response> {
    let attempt = 0;
    while (true) {
        const res = await fetch(url, init);
        if (res.status !== 429 || attempt >= retries) return res;
        const retryAfter = res.headers.get('retry-after');
        const waitMs = retryAfter ? Math.min(10_000, Number(retryAfter) * 1000) : 1200 + attempt * 800;
        await new Promise((r) => setTimeout(r, waitMs));
        attempt += 1;
    }
}

async function fetchXRecent(query: string): Promise<{ tweets: XTweet[]; users: XUser[] }> {
    const token = process.env.X_API_BEARER_TOKEN;
    if (!token) {
        throw new Error('X_API_BEARER_TOKEN missing');
    }
    const params = new URLSearchParams({
        query,
        max_results: '50',
        'tweet.fields': 'created_at,public_metrics,author_id',
        expansions: 'author_id',
        'user.fields': 'public_metrics,verified,username,name',
    });
    const url = `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`;
    const res = await fetchWithRetry(url, { headers: { Authorization: `Bearer ${token}` } }, 2);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`X API error ${res.status}: ${text}`);
    }
    const json = (await res.json()) as { data?: XTweet[]; includes?: { users?: XUser[] } };
    return { tweets: json.data || [], users: json.includes?.users || [] };
}

export function aggregateTweets(tweets: XTweet[], users: XUser[]): Omit<SentimentReport, 'query' | 'chainId' | 'fetchedAt' | 'baselineComparison'> {
    const userMap = new Map(users.map((u) => [u.id, u]));
    const hashtagFrequency: Record<string, number> = {};
    const hashtagTotals: Record<string, number> = {};
    const engagementTrend: Record<string, { likes: number; retweets: number; replies: number; quotes: number; count: number }> = {};
    const sentimentCounts: Record<SentimentLabel, number> = { positive: 0, neutral: 0, negative: 0 };
    const topPosts: Array<SentimentReport['topInfluentialPosts'][number]> = [];
    const engagementTotals = { likes: 0, retweets: 0, replies: 0, quotes: 0 };

    for (const tweet of tweets) {
        const text = tweet.text || '';
        const bucket = bucketize(tweet.created_at);
        const tags = extractHashtags(text);
        for (const tag of tags) {
            hashtagFrequency[tag] = (hashtagFrequency[tag] || 0) + 1;
        }
        hashtagTotals[bucket] = (hashtagTotals[bucket] || 0) + tags.length;
        const metrics = tweet.public_metrics || {};
        engagementTotals.likes += metrics.like_count || 0;
        engagementTotals.retweets += metrics.retweet_count || 0;
        engagementTotals.replies += metrics.reply_count || 0;
        engagementTotals.quotes += metrics.quote_count || 0;
        if (!engagementTrend[bucket]) {
            engagementTrend[bucket] = { likes: 0, retweets: 0, replies: 0, quotes: 0, count: 0 };
        }
        engagementTrend[bucket].likes += metrics.like_count || 0;
        engagementTrend[bucket].retweets += metrics.retweet_count || 0;
        engagementTrend[bucket].replies += metrics.reply_count || 0;
        engagementTrend[bucket].quotes += metrics.quote_count || 0;
        engagementTrend[bucket].count += 1;
        const sentiment = classifySentiment(text);
        sentimentCounts[sentiment] += 1;

        const user = tweet.author_id ? userMap.get(tweet.author_id) : undefined;
        const influence = computeInfluenceScore(user);
        topPosts.push({
            id: tweet.id,
            text,
            author: user?.username || user?.name || 'unknown',
            influenceScore: influence,
            metrics: {
                likes: metrics.like_count || 0,
                retweets: metrics.retweet_count || 0,
                replies: metrics.reply_count || 0,
                quotes: metrics.quote_count || 0,
            },
            createdAt: tweet.created_at,
            url: user?.username ? `https://x.com/${user.username}/status/${tweet.id}` : undefined,
        });
    }

    const totalSentiments = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative || 1;
    const sentimentPercentages: SentimentBreakdown = {
        positive: Math.round((sentimentCounts.positive / totalSentiments) * 100),
        neutral: Math.round((sentimentCounts.neutral / totalSentiments) * 100),
        negative: Math.round((sentimentCounts.negative / totalSentiments) * 100),
    };

    const topInfluentialPosts = topPosts
        .sort((a, b) => (b.influenceScore * (b.metrics.likes + b.metrics.retweets + 1)) - (a.influenceScore * (a.metrics.likes + a.metrics.retweets + 1)))
        .slice(0, 5);

    return {
        hashtagTotals: Object.entries(hashtagTotals).map(([bucket, count]) => ({ bucket, count })),
        hashtagFrequency,
        sentimentPercentages,
        engagementTotals,
        engagementTrend: Object.entries(engagementTrend).map(([bucket, v]) => ({ bucket, ...v })),
        topInfluentialPosts,
    };
}

function computeBaseline(history: Array<{ ts: string; hashtagTotal: number; engagementTotal: number; sentiment: SentimentBreakdown }>): SentimentReport['baselineComparison'] {
    if (!history.length) {
        return {
            hashtagAvg: 0,
            engagementAvg: 0,
            sentimentAvg: { positive: 0, neutral: 0, negative: 0 },
            deltas: { hashtagDelta: 0, engagementDelta: 0, sentimentDelta: { positive: 0, neutral: 0, negative: 0 } },
        };
    }
    const total = history.reduce(
        (acc, h) => {
            acc.hashtag += h.hashtagTotal;
            acc.engagement += h.engagementTotal;
            acc.sentiment.positive += h.sentiment.positive;
            acc.sentiment.neutral += h.sentiment.neutral;
            acc.sentiment.negative += h.sentiment.negative;
            return acc;
        },
        { hashtag: 0, engagement: 0, sentiment: { positive: 0, neutral: 0, negative: 0 } }
    );
    const n = history.length;
    return {
        hashtagAvg: Math.round(total.hashtag / n),
        engagementAvg: Math.round(total.engagement / n),
        sentimentAvg: {
            positive: Math.round(total.sentiment.positive / n),
            neutral: Math.round(total.sentiment.neutral / n),
            negative: Math.round(total.sentiment.negative / n),
        },
        deltas: { hashtagDelta: 0, engagementDelta: 0, sentimentDelta: { positive: 0, neutral: 0, negative: 0 } },
    };
}

export async function getSentimentReport(query: string, chainId: string): Promise<SentimentReport> {
    const key = `${chainId}:${query.toLowerCase()}`;
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data;
    const q = buildQuery(query, chainId);
    if (!q) throw new Error('Invalid query');
    console.info('x-sentiment fetch', { query, chainId });
    const { tweets, users } = await fetchXRecent(q);
    const aggregated = aggregateTweets(tweets, users);
    const history = await loadHistory();
    const past = history[key] || [];
    const baseline = computeBaseline(past);
    const hashtagsTotalNow = aggregated.hashtagTotals.reduce((sum, b) => sum + b.count, 0);
    const engagementTotalNow = aggregated.engagementTotals.likes + aggregated.engagementTotals.retweets + aggregated.engagementTotals.replies + aggregated.engagementTotals.quotes;
    const entry = {
        ts: new Date().toISOString(),
        hashtagTotal: hashtagsTotalNow,
        engagementTotal: engagementTotalNow,
        sentiment: aggregated.sentimentPercentages,
    };
    await storeHistory(key, entry);
    const baselineComparison: SentimentReport['baselineComparison'] = {
        ...baseline,
        deltas: {
            hashtagDelta: hashtagsTotalNow - baseline.hashtagAvg,
            engagementDelta: engagementTotalNow - baseline.engagementAvg,
            sentimentDelta: {
                positive: aggregated.sentimentPercentages.positive - baseline.sentimentAvg.positive,
                neutral: aggregated.sentimentPercentages.neutral - baseline.sentimentAvg.neutral,
                negative: aggregated.sentimentPercentages.negative - baseline.sentimentAvg.negative,
            },
        },
    };
    const report: SentimentReport = {
        query,
        chainId,
        fetchedAt: new Date().toISOString(),
        ...aggregated,
        baselineComparison,
    };
    cache.set(key, { ts: now, data: report });
    return report;
}
