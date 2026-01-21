import { NextRequest, NextResponse } from 'next/server';
import { getSentimentReport } from '@/lib/xSentimentEngine';

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q') || '';
    const chainId = req.nextUrl.searchParams.get('chain') || '1';
    if (!q.trim()) {
        return NextResponse.json({ error: 'missing_query' }, { status: 400 });
    }
    try {
        const data = await getSentimentReport(q, chainId);
        return NextResponse.json(data);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('x-sentiment error', { q, chainId, msg });
        return NextResponse.json({ error: 'sentiment_failed', details: msg }, { status: 500 });
    }
}
