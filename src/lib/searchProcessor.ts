import type { ChainEngine } from '@/engine/interface';
import { getEngine } from '@/engine/factory';
import type { ChainData } from './blockchain';
import { getNativePrice } from './marketData';
import { checkHype } from './twitter';

export type AggregatedSearchData = {
    query: string;
    chainId: string;
    chainName: string;
    nativeSymbol: string;
    fetchedAt: string;
    entity: {
        address: string;
        ensName: string | null;
        isContract: boolean;
        txCount: number;
        balanceNative: number;
        tokenMetadata?: {
            name?: string;
            symbol?: string;
            decimals?: number;
            totalSupply?: string;
        };
        codeSize?: number;
    };
    market: {
        nativePriceUsd: number;
        portfolioValueUsd: number;
    };
    social: {
        hypeScore: number;
        mentions: number;
    };
    signals: {
        flags: string[];
        baselineScore: number;
    };
    knownEntity?: {
        name: string;
        symbol: string;
        description?: string;
        suggestedScore?: number;
        priceUsd?: number;
    };
};

export type SearchProcessorDeps = {
    getEngine: (chainId: string) => ChainEngine;
    getNativePrice: (chainId: string, nativeSymbol?: string) => Promise<number>;
    checkHype: (term: string, seedScore: number) => Promise<{ score: number; mentions: number }>;
    now: () => Date;
};

const defaultDeps: SearchProcessorDeps = {
    getEngine,
    getNativePrice,
    checkHype,
    now: () => new Date(),
};

const cache = new Map<string, { ts: number; data: AggregatedSearchData }>();

export function computeBaselineSignals(input: {
    txCount: number;
    balanceNative: number;
    isContract: boolean;
    isToken: boolean;
}): { baselineScore: number; flags: string[] } {
    let score = 50;
    const flags: string[] = [];

    if (input.txCount > 500) {
        score += 20;
        flags.push('High Activity');
    } else if (input.txCount < 5) {
        score -= 10;
        flags.push('Low Activity');
    }

    if (input.balanceNative > 1.0) {
        score += 15;
        flags.push('Significant Balance');
    } else if (input.balanceNative === 0) {
        score -= 5;
    }

    if (input.isContract) {
        score -= 10;
        if (input.isToken) {
            score += 30;
            flags.push('Token Contract');
        } else {
            flags.push('Unverified Contract');
        }
    } else {
        score += 10;
    }

    score = Math.min(100, Math.max(0, Math.round(score)));
    return { baselineScore: score, flags };
}

export async function aggregateSearchData(
    query: string,
    chainId: string,
    opts?: { cacheTtlMs?: number; deps?: Partial<SearchProcessorDeps> }
): Promise<AggregatedSearchData> {
    const ttl = opts?.cacheTtlMs ?? 30_000;
    const deps: SearchProcessorDeps = { ...defaultDeps, ...(opts?.deps || {}) };
    const key = `${String(chainId).trim()}:${String(query).trim().toLowerCase()}`;
    const nowMs = deps.now().getTime();
    const hit = cache.get(key);
    if (hit && nowMs - hit.ts < ttl) return hit.data;

    const engine = deps.getEngine(chainId);
    const chainData = await engine.fetchData(query);
    if (!chainData) throw new Error('Entity not found');

    const nativeSymbol = engine.nativeSymbol ?? 'ETH';
    const nativeBalance = Number.parseFloat(chainData.balance) || 0;

    const [nativePriceUsd, hype] = await Promise.all([
        deps.getNativePrice(chainId, nativeSymbol),
        deps.checkHype(chainData.ensName || chainData.address, 50),
    ]);

    const portfolioValueUsd = nativePriceUsd > 0 ? nativeBalance * nativePriceUsd : 0;

    const signals = computeBaselineSignals({
        txCount: chainData.txCount,
        balanceNative: nativeBalance,
        isContract: chainData.isContract,
        isToken: Boolean(chainData.tokenMetadata),
    });

    const aggregated: AggregatedSearchData = {
        query,
        chainId,
        chainName: engine.name,
        nativeSymbol,
        fetchedAt: deps.now().toISOString(),
        entity: {
            address: chainData.address,
            ensName: chainData.ensName,
            isContract: chainData.isContract,
            txCount: chainData.txCount,
            balanceNative: nativeBalance,
            tokenMetadata: chainData.tokenMetadata,
            codeSize: chainData.codeSize,
        },
        market: {
            nativePriceUsd,
            portfolioValueUsd,
        },
        social: {
            hypeScore: hype.score,
            mentions: hype.mentions,
        },
        signals: {
            flags: signals.flags,
            baselineScore: signals.baselineScore,
        },
    };

    cache.set(key, { ts: nowMs, data: aggregated });
    return aggregated;
}

export function clearSearchAggregationCache() {
    cache.clear();
}

export function chainDataFromAggregated(a: AggregatedSearchData): ChainData {
    return {
        address: a.entity.address,
        ensName: a.entity.ensName,
        balance: String(a.entity.balanceNative),
        txCount: a.entity.txCount,
        isContract: a.entity.isContract,
        codeSize: a.entity.codeSize ?? 0,
        tokenMetadata: a.entity.tokenMetadata,
    };
}
