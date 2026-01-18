import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateSearchData, clearSearchAggregationCache, computeBaselineSignals } from '../src/lib/searchProcessor';
import type { AggregatedSearchData } from '../src/lib/searchProcessor';
import type { ChainEngine } from '../src/engine/interface';
import { buildChaingptTrustPrompt } from '../src/lib/chaingptTrust';

test('computeBaselineSignals returns flags and bounded score', () => {
    const r = computeBaselineSignals({ txCount: 1, balanceNative: 0, isContract: true, isToken: false });
    assert.ok(r.flags.includes('Low Activity'));
    assert.ok(r.flags.includes('Contract Code Detected'));
    assert.ok(r.baselineScore >= 0 && r.baselineScore <= 100);
});

test('aggregateSearchData aggregates engine, market, and social fields', async () => {
    clearSearchAggregationCache();
    const fixed = new Date('2026-01-01T00:00:00.000Z');
    const res = await aggregateSearchData('0xabc', 'ton', {
        cacheTtlMs: 30_000,
        deps: {
            now: () => fixed,
            getEngine: () =>
                ({
                    chainId: 0,
                    name: 'TON',
                    nativeSymbol: 'TON',
                    fetchData: async () => ({
                        address: 'UQ123',
                        ensName: null,
                        balance: '10',
                        txCount: 12,
                        isContract: false,
                        codeSize: 0,
                        tokenMetadata: undefined,
                    }),
                    analyze: async () => {
                        throw new Error('unused');
                    },
                }) as unknown as ChainEngine,
            getNativePrice: async () => 2,
            checkHype: async () => ({ score: 55, mentions: 123 }),
        },
    });

    assert.equal(res.chainId, 'ton');
    assert.equal(res.chainName, 'TON');
    assert.equal(res.nativeSymbol, 'TON');
    assert.equal(res.entity.address, 'UQ123');
    assert.equal(res.entity.balanceNative, 10);
    assert.equal(res.market.nativePriceUsd, 2);
    assert.equal(res.market.portfolioValueUsd, 20);
    assert.equal(res.social.hypeScore, 55);
});

test('aggregateSearchData caches within TTL', async () => {
    clearSearchAggregationCache();
    let calls = 0;
    const base = new Date('2026-01-01T00:00:00.000Z');
    const deps = {
        now: () => base,
        getEngine: () =>
            ({
                chainId: 0,
                name: 'Solana',
                nativeSymbol: 'SOL',
                fetchData: async () => {
                    calls++;
                    return {
                        address: 'So111',
                        ensName: null,
                        balance: '1',
                        txCount: 1,
                        isContract: false,
                        codeSize: 0,
                    };
                },
                analyze: async () => {
                    throw new Error('unused');
                },
            }) as unknown as ChainEngine,
        getNativePrice: async () => 100,
        checkHype: async () => ({ score: 1, mentions: 1 }),
    };
    await aggregateSearchData('So111', 'solana', { cacheTtlMs: 30_000, deps });
    await aggregateSearchData('So111', 'solana', { cacheTtlMs: 30_000, deps });
    assert.equal(calls, 1);
});

test('buildChaingptTrustPrompt includes strict response format', async () => {
    const aggregated = {
        query: 'x',
        chainId: '1',
        chainName: 'Ethereum',
        nativeSymbol: 'ETH',
        fetchedAt: '2026-01-01T00:00:00.000Z',
        entity: { address: '0x1', ensName: null, isContract: false, txCount: 1, balanceNative: 0, codeSize: 0 },
        market: { nativePriceUsd: 0, portfolioValueUsd: 0 },
        social: { hypeScore: 0, mentions: 0 },
        signals: { flags: [], baselineScore: 50 },
    };
    const prompt = buildChaingptTrustPrompt(aggregated as unknown as AggregatedSearchData);
    assert.ok(prompt.includes('TRUSTSCORE: <integer 0-100>'));
    assert.ok(prompt.includes('SUMMARY: <concise analysis>'));
    assert.ok(prompt.includes('AGGREGATED_DATA_JSON:'));
});
