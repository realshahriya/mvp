import { NextRequest, NextResponse } from 'next/server';
import { runCaPipeline } from '@/lib/caPipeline';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const chainId = searchParams.get('chain') || '1';

    if (!query) {
        return NextResponse.json(
            { error: 'Missing query parameter "q". Example: /api/analyze?q=vitalik.eth' },
            { status: 400 }
        );
    }

    try {
        const data = await runCaPipeline(query, chainId);
        const response = {
            entity: data.normalized.chain.address,
            address: data.normalized.chain.address,
            type: data.normalized.chain.isContract ? 'contract' : 'wallet',
            trust_score: data.chainGpt.score,
            risk_level: data.rating,
            risk_flags: data.signals.flags,
            summary: data.chainGpt.summary,
            ai_text: null,
            sentiment: [],
            market_data: {
                portfolio_value_usd: data.normalized.market.priceUsd * data.normalized.chain.balanceNative,
                eth_price: data.normalized.market.priceUsd,
                native_balance: data.normalized.chain.balanceNative,
                native_symbol: data.normalized.chain.nativeSymbol,
                native_price_usd: data.normalized.market.priceUsd
            },
            generated_at: new Date().toISOString(),
            metadata: {
                social_hype_score: data.social.hypeScore,
                social_mentions: data.social.mentions,
            },
            report: data.report,
            validation: data.validation,
            social_detail: data.normalized.social,
        };

        return NextResponse.json(response);

    } catch (error: unknown) {
        console.error("API Error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: 'Analysis failed', details: msg },
            { status: 500 }
        );
    }
}
