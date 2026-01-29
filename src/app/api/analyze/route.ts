import { NextRequest, NextResponse } from 'next/server';
import { runCaPipeline } from '@/lib/caPipeline';
import { dbConnect, ScanResultModel } from '@/lib/db';
import { deductCredit } from '@/lib/credits';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const chainId = searchParams.get('chain') || '1';
    const user = searchParams.get('user');

    if (!query) {
        return NextResponse.json(
            { error: 'Missing query parameter "q". Example: /api/analyze?q=vitalik.eth' },
            { status: 400 }
        );
    }

    if (!user) {
        return NextResponse.json(
            { error: 'Authentication required', details: 'User wallet address must be provided for credit deduction.' },
            { status: 401 }
        );
    }

    // Deduct Credit
    const creditDeducted = await deductCredit(user, 11, `Analysis of ${query} on chain ${chainId}`);
    if (!creditDeducted) {
        return NextResponse.json(
            { error: 'Insufficient credits', details: 'Please top up your account to continue using the API.' },
            { status: 402 } // Payment Required
        );
    }

    try {
        const data = await runCaPipeline(query, chainId);
        
        // Save scan result to DB
        try {
            await dbConnect();
            await ScanResultModel.create({
                address: data.normalized.chain.address,
                chain: chainId,
                score: data.chainGpt.score,
                riskLevel: data.rating,
                scannedBy: user || undefined,
                summary: data.chainGpt.summary,
            });
        } catch (dbError) {
            console.error("Failed to save scan result:", dbError);
            // Continue even if DB save fails
        }

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

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}
