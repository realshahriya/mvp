import { getAiEngine } from '@/engine/factory';
import { EntityData, ScoreHistoryPoint, SentimentPoint } from './mockData';
import { FAMOUS_TOKENS } from './knownTokens';
import { aggregateSearchData } from './searchProcessor';

const aiCache = new Map<string, { ts: number; raw: string; trustScore: number; summary: string }>();
const AI_CACHE_TTL_MS = 60_000;

export async function analyzeEntity(input: string, chainId: string = '1'): Promise<EntityData> {
    const aggregated = await aggregateSearchData(input, chainId, { cacheTtlMs: 30_000 });
    const normalizedAddr = aggregated.entity.address.toLowerCase();

    let enriched = aggregated;
    const known = FAMOUS_TOKENS[normalizedAddr];
    if (known && known.networks.includes(chainId)) {
        enriched = {
            ...aggregated,
            signals: {
                ...aggregated.signals,
                baselineScore: known.score,
                flags: Array.from(new Set([...aggregated.signals.flags, 'Verified Entity'])),
            },
            knownEntity: {
                name: known.name,
                symbol: known.symbol,
                description: known.description,
                suggestedScore: known.score,
                priceUsd: known.price,
            },
        };
    }

    const cacheKey = `${chainId}:${normalizedAddr}`;
    const now = Date.now();
    const hit = aiCache.get(cacheKey);

    let raw = '';
    let trustScore = enriched.signals.baselineScore;
    let summary = '';

    if (hit && now - hit.ts < AI_CACHE_TTL_MS) {
        raw = hit.raw;
        trustScore = hit.trustScore;
        summary = hit.summary;
    } else {
        try {
            const ai = getAiEngine();
            const res = await ai.generateTrustScoreAndSummaryFromAggregated(enriched);
            raw = res.raw;
            trustScore = res.trustScore;
            summary = res.summary;
            aiCache.set(cacheKey, { ts: now, raw, trustScore, summary });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            trustScore = enriched.signals.baselineScore;
            summary = `AI unavailable (${msg}). Baseline trust score derived from aggregated signals.`;
            raw = `TRUSTSCORE: ${trustScore}\nSUMMARY: ${summary}\nEND`;
        }
    }

    const detectedType: EntityData['type'] = enriched.entity.tokenMetadata ? 'token' : enriched.entity.isContract ? 'contract' : 'wallet';
    const entityName = enriched.knownEntity
        ? `${enriched.knownEntity.name} (${enriched.knownEntity.symbol})`
        : enriched.entity.tokenMetadata
        ? `${enriched.entity.tokenMetadata.name} (${enriched.entity.tokenMetadata.symbol})`
        : enriched.entity.ensName || enriched.entity.address;

    let label: EntityData['label'] = 'Caution';
    if (trustScore >= 80) label = 'Safe';
    if (trustScore < 50) label = 'High Risk';

    const risks: EntityData['risks'] = [];
    for (const f of enriched.signals.flags) {
        const normalizedTitle =
            f === 'Contract Code Detected' ? 'Contract Account' : f;
        const t =
            f === 'Verified Entity'
                ? 'success'
                : f === 'High Activity' || f === 'Significant Balance' || f === 'Token Contract'
                ? 'success'
                : f === 'Low Activity'
                ? 'warning'
                : f === 'Contract Code Detected'
                ? 'info'
                : 'info';

        const description =
            f === 'Verified Entity'
                ? 'Known reputable entity detected in local allowlist.'
                : f === 'High Activity'
                ? 'High transaction count suggests sustained usage history.'
                : f === 'Low Activity'
                ? 'Very low transaction history; trust signals are limited.'
                : f === 'Significant Balance'
                ? 'Meaningful native balance present at this address.'
                : f === 'Token Contract'
                ? 'Contract exposes token-like metadata; likely a token contract.'
                : f === 'Contract Code Detected'
                ? 'On-chain bytecode is present. This is not inherently bad; some wallets are smart-contract accounts.'
                : '';

        risks.push({ type: t, title: normalizedTitle, description });
    }
    if (enriched.market.nativePriceUsd <= 0) {
        risks.push({ type: 'info', title: 'Price Unavailable', description: '' });
    }

    return {
        id: entityName,
        address: enriched.entity.address,
        type: detectedType,
        score: trustScore,
        label,
        summary,
        aiText: raw,
        risks,
        history: generateMockHistory(trustScore),
        sentiment: generateMockSentiment(trustScore),
        hypeScore: enriched.social.hypeScore,
        mentionsCount: enriched.social.mentions,
        nativeBalance: enriched.entity.balanceNative,
        nativeSymbol: enriched.nativeSymbol,
        nativePriceUsd: enriched.market.nativePriceUsd,
        marketData: {
            ethPriceUsd: enriched.market.nativePriceUsd,
            portfolioValueUsd: enriched.market.portfolioValueUsd,
            tokenPrice: enriched.knownEntity?.priceUsd
        }
    };
}

// Helpers content to fill charts
function generateMockHistory(baseScore: number): ScoreHistoryPoint[] {
    return [
        { date: 'Jan', score: Math.max(0, baseScore - 5) },
        { date: 'Feb', score: Math.max(0, baseScore + 2) },
        { date: 'Mar', score: baseScore },
    ]
}

function generateMockSentiment(baseScore: number): SentimentPoint[] {
    const isGood = baseScore > 60;
    return [
        { time: '10:00', value: isGood ? 20 : -10 },
        { time: '12:00', value: isGood ? 40 : -30 },
        { time: '14:00', value: isGood ? 50 : -20 },
    ]
}
