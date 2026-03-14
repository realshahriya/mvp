"use client";

import { Check, Zap, Building2, Sparkles, ExternalLink } from "lucide-react";
import { useState } from "react";
import { PLANS, PlanType } from "@/lib/plans";
import { motion } from "framer-motion";

const planIcons: Record<PlanType, typeof Zap> = {
  free: Sparkles,
  basic: Zap,
  enterprise: Building2,
};

export default function PlansPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="p-6 space-y-8 relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#E6E6E6] font-sans tracking-wide uppercase">Plans</h1>
          <p className="text-[#B0B0B0] text-sm">Choose what fits your integration stage</p>
          <div className="inline-flex items-center rounded-full px-3 py-1 bg-amber-500/10 border border-amber-500/30">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-200">
              All plans are free on testnet for showcase purposes
            </span>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3">
          <span className="text-[#888] text-sm font-mono">Billing</span>
          <div className="flex items-center bg-[#0A0A0A] border border-[#333] rounded-full p-1 w-52 h-10">
            {(["monthly", "annual"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setBillingPeriod(period)}
                className={`w-1/2 h-full rounded-full font-semibold text-sm capitalize transition-all ${billingPeriod === period ? "bg-neon text-black" : "text-[#BBB]"}`}
              >
                {period === "monthly" ? "Monthly" : "Annually"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.entries(PLANS) as [PlanType, typeof PLANS[PlanType]][]).map(([key, plan], i) => {
          const Icon = planIcons[key];
          const isPopular = key === "basic";
          const effectivePrice = billingPeriod === "monthly" ? plan.price : plan.annualPrice;
          const priceLabel = effectivePrice !== null
            ? effectivePrice === 0 ? "Free" : `$${effectivePrice}/mo`
            : "Custom";

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 260, damping: 22 }}
              className={`relative p-6 rounded-2xl border flex flex-col transition-all ${isPopular
                ? "bg-[#141414] border-neon/50 shadow-[0_0_24px_rgba(146,220,229,0.08)]"
                : "bg-[#0A0A0A] border-[#222] hover:border-[#444]"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-neon text-black text-[10px] font-mono font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isPopular ? "border-neon/30 bg-neon/10" : "border-[#333] bg-[#1A1A1A]"}`}>
                    <Icon className={`w-4 h-4 ${isPopular ? "text-neon" : "text-[#888]"}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">{plan.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white font-mono">{priceLabel}</div>
                  {plan.price !== null && plan.annualPrice !== null && plan.price > 0 && (
                    <div className="text-[10px] text-[#555] font-mono mt-0.5">
                      {billingPeriod === "annual" ? "billed annually" : "billed monthly"}
                    </div>
                  )}
                </div>
              </div>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono border bg-[#1A1A1A] text-[#888] border-[#333] mb-4 w-fit">
                {plan.badge}
              </span>

              <p className="text-[#888] text-sm mb-5 leading-relaxed">{plan.description}</p>

              {/* Stats */}
              <div className="text-xs font-mono text-[#666] mb-5 space-y-1">
                <div>Response <span className="text-[#C0C0C0]">{plan.stats.response}</span></div>
                <div>Coverage <span className="text-[#C0C0C0]">{plan.stats.coverage}</span> · Signals <span className="text-[#C0C0C0]">{plan.stats.signals}</span></div>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-grow">
                <li className="flex items-center gap-2 text-sm text-[#CCC]">
                  <Check className="w-4 h-4 text-neon shrink-0" />
                  {plan.limit === 999999 ? "Unlimited" : plan.limit.toLocaleString()} Credits/mo
                </li>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#CCC]">
                    <Check className="w-4 h-4 text-neon shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {key === "enterprise" ? (
                <a
                  href="https://cencera.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-lg font-bold text-sm text-center flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-[#CCC] hover:bg-white/10 transition-all"
                >
                  Contact Sales <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <div className={`w-full py-3 rounded-lg font-bold text-sm text-center cursor-default ${
                  key === "free"
                    ? "bg-[#222] text-[#666]"
                    : "bg-neon/10 border border-neon/30 text-neon"
                }`}>
                  {key === "free" ? "Current (Demo)" : "Coming Soon"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="text-center text-xs font-mono text-[#444] pt-2">
        Pricing is indicative. Full billing will be available at mainnet launch.
      </div>
    </div>
  );
}
