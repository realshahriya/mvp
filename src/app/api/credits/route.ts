import { NextRequest, NextResponse } from 'next/server';
import { getUserCredits, getTransactionHistory, upgradePlan, PlanType } from '@/lib/credits';

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        const user = await getUserCredits(address);
        const history = await getTransactionHistory(address);
        return NextResponse.json({ user, history });
    } catch (error: unknown) {
        console.error("Credits API Error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Plan Upgrade Endpoint
    const body = await req.json().catch(() => null);
    const address = body?.address;
    const action = body?.action;
    const rawBillingPeriod = body?.billingPeriod;
    const billingPeriod: 'monthly' | 'annual' =
        rawBillingPeriod === 'annual' ? 'annual' : 'monthly';
    
    if (!address) {
        return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    try {
        if (action === 'upgrade') {
            const plan = body?.plan as PlanType;
            if (!plan) {
                return NextResponse.json({ error: 'Plan required' }, { status: 400 });
            }

            const success = await upgradePlan(address, plan, billingPeriod);
            if (success) {
                const newUser = await getUserCredits(address);
                return NextResponse.json({ success: true, user: newUser });
            } else {
                return NextResponse.json({ error: 'Failed to upgrade plan' }, { status: 500 });
            }
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: unknown) {
        console.error("Credits API Error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
