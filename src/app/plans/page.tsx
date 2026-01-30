"use client";

import { BarChart3, Wallet, Clock, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { appKit } from "@/lib/walletConfig";
import { api } from "@/lib/apiClient";
import { PLANS, PlanType } from "@/lib/plans";

type PlanConfig = (typeof PLANS)[PlanType];

type UserCreditData = {
    balance: number;
    plan: PlanType;
    billingCycleStart: string;
    billingPeriod: "monthly" | "annual";
    planExpiresAt: string | null;
};

function PlansContent({ address }: { address: string }) {
    const [user, setUser] = useState<UserCreditData | null>(null);
    const [upgrading, setUpgrading] = useState<PlanType | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

    useEffect(() => {
        let active = true;
        const fetchData = async () => {
            try {
                const res = await api.getJson<{ user: UserCreditData }>("/credits", { query: { address } });
                if (active) {
                    setUser(res.user);
                    if (res.user.billingPeriod) {
                        setBillingPeriod(res.user.billingPeriod);
                    }
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
        return () => { active = false; };
    }, [address]);

    const handleUpgrade = async (plan: PlanType) => {
        if (upgrading) return;
        setUpgrading(plan);
        try {
            const res = await api.postJson<{ success: boolean, user: UserCreditData }>("/credits", {
                body: { address, action: "upgrade", plan, billingPeriod },
            });
            if (res.success) setUser(res.user);
        } catch (error) {
            console.error(error);
        } finally {
            setUpgrading(null);
        }
    };

    const currentPlan = user?.plan || "free";
    const limit = PLANS[currentPlan].limit;
    const balance = user?.balance || 0;
    const nextReset = user?.billingCycleStart ? new Date(new Date(user.billingCycleStart).getTime() + 30 * 24 * 60 * 60 * 1000) : new Date();
    const planExpiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt) : null;

    return (
        <div className="p-6 space-y-6 w-full">
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-2">
                    <div>
                        <h1 className="text-3xl font-bold text-[#E6E6E6] mb-1 font-sans">Plans</h1>
                        <p className="text-[#B0B0B0] text-sm">Choose what fits your rollout stage</p>
                    </div>
                    <div className="inline-flex items-center rounded-full px-3 py-1 bg-amber-500/10 border border-amber-500/30">
                        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-200">
                            All plans are free on testnet for testing purposes
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[#888] text-sm">Billing</span>
                    <div className="flex items-center bg-[#0A0A0A] border border-[#333] rounded-full p-1 w-56 h-10">
                        <button
                            type="button"
                            onClick={() => setBillingPeriod("monthly")}
                            className={`w-1/2 h-full rounded-full font-semibold text-sm transition-colors ${
                                billingPeriod === "monthly" ? "bg-neon text-black" : "text-[#BBB]"
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingPeriod("annual")}
                            className={`w-1/2 h-full rounded-full font-semibold text-sm transition-colors ${
                                billingPeriod === "annual" ? "bg-neon text-black" : "text-[#BBB]"
                            }`}
                        >
                            Annually
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl">
                    <div className="text-sm font-medium text-[#E6E6E6] mb-2">Available Balance</div>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-neon">{balance}</span>
                        <span className="text-[#666]">/ {limit} Credits</span>
                    </div>
                    <div className="w-full bg-[#2A2A2A] h-2 rounded-full overflow-hidden">
                        <div
                            className="bg-neon h-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (balance / limit) * 100)}%` }}
                        />
                    </div>
                </div>
                <div className="p-6 bg-[#161616] border border-[#2A2A2A] rounded-xl flex flex-col justify-between">
                    <div>
                        <div className="text-sm font-medium text-[#E6E6E6] mb-1">Current Plan</div>
                        <div className="text-2xl font-bold text-white capitalize">{PLANS[currentPlan].name}</div>
                    </div>
                    <div className="text-sm text-[#888] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Resets on {nextReset.toLocaleDateString()}
                    </div>
                    {currentPlan !== "free" && planExpiresAt ? (
                        <div className="text-xs text-[#666] mt-1">
                            Plan expires on {planExpiresAt.toLocaleDateString()}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.entries(PLANS) as [PlanType, PlanConfig][]).map(([key, plan]) => {
                    const isCurrent = key === currentPlan;
                    const isGrowth = key === "basic";
                    const effectivePrice = billingPeriod === "monthly" ? plan.price : plan.annualPrice;
                    const priceLabel =
                        effectivePrice !== null
                            ? effectivePrice === 0
                                ? "Free"
                                : `$${effectivePrice}/Mo`
                            : "Custom";
                    const isDowngradeToFree = key === "free" && currentPlan !== "free";

                    return (
                        <div key={key} className={`relative p-6 rounded-2xl border flex flex-col h-full transition-all ${
                            isCurrent ? "bg-[#1A1A1A] border-neon shadow-[0_0_20px_rgba(0,255,163,0.1)]" :
                            isGrowth ? "bg-[#0A0A0A] border-[#333] hover:border-[#555]" :
                            "bg-[#0A0A0A] border-[#222] hover:border-[#444]"
                        }`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white">
                                        {priceLabel}
                                    </div>
                                    <div className="text-xs text-[#666] mt-1">
                                        {key === "free"
                                            ? billingPeriod === "monthly"
                                                ? "Free"
                                                : "Free (annual)"
                                            : key === "basic"
                                                ? billingPeriod === "monthly"
                                                    ? `$${plan.price}/mo billed monthly`
                                                    : `$${plan.annualPrice}/mo billed annually`
                                                : "Contact sales"}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border bg-[#1A1A1A] text-[#888] border-[#333]">
                                    {plan.badge}
                                </span>
                            </div>

                            <p className="text-[#888] text-sm mb-6">{plan.description}</p>

                            <div className="space-y-1 mb-6 text-xs text-[#888]">
                                <div>Response <span className="text-[#E6E6E6]">{plan.stats.response}</span></div>
                                <div>Coverage <span className="text-[#E6E6E6]">{plan.stats.coverage}</span> • Signals <span className="text-[#E6E6E6]">{plan.stats.signals}</span></div>
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow">
                                <li className="flex items-center gap-2 text-sm text-[#CCC]">
                                    <Check className="w-4 h-4 text-neon" />
                                    {plan.limit.toLocaleString()} Credits/mo
                                </li>
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2 text-sm text-[#CCC]">
                                        <Check className="w-4 h-4 text-neon" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    if (key === "pro") {
                                        window.location.href = "mailto:sales@cencera.io";
                                        return;
                                    }
                                    if (isDowngradeToFree) return;
                                    handleUpgrade(key);
                                }}
                                disabled={isCurrent || upgrading !== null || isDowngradeToFree}
                                className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                                    isCurrent || isDowngradeToFree
                                        ? "bg-[#222] text-[#666] cursor-default"
                                        : "bg-white text-black hover:bg-neon hover:text-black"
                                }`}
                            >
                                {isCurrent
                                    ? "Current Plan"
                                    : isDowngradeToFree
                                        ? "Unavailable"
                                        : upgrading === key
                                            ? "Upgrading..."
                                            : key === "pro"
                                                ? "Contact Sales"
                                                : "Upgrade"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function PlansPage() {
    const { isConnected, address } = useAccount();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setMounted(true), 0);
        return () => window.clearTimeout(t);
    }, []);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <BarChart3 className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Loading Plans</h1>
                    <p className="text-[#B0B0B0] text-sm">Preparing your plan options…</p>
                </div>
            </div>
        );
    }

    if (!isConnected || !address) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-2">
                    <Wallet className="w-10 h-10 text-neon" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold text-[#E6E6E6] font-sans">Connect Wallet</h1>
                    <p className="text-[#B0B0B0] text-sm">Connect your wallet to view plans and upgrade.</p>
                </div>
                <button
                    onClick={() => appKit.open()}
                    className="flex items-center gap-2 px-6 py-3 bg-neon/10 hover:bg-neon/20 border border-neon/20 hover:border-neon/30 rounded-xl text-neon font-mono font-bold transition-all"
                >
                    <Wallet className="w-5 h-5" />
                    Connect Wallet
                </button>
            </div>
        );
    }

    return <PlansContent address={address} />;
}
