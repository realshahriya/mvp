import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChaingptTrustResponse, parseOrFallbackChaingptTrustResponse } from '../src/lib/chaingptTrust';

test('parseChaingptTrustResponse parses exact format', () => {
    const raw = 'TRUSTSCORE: 87\nSUMMARY: Looks good.\nEND';
    const parsed = parseChaingptTrustResponse(raw);
    assert.deepEqual(parsed, { trustScore: 87, summary: 'Looks good.' });
});

test('parseChaingptTrustResponse tolerates extra spaces and casing', () => {
    const raw = 'trustscore: 5\nsummary:  low evidence\nend';
    const parsed = parseChaingptTrustResponse(raw);
    assert.deepEqual(parsed, { trustScore: 5, summary: 'low evidence' });
});

test('parseOrFallbackChaingptTrustResponse falls back when malformed', () => {
    const raw = 'hello';
    const parsed = parseOrFallbackChaingptTrustResponse(raw, 33.6, 'fallback');
    assert.deepEqual(parsed, { trustScore: 34, summary: 'fallback' });
});

