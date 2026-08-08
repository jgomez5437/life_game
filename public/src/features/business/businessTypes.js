// ─── BUSINESS TYPES & ENGINE DEFINITIONS ─────────────────────────────────────

export const HQ_TIERS = [
    {
        id: 'garage',
        name: 'Humble Garage',
        icon: 'fa-warehouse',
        cost: 0,
        monthlyRent: 0,
        capacityBonus: 1.0,
        moraleBonus: 0,
        maxEmployees: 5,
        description: 'Low overhead, humble beginnings. Ideal for bootstrapping.'
    },
    {
        id: 'incubator',
        name: 'Co-Working Incubator',
        icon: 'fa-laptop-house',
        cost: 15000,
        monthlyRent: 1500,
        capacityBonus: 1.25,
        moraleBonus: 5,
        maxEmployees: 20,
        description: 'Flexible desks, vibrant startup community, modest perks.'
    },
    {
        id: 'office_park',
        name: 'Suburban Office Park',
        icon: 'fa-building',
        cost: 75000,
        monthlyRent: 8000,
        capacityBonus: 1.75,
        moraleBonus: 15,
        maxEmployees: 75,
        description: 'Dedicated team office with private conference rooms and breakroom.'
    },
    {
        id: 'skyscraper',
        name: 'Downtown High-Rise Skyscraper',
        icon: 'fa-city',
        cost: 350000,
        monthlyRent: 35000,
        capacityBonus: 2.5,
        moraleBonus: 25,
        maxEmployees: 300,
        description: 'Prime skyline headquarters, prestige client impression, gym & cafeteria.'
    },
    {
        id: 'global_campus',
        name: 'Global Innovation Campus',
        icon: 'fa-landmark',
        cost: 1500000,
        monthlyRent: 120000,
        capacityBonus: 4.0,
        moraleBonus: 40,
        maxEmployees: 1500,
        description: 'World-class corporate campus with R&D labs, sports complex, and dining.'
    }
];

export const BUSINESS_INDUSTRIES = {
    tech_saas: {
        id: 'tech_saas',
        name: 'Cloud SaaS / Software',
        icon: 'fa-laptop-code',
        description: 'Subscription software model with recurring revenue, cloud infrastructure, high margins, and scale.',
        modelType: 'subscription',
        startupCost: 100000,
        baseDemand: 1500,
        unitPrice: 49,
        unitCost: 4,
        baseSalary: 6500,
        volatility: 0.25,
        capacityPerEmployee: 500,
        valuationMultiple: 8.0, // 8x ARR
        arpu: 49,
        baseChurnRate: 0.05
    },
    ecommerce: {
        id: 'ecommerce',
        name: 'E-Commerce & Direct-to-Consumer',
        icon: 'fa-shopping-cart',
        description: 'Physical product online retail. Customer acquisition ads, inventory management, and supplier logistics.',
        modelType: 'product',
        startupCost: 50000,
        baseDemand: 4000,
        unitPrice: 35,
        unitCost: 12,
        baseSalary: 3200,
        volatility: 0.20,
        capacityPerEmployee: 1200,
        valuationMultiple: 3.2,
        arpu: 35,
        baseChurnRate: 0.15
    },
    auto_tech: {
        id: 'auto_tech',
        name: 'EV & Automotive Manufacturing',
        icon: 'fa-car-battery',
        description: 'Capital-heavy hardware manufacturing with robotic assembly lines and high unit revenues.',
        modelType: 'product',
        startupCost: 750000,
        baseDemand: 600,
        unitPrice: 28000,
        unitCost: 19500,
        baseSalary: 4500,
        volatility: 0.15,
        capacityPerEmployee: 150,
        valuationMultiple: 2.2,
        arpu: 28000,
        baseChurnRate: 0.30
    },
    biotech: {
        id: 'biotech',
        name: 'BioTech & Pharmaceuticals',
        icon: 'fa-vial',
        description: 'High R&D pipeline spending with clinical trial milestones. High risk, massive breakthrough value.',
        modelType: 'pipeline',
        startupCost: 500000,
        baseDemand: 1000,
        unitPrice: 850,
        unitCost: 120,
        baseSalary: 7500,
        volatility: 0.40,
        capacityPerEmployee: 250,
        valuationMultiple: 6.0,
        arpu: 850,
        baseChurnRate: 0.08
    },
    fast_food: {
        id: 'fast_food',
        name: 'Fast Food & Dining Chain',
        icon: 'fa-utensils',
        description: 'High customer throughput, multi-location expansion, food cost management, and staff training.',
        modelType: 'product',
        startupCost: 120000,
        baseDemand: 12000,
        unitPrice: 14,
        unitCost: 4.50,
        baseSalary: 2400,
        volatility: 0.12,
        capacityPerEmployee: 2000,
        valuationMultiple: 2.5,
        arpu: 14,
        baseChurnRate: 0.20
    },
    real_estate_dev: {
        id: 'real_estate_dev',
        name: 'Commercial Real Estate Development',
        icon: 'fa-city',
        description: 'Acquiring land, construction development, multi-tenant leasing, and asset appreciation.',
        modelType: 'project',
        startupCost: 1000000,
        baseDemand: 25,
        unitPrice: 450000,
        unitCost: 310000,
        baseSalary: 6000,
        volatility: 0.25,
        capacityPerEmployee: 5,
        valuationMultiple: 3.5,
        arpu: 450000,
        baseChurnRate: 0.02
    }
};

