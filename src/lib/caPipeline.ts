import { aggregateSearchData } from './searchProcessor';
import { getAiEngine } from '@/engine/factory';
import { getNativePrice } from './marketData';
import { getSentimentReport } from './xSentimentEngine';
import fs from 'node:fs/promises';
import path from 'node:path';

type MarketHistoryPoint = { ts: string; priceUsd: number; volumeUsd?: number };
type MarketSnapshot = {
    priceUsd: number;
    volume24hUsd: number;
    liquidityUsd: number;
    sources: string[];
    history: MarketHistoryPoint[];
};

type SocialSnapshot = {
    x: Awaited<ReturnType<typeof getSentimentReport>> | null;
    reddit: { mentions: number; sentiment: { positive: number; neutral: number; negative: number } };
    telegram: { mentions: number; sentiment: { positive: number; neutral: number; negative: number } };
};

type NormalizedPayload = {
    query: string;
    chainId: string;
    fetchedAt: string;
    chain: {
        address: string;
        ensName: string | null;
        isContract: boolean;
        txCount: number;
        balanceNative: number;
        nativeSymbol: string;
    };
    market: MarketSnapshot;
    social: SocialSnapshot;
};

export type CaPipelineResult = {
    normalized: NormalizedPayload;
    validation: { ok: boolean; missing: string[] };
    chainGpt: { score: number; summary: string };
    rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    signals: { flags: string[]; baselineScore: number };
    social: { hypeScore: number; mentions: number };
    report: {
        keyMetrics: Array<{ label: string; value: string }>;
        notes: string[];
    };
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { ts: number; data: CaPipelineResult }>();
const rawCacheFile = path.join(process.cwd(), 'data', 'ca-raw-cache.json');
const rateState: Record<string, { ts: number; tokens: number }> = {};

function scoreToRating(score: number): CaPipelineResult['rating'] {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
}

async function storeRawAudit(key: string, payload: NormalizedPayload) {
    try {
        await fs.mkdir(path.dirname(rawCacheFile), { recursive: true });
        const raw = await fs.readFile(rawCacheFile, 'utf-8').catch(() => '');
        const existing = raw ? (JSON.parse(raw) as Record<string, Array<NormalizedPayload>>) : {};
        const list = existing[key] || [];
        list.push(payload);
        existing[key] = list.slice(-100);
        await fs.writeFile(rawCacheFile, JSON.stringify(existing, null, 2), 'utf-8');
    } catch {
    }
}

async function fetchWithTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return await Promise.race([
        fn(),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
}

async function fetchCoingeckoMarket(id: string): Promise<{ priceUsd: number; volume24hUsd: number; liquidityUsd: number; history: MarketHistoryPoint[] }> {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('coingecko_failed');
    const data = (await res.json()) as Array<{ current_price?: number; total_volume?: number; liquidity_score?: number; market_cap?: number }>;
    const row = data[0] || {};
    const priceUsd = typeof row.current_price === 'number' ? row.current_price : 0;
    const volume24hUsd = typeof row.total_volume === 'number' ? row.total_volume : 0;
    const liquidityUsd = typeof row.market_cap === 'number' ? row.market_cap : 0;
    const chart = await fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=1`);
    const chartJson = chart.ok ? ((await chart.json()) as { prices?: Array<[number, number]>; total_volumes?: Array<[number, number]> }) : {};
    const history: MarketHistoryPoint[] = (chartJson.prices || []).slice(-24).map((p, idx) => ({
        ts: new Date(p[0]).toISOString(),
        priceUsd: p[1],
        volumeUsd: chartJson.total_volumes && chartJson.total_volumes[idx] ? chartJson.total_volumes[idx][1] : undefined,
    }));
    return { priceUsd, volume24hUsd, liquidityUsd, history };
}

async function fetchCryptoCompareMarket(symbol: string): Promise<{ priceUsd: number; volume24hUsd: number }> {
    const sym = symbol.trim().toUpperCase();
    const res = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${encodeURIComponent(sym)}&tsyms=USD`);
    if (!res.ok) throw new Error('cryptocompare_failed');
    const data = (await res.json()) as { RAW?: Record<string, { USD?: { PRICE?: number; TOTALVOLUME24H?: number } }> };
    const row = data.RAW?.[sym]?.USD;
    return {
        priceUsd: typeof row?.PRICE === 'number' ? row.PRICE : 0,
        volume24hUsd: typeof row?.TOTALVOLUME24H === 'number' ? row.TOTALVOLUME24H : 0,
    };
}

async function rateLimit(key: string, limit: number, perMs: number) {
    const now = Date.now();
    const state = rateState[key] || { ts: now, tokens: limit };
    const elapsed = now - state.ts;
    const refill = Math.floor((elapsed / perMs) * limit);
    if (refill > 0) {
        state.tokens = Math.min(limit, state.tokens + refill);
        state.ts = now;
    }
    if (state.tokens <= 0) {
        const waitMs = Math.max(200, perMs / limit);
        await new Promise((r) => setTimeout(r, waitMs));
    } else {
        state.tokens -= 1;
    }
    rateState[key] = state;
}

async function fetchRedditSentiment(query: string): Promise<{ mentions: number; sentiment: { positive: number; neutral: number; negative: number } }> {
    try {
        const res = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=25`);
        if (!res.ok) throw new Error('reddit_failed');
        const data = (await res.json()) as { data?: { children?: Array<{ data?: { title?: string; selftext?: string } }> } };
        const posts = data.data?.children || [];
        let positive = 0;
        let negative = 0;
        let neutral = 0;
        for (const p of posts) {
            const text = `${p.data?.title ?? ''} ${p.data?.selftext ?? ''}`.trim();
            if (!text) continue;
            const lower = text.toLowerCase();
            const hasPos = /(bullish|moon|pump|good|great|strong|win)/.test(lower);
            const hasNeg = /(scam|rug|dump|bad|hack|exploit|loss)/.test(lower);
            if (hasPos && !hasNeg) positive += 1;
            else if (hasNeg && !hasPos) negative += 1;
            else neutral += 1;
        }
        const total = positive + negative + neutral || 1;
        return {
            mentions: posts.length,
            sentiment: {
                positive: Math.round((positive / total) * 100),
                neutral: Math.round((neutral / total) * 100),
                negative: Math.round((negative / total) * 100),
            },
        };
    } catch {
        return { mentions: 0, sentiment: { positive: 0, neutral: 0, negative: 0 } };
    }
}

async function fetchTelegramSentiment(query: string): Promise<{ mentions: number; sentiment: { positive: number; neutral: number; negative: number } }> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_SOCIAL_CHAT_ID;
    if (!token || !chatId) {
        return { mentions: 0, sentiment: { positive: 0, neutral: 0, negative: 0 } };
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        if (!res.ok) throw new Error('telegram_failed');
        const data = (await res.json()) as { result?: Array<{ message?: { text?: string; chat?: { id?: number } } }> };
        const msgs = data.result || [];
        const lowerQuery = query.toLowerCase();
        let mentions = 0;
        let positive = 0;
        let negative = 0;
        let neutral = 0;
        for (const m of msgs) {
            const text = m.message?.text || '';
            if (!text || m.message?.chat?.id !== Number(chatId)) continue;
            if (!text.toLowerCase().includes(lowerQuery)) continue;
            mentions += 1;
            const lower = text.toLowerCase();
            const hasPos = /(bullish|moon|pump|good|great|strong|win)/.test(lower);
            const hasNeg = /(scam|rug|dump|bad|hack|exploit|loss)/.test(lower);
            if (hasPos && !hasNeg) positive += 1;
            else if (hasNeg && !hasPos) negative += 1;
            else neutral += 1;
        }
        const total = positive + negative + neutral || 1;
        return {
            mentions,
            sentiment: {
                positive: Math.round((positive / total) * 100),
                neutral: Math.round((neutral / total) * 100),
                negative: Math.round((negative / total) * 100),
            },
        };
    } catch {
        return { mentions: 0, sentiment: { positive: 0, neutral: 0, negative: 0 } };
    }
}

export async function runCaPipeline(query: string, chainId: string): Promise<CaPipelineResult> {
    const key = `${chainId}:${query.toLowerCase()}`;
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data;
    console.info('ca-pipeline start', { query, chainId });

    const aggregated = await fetchWithTimeout(
        () => aggregateSearchData(query, chainId, { cacheTtlMs: 30_000 }),
        4000
    );

    const coingeckoMap: Record<string, string> = {
        '1': 'ethereum',
        '56': 'binancecoin',
        '137': 'matic-network',
        '10': 'ethereum',
        '42161': 'ethereum',
        '8453': 'ethereum',
        '43114': 'avalanche-2',
        '250': 'fantom',
        '324': 'ethereum',
        '30': 'rootstock-smart-bitcoin',
        'bitcoin': 'bitcoin',
        'stacks': 'stacks',
        'solana': 'solana',
        'sui': 'sui',
        'aptos': 'aptos',
        'ton': 'toncoin',
        'cosmos': 'cosmos',
        'polkadot': 'polkadot',
        'lightning': 'bitcoin',
        'liquid': 'liquid-bitcoin',
        'near': 'near',
    };
    const coingeckoId = coingeckoMap[aggregated.chainId];
    const marketPromise = async () => {
        const nativePrice = await getNativePrice(aggregated.chainId, aggregated.nativeSymbol);
        let market: MarketSnapshot = {
            priceUsd: nativePrice,
            volume24hUsd: 0,
            liquidityUsd: 0,
            sources: ['native'],
            history: [],
        };
        if (coingeckoId) {
            try {
                const cg = await fetchCoingeckoMarket(coingeckoId);
                market = {
                    priceUsd: cg.priceUsd || nativePrice,
                    volume24hUsd: cg.volume24hUsd,
                    liquidityUsd: cg.liquidityUsd,
                    sources: ['coingecko'],
                    history: cg.history,
                };
            } catch {
            }
        }
        if (aggregated.nativeSymbol) {
            try {
                const cc = await fetchCryptoCompareMarket(aggregated.nativeSymbol);
                const sources = market.sources.includes('cryptocompare') ? market.sources : [...market.sources, 'cryptocompare'];
                market = {
                    ...market,
                    priceUsd: cc.priceUsd || market.priceUsd,
                    volume24hUsd: market.volume24hUsd || cc.volume24hUsd,
                    sources,
                };
            } catch {
            }
        }
        return market;
    };

    const [xSentiment, reddit, telegram, market] = await Promise.all([
        fetchWithTimeout(() => getSentimentReport(query, chainId), 4000).catch(() => null),
        fetchWithTimeout(() => fetchRedditSentiment(query), 2500),
        fetchWithTimeout(() => fetchTelegramSentiment(query), 2500),
        fetchWithTimeout(marketPromise, 3500),
    ]);

    const normalized: NormalizedPayload = {
        query,
        chainId,
        fetchedAt: new Date().toISOString(),
        chain: {
            address: aggregated.entity.address,
            ensName: aggregated.entity.ensName,
            isContract: aggregated.entity.isContract,
            txCount: aggregated.entity.txCount,
            balanceNative: aggregated.entity.balanceNative,
            nativeSymbol: aggregated.nativeSymbol,
        },
        market,
        social: {
            x: xSentiment,
            reddit,
            telegram,
        },
    };

    const missing: string[] = [];
    if (!normalized.chain.address) missing.push('address');
    if (!Number.isFinite(normalized.chain.txCount)) missing.push('txCount');
    if (!Number.isFinite(normalized.chain.balanceNative)) missing.push('balanceNative');
    const validation = { ok: missing.length === 0, missing };

    await storeRawAudit(key, normalized);

    const ai = getAiEngine();
    let trustScore = aggregated.signals.baselineScore;
    let summary = aggregated.signals.flags.join(', ') || 'Baseline assessment.';
    try {
        await rateLimit('chaingpt', 12, 60_000);
        const aiRes = await fetchWithTimeout(() => ai.generateTrustScoreAndSummaryFromAggregated(aggregated), 4000);
        trustScore = aiRes.trustScore;
        summary = aiRes.summary;
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        summary = `AI unavailable (${msg}). Baseline trust score applied.`;
    }

    const rating = scoreToRating(trustScore);
    const report: CaPipelineResult['report'] = {
        keyMetrics: [
            { label: 'Score', value: String(trustScore) },
            { label: 'Rating', value: rating },
            { label: 'Tx Count', value: String(normalized.chain.txCount) },
            { label: 'Balance', value: `${normalized.chain.balanceNative} ${normalized.chain.nativeSymbol}` },
            { label: 'Price', value: `$${normalized.market.priceUsd.toFixed(4)}` },
        ],
        notes: validation.ok ? [] : [`Missing fields: ${missing.join(', ')}`],
    };

    const result: CaPipelineResult = {
        normalized,
        validation,
        chainGpt: { score: trustScore, summary },
        rating,
        signals: aggregated.signals,
        social: { hypeScore: aggregated.social.hypeScore, mentions: aggregated.social.mentions },
        report,
    };
    cache.set(key, { ts: now, data: result });
    return result;
}
