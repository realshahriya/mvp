import { NextRequest, NextResponse } from 'next/server';
import { runTrustAgent } from '@/lib/aiAgent';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const chainsParam = searchParams.get('chains');

    if (!query) {
        return NextResponse.json(
            { error: 'Missing query parameter "q". Example: /api/trust-agent?q=vitalik.eth' },
            { status: 400 }
        );
    }

    const chains = chainsParam ? chainsParam.split(',').map((c) => c.trim()).filter(Boolean) : undefined;

    try {
        const result = await runTrustAgent(query, chains);
        return NextResponse.json(result);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: 'Trust agent failed', details: msg },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}