export const MARKETING_CHANNELS = [
    {
        id: 'social_ads',
        name: 'Performance Digital Ads',
        icon: 'fa-ad',
        costPerLevel: 5000,
        demandBoost: 0.20,
        cacMultiplier: 1.0,
        description: 'Targeted ads on search engines and social feeds. Instant customer traffic.'
    },
    {
        id: 'seo_content',
        name: 'SEO & Inbound Marketing',
        icon: 'fa-search-dollar',
        costPerLevel: 8000,
        demandBoost: 0.15,
        cacMultiplier: 0.7,
        description: 'High quality content and search ranking. Lower long-term customer acquisition costs.'
    },
    {
        id: 'influencers',
        name: 'PR & Influencer Sponsorships',
        icon: 'fa-bullhorn',
        costPerLevel: 12000,
        demandBoost: 0.30,
        cacMultiplier: 1.2,
        description: 'Viral media buzz and key opinion leader endorsement. Massive brand awareness.'
    },
    {
        id: 'b2b_sales',
        name: 'Enterprise Sales Force',
        icon: 'fa-handshake',
        costPerLevel: 20000,
        demandBoost: 0.40,
        cacMultiplier: 1.5,
        description: 'Direct outbound sales reps closing high-ticket corporate contracts.'
    }
];

export const SPECIALIZED_ROLES = [
    {
        id: 'engineering',
        name: 'Engineers & Developers',
        icon: 'fa-code',
        avgSalary: 7500,
        benefit: '+Product quality & capacity'
    },
    {
        id: 'sales',
        name: 'Sales Account Execs',
        icon: 'fa-chart-line',
        avgSalary: 4800,
        benefit: '+Customer conversion rates'
    },
    {
        id: 'operations',
        name: 'Operations & QA Specialist',
        icon: 'fa-cogs',
        avgSalary: 4200,
        benefit: '-Defects & overhead waste'
    },
    {
        id: 'marketing',
        name: 'Growth & Brand Marketers',
        icon: 'fa-bullhorn',
        avgSalary: 5000,
        benefit: '+Marketing ad efficiency'
    }
];

