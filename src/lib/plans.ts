export const PLANS = {
    free: {
        name: 'Starter',
        price: 0,
        annualPrice: 0,
        limit: 100,
        description: 'Prototype trust checks.',
        badge: 'Low friction',
        stats: {
            response: '140ms',
            coverage: 'Standard',
            signals: '62%'
        },
        features: [
            'Trust score',
            'Address checks'
        ]
    },
    basic: {
        name: 'Growth',
        price: 310,
        annualPrice: 290,
        limit: 12000,
        description: 'Ship at scale.',
        badge: 'Most popular',
        stats: {
            response: '110ms',
            coverage: 'Expanded',
            signals: '78%'
        },
        features: [
            'Monitoring',
            'Priority support'
        ]
    },
    pro: {
        name: 'Enterprise',
        price: null, // Custom
        annualPrice: null,
        limit: 100000,
        description: 'Custom policies + SLA.',
        badge: 'Max Support',
        stats: {
            response: '85ms',
            coverage: 'Maximum',
            signals: '92%'
        },
        features: [
            'Dedicated infra',
            'Onboarding'
        ]
    }
} as const;

export type PlanType = keyof typeof PLANS;
