import type { AggregatedSearchData } from './searchProcessor';

export function buildChaingptTrustPrompt(aggregated: AggregatedSearchData) {
    const payload = JSON.stringify(aggregated);
    const format =
        'Return EXACTLY this format (no markdown, no code fences, no extra lines):\n' +
        'TRUSTSCORE: <integer 0-100>\n' +
        'SUMMARY: <concise analysis>\n' +
        'END';

    const guidance =
        `You must score only using the provided aggregated data for chain "${aggregated.chainName}" (${aggregated.chainId}). ` +
        `Native currency is ${aggregated.nativeSymbol}. ` +
        `If evidence is sparse, be conservative and explain uncertainty in SUMMARY.`;

    return `${format}\n\n${guidance}\n\nAGGREGATED_DATA_JSON:\n${payload}`;
}

export function parseChaingptTrustResponse(raw: string): { trustScore: number; summary: string } | null {
    if (!raw) return null;
    const text = String(raw).replace(/\r\n/g, '\n').trim();

    const scoreMatch = text.match(/TRUSTSCORE\s*:\s*([0-9]{1,3})/i);
    const summaryStart = text.match(/SUMMARY\s*:\s*/i);
    if (!scoreMatch || !summaryStart) return null;

    const score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));

    const summaryIndex = text.toUpperCase().indexOf('SUMMARY:');
    if (summaryIndex < 0) return null;

    let after = text.slice(summaryIndex + 'SUMMARY:'.length);
    const endIndex = after.toUpperCase().lastIndexOf('\nEND');
    if (endIndex >= 0) after = after.slice(0, endIndex);
    const summary = after.trim();
    if (!summary) return null;
    return { trustScore: score, summary };
}

export function parseOrFallbackChaingptTrustResponse(raw: string, fallbackScore: number, fallbackSummary: string) {
    const parsed = parseChaingptTrustResponse(raw);
    if (parsed) return parsed;
    const s = Number.isFinite(fallbackScore) ? Math.min(100, Math.max(0, Math.round(fallbackScore))) : 50;
    const summary = fallbackSummary || 'AI response could not be parsed.';
    return { trustScore: s, summary };
}

