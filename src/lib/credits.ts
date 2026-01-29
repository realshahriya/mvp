import { CreditModel, CreditTransactionModel, dbConnect } from "./db";
import { PLANS, PlanType } from "./plans";

export { PLANS };
export type { PlanType };

async function checkAndResetCredits(walletAddress: string) {
    await dbConnect();
    const normalizedAddress = walletAddress.toLowerCase();
    
    const user = await CreditModel.findOne({ walletAddress: normalizedAddress });
    if (!user) return null;

    const now = new Date();
    const plan = (user.plan as PlanType) || 'free';

    if (plan !== 'free' && user.planExpiresAt && now.getTime() > new Date(user.planExpiresAt).getTime()) {
        const limit = PLANS.free.limit;
        user.plan = 'free';
        user.balance = limit;
        user.billingCycleStart = now;
        user.billingPeriod = 'monthly';
        user.planExpiresAt = null;
        user.updatedAt = now;
        await user.save();

        await CreditTransactionModel.create({
            walletAddress: normalizedAddress,
            amount: limit,
            type: 'plan_change',
            description: `Plan expired, reverted to ${PLANS.free.name} plan`,
            createdAt: now,
            metadata: { previousPlan: plan, newPlan: 'free', newBalance: limit }
        });
    }

    const billingCycleStart = new Date(user.billingCycleStart);
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

    if (now.getTime() - billingCycleStart.getTime() > oneMonthMs) {
        const limit = PLANS[plan].limit;
        user.balance = limit;
        user.billingCycleStart = now;
        user.updatedAt = now;
        await user.save();

        await CreditTransactionModel.create({
            walletAddress: normalizedAddress,
            amount: limit,
            type: 'plan_reset',
            description: `Monthly reset for ${PLANS[plan].name} plan`,
            createdAt: now,
            metadata: { plan, newBalance: limit }
        });
    }
    return user;
}

export async function getUserCredits(walletAddress: string): Promise<{
    balance: number;
    plan: PlanType;
    billingCycleStart: Date;
    billingPeriod: 'monthly' | 'annual';
    planExpiresAt: Date | null;
}> {
    await dbConnect();
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Check and reset first
    let user = await checkAndResetCredits(normalizedAddress);

    if (!user) {
        const now = new Date();
        user = await CreditModel.create({
            walletAddress: normalizedAddress,
            balance: PLANS.free.limit,
            plan: 'free',
            billingCycleStart: now,
            billingPeriod: 'monthly',
            planExpiresAt: null,
            updatedAt: now
        });
        
        await CreditTransactionModel.create({
            walletAddress: normalizedAddress,
            amount: PLANS.free.limit,
            type: 'plan_reset',
            description: 'Welcome! Free plan activated.',
            createdAt: now
        });
    }

    const billingPeriod = user.billingPeriod ?? 'monthly';
    const planExpiresAt = user.planExpiresAt ?? null;

    return { 
        balance: user.balance, 
        plan: user.plan as PlanType,
        billingCycleStart: user.billingCycleStart,
        billingPeriod,
        planExpiresAt
    };
}

export async function deductCredit(walletAddress: string, amount: number = 11, description: string = "API Call"): Promise<boolean> {
    await dbConnect();
    const normalizedAddress = walletAddress.toLowerCase();

    // Ensure credits are up to date (monthly reset)
    await checkAndResetCredits(normalizedAddress);

    try {
        // Atomic check and update
        const result = await CreditModel.findOneAndUpdate(
            { walletAddress: normalizedAddress, balance: { $gte: amount } },
            { $inc: { balance: -amount }, $set: { updatedAt: new Date() } },
            { new: true }
        );

        if (!result) {
            // Check if user exists, if not create them (will get free credits)
            const exists = await CreditModel.exists({ walletAddress: normalizedAddress });
            if (!exists) {
                await getUserCredits(normalizedAddress); // This creates the user
                // Try deduct again? Or just fail this time? 
                // Let's return false to be safe, they can retry.
            }
            return false;
        }

        await CreditTransactionModel.create({
            walletAddress: normalizedAddress,
            amount: -amount,
            type: 'usage',
            description,
            createdAt: new Date()
        });

        return true;
    } catch (error) {
        console.error("Credit deduction error:", error);
        return false;
    }
}

export async function upgradePlan(
    walletAddress: string,
    newPlan: PlanType,
    billingPeriod: 'monthly' | 'annual' = 'monthly'
): Promise<boolean> {
    await dbConnect();
    const normalizedAddress = walletAddress.toLowerCase();
    
    if (!PLANS[newPlan]) return false;

    try {
        const limit = PLANS[newPlan].limit;
        const now = new Date();
        let planExpiresAt: Date | null = null;

        if (newPlan !== 'free') {
            const durationMs = billingPeriod === 'annual' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
            planExpiresAt = new Date(now.getTime() + durationMs);
        }

        await CreditModel.findOneAndUpdate(
            { walletAddress: normalizedAddress },
            { 
                $set: { 
                    plan: newPlan, 
                    balance: limit,
                    billingCycleStart: now,
                    billingPeriod,
                    planExpiresAt,
                    updatedAt: now 
                } 
            },
            { upsert: true, new: true }
        );

        await CreditTransactionModel.create({
            walletAddress: normalizedAddress,
            amount: limit,
            type: 'plan_change',
            description: `Upgraded to ${PLANS[newPlan].name} Plan`,
            createdAt: now,
            metadata: { newPlan, limit, billingPeriod, planExpiresAt }
        });

        return true;
    } catch (error) {
        console.error("Plan upgrade error:", error);
        return false;
    }
}

export async function getTransactionHistory(walletAddress: string, limit: number = 20) {
    await dbConnect();
    return CreditTransactionModel.find({ walletAddress: walletAddress.toLowerCase() })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}