export const VC_INVESTOR_TYPES = [
    {
        id: 'angel',
        name: 'Angel Syndicate',
        stage: 'Pre-Seed / Seed',
        minValuation: 200000,
        maxInvestment: 250000,
        equityTarget: 0.15,
        personality: 'Founder-friendly, mentors early founders with lenient growth demands.'
    },
    {
        id: 'seed_vc',
        name: 'Apex Seed Ventures',
        stage: 'Seed Stage',
        minValuation: 1000000,
        maxInvestment: 1500000,
        equityTarget: 0.20,
        personality: 'Demands aggressive product roadmap expansion and quick revenue traction.'
    },
    {
        id: 'growth_vc',
        name: 'Horizon Growth Partners',
        stage: 'Series A / B',
        minValuation: 5000000,
        maxInvestment: 10000000,
        equityTarget: 0.25,
        personality: 'Institutional VC looking for 3x year-over-year revenue expansion and high market share.'
    },
    {
        id: 'pe_firm',
        name: 'Blackstone Capital PE',
        stage: 'Private Equity / Buyout',
        minValuation: 25000000,
        maxInvestment: 50000000,
        equityTarget: 0.40,
        personality: 'Strict financial discipline focusing on cash flow, EBITDA margins, and potential IPO.'
    }
];

export const BUSINESS_DECISION_EVENTS = [
    {
        id: 'pr_crisis',
        name: 'PR & Product Safety Crisis',
        icon: 'fa-fire-extinguisher',
        description: 'A faulty product batch or viral customer complaint is trending on social media.',
        choices: [
            {
                text: 'Issue full refund, recall batch & public apology',
                cost: 25000,
                repDelta: +5,
                moraleDelta: +5,
                churnDelta: -0.02,
                logText: 'You handled the PR crisis transparently. Customers respected the integrity.'
            },
            {
                text: 'Deny claims & launch counter-PR campaign',
                cost: 10000,
                repDelta: -15,
                moraleDelta: -10,
                churnDelta: +0.05,
                logText: 'The counter-PR campaign felt tone-deaf. Reputation took a hit.'
            },
            {
                text: 'Ignore the noise and let it pass',
                cost: 0,
                repDelta: -30,
                moraleDelta: -15,
                churnDelta: +0.10,
                logText: 'Ignoring the viral backlash hurt your brand perception significantly.'
            }
        ]
    },
    {
        id: 'poach_exec',
        name: 'Rival Poaching Key Tech Lead',
        icon: 'fa-user-ninja',
        description: 'A major competitor offered your top Lead Architect double their current salary.',
        choices: [
            {
                text: 'Match salary + offer 2% equity retention bonus',
                cost: 15000,
                repDelta: +2,
                moraleDelta: +15,
                churnDelta: 0,
                logText: 'You retained your core technical talent and boosted employee morale!'
            },
            {
                text: 'Let them walk & recruit a junior replacement',
                cost: 0,
                repDelta: 0,
                moraleDelta: -10,
                churnDelta: +0.02,
                logText: 'The tech lead departed. Transitioning to new staff slowed development.'
            }
        ]
    },
    {
        id: 'patent_lawsuit',
        name: 'Patent Infringement Lawsuit',
        icon: 'fa-gavel',
        description: 'A patent troll firm filed a lawsuit claiming your flagship feature infringes on their patent.',
        choices: [
            {
                text: 'Settle out of court with legal team',
                cost: 50000,
                repDelta: 0,
                moraleDelta: 0,
                churnDelta: 0,
                logText: 'Settled the lawsuit quickly without prolonged court distraction.'
            },
            {
                text: 'Fight in court with top defense attorneys',
                cost: 100000,
                repDelta: +10,
                moraleDelta: +5,
                churnDelta: 0,
                logText: 'You won the court trial! Your legal victory strengthened your industry standing.'
            }
        ]
    },
    {
        id: 'b2b_landfall',
        name: 'Fortune 500 Enterprise Deal',
        icon: 'fa-file-signature',
        description: 'A global conglomerate wants to sign an exclusive multi-year procurement contract.',
        choices: [
            {
                text: 'Sign exclusive deal (Requires $40k upfront scaling investment)',
                cost: 40000,
                repDelta: +25,
                moraleDelta: +10,
                revenueBonus: 150000,
                logText: 'Secured landmark Enterprise deal! Revenue and valuation skyrocketed.'
            },
            {
                text: 'Decline exclusivity to maintain independence',
                cost: 0,
                repDelta: +5,
                moraleDelta: 0,
                revenueBonus: 30000,
                logText: 'Kept company independent while closing a standard multi-client deal.'
            }
        ]
    }
];
