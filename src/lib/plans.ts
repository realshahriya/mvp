export type PlanType = "free" | "basic" | "enterprise";

export const PLANS: Record<PlanType, {
  name: string;
  price: number | null;
  annualPrice: number | null;
  limit: number;
  badge: string;
  description: string;
  features: string[];
  stats: { response: string; coverage: string; signals: string };
}> = {
  free: {
    name: "Free",
    price: 0,
    annualPrice: 0,
    limit: 50,
    badge: "Starter",
    description: "Explore the trust scoring engine with basic access across supported chains.",
    features: [
      "Composite trust score",
      "Lifecycle state",
      "Public API access",
      "18 supported chains",
    ],
    stats: { response: "< 500ms", coverage: "18 chains", signals: "On-chain only" },
  },
  basic: {
    name: "Growth",
    price: 29,
    annualPrice: 23,
    limit: 2000,
    badge: "Most Popular",
    description: "Full Trust Manifold access with trajectory history and category-level triggers.",
    features: [
      "Full Trust Manifold",
      "Score trajectory (5 points)",
      "Category-level triggers",
      "Batch screening (100/req)",
      "Standard SLA",
    ],
    stats: { response: "< 200ms", coverage: "18 chains", signals: "All 4 domains" },
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    annualPrice: null,
    limit: 999999,
    badge: "Custom",
    description: "Signal-level detail, custom SLAs, webhooks, and institutional reporting.",
    features: [
      "Signal-level explainability",
      "Batch screening (500/req)",
      "Score change webhooks",
      "Custom lookback periods",
      "Institutional reporting module",
      "Dedicated support",
    ],
    stats: { response: "Custom SLA", coverage: "All chains", signals: "Full signal detail" },
  },
};
