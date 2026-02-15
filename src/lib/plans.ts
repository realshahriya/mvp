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
        name: 'Test Credits',
        price: 0,
        annualPrice: 0,
        limit: 12000,
        description: 'Ship with test credits.',
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
    }
} as const;

export type PlanType = keyof typeof PLANS;
