import { NextRequest, NextResponse } from 'next/server';
import { analyzeEntity } from '@/lib/analysisEngine';

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
        // 1. Run the Analysis Engine
        const data = await analyzeEntity(query, chainId);

        // 2. Format Response according to Universal Trust Score Standard (Step 7)
        const response = {
            entity: data.id,
            address: data.address,
            type: data.type,
            trust_score: data.score,
            risk_level: data.label,
            risk_flags: data.risks.map(r => r.title),
            summary: data.summary,
            ai_text: data.aiText,
            sentiment: data.sentiment,
            market_data: data.marketData ? {
                portfolio_value_usd: data.marketData.portfolioValueUsd,
                eth_price: data.marketData.ethPriceUsd,
                native_balance: data.nativeBalance,
                native_symbol: data.nativeSymbol,
                native_price_usd: data.nativePriceUsd
            } : null,
            generated_at: new Date().toISOString(),
            metadata: {
                social_hype_score: data.hypeScore,
                social_mentions: data.mentionsCount
            }
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
