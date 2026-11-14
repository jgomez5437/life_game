import { state, addLog } from '../state.js';
import { isAlive } from './playerStatsLogic.js';

// --- INVESTMENTS & STOCK MARKET SYSTEM ---
export const INITIAL_STOCKS = [
    {
        symbol: 'AETH',
        name: 'Aether Tech',
        sector: 'Technology',
        basePrice: 180,
        price: 180,
        prevPrice: 180,
        volatility: 0.22,
        dividendYield: 0.0,
        desc: 'Global AI, semiconductor, and hardware innovation pioneer.',
        icon: 'fa-microchip',
        color: 'text-cyan-400',
        priceHistory: [165, 172, 168, 175, 180]
    },
    {
        symbol: 'BYTE',
        name: 'Byte Dynamics',
        sector: 'Cybersecurity',
        basePrice: 95,
        price: 95,
        prevPrice: 95,
        volatility: 0.18,
        dividendYield: 0.005,
        desc: 'Enterprise cloud infrastructure and cybersecurity solutions.',
        icon: 'fa-shield-halved',
        color: 'text-indigo-400',
        priceHistory: [88, 90, 92, 91, 95]
    },
    {
        symbol: 'CURE',
        name: 'BioCure Labs',
        sector: 'Healthcare & Biotech',
        basePrice: 45,
        price: 45,
        prevPrice: 45,
        volatility: 0.32,
        dividendYield: 0.0,
        desc: 'Clinical biotech firm developing novel gene therapies.',
        icon: 'fa-dna',
        color: 'text-emerald-400',
        priceHistory: [38, 52, 41, 48, 45]
    },
    {
        symbol: 'VND',
        name: 'Vanguard Shield',
        sector: 'Financials',
        basePrice: 120,
        price: 120,
        prevPrice: 120,
        volatility: 0.10,
        dividendYield: 0.032,
        desc: 'Global investment banking, wealth management & insurance.',
        icon: 'fa-building-columns',
        color: 'text-amber-400',
        priceHistory: [112, 115, 117, 118, 120]
    },
    {
        symbol: 'SOLR',
        name: 'Solaris Energy',
        sector: 'Renewable Energy',
        basePrice: 65,
        price: 65,
        prevPrice: 65,
        volatility: 0.24,
        dividendYield: 0.010,
        desc: 'Solar panel manufacturer and grid battery storage operator.',
        icon: 'fa-sun',
        color: 'text-yellow-400',
        priceHistory: [55, 60, 58, 62, 65]
    },
    {
        symbol: 'APEX',
        name: 'Apex Petroleum',
        sector: 'Energy',
        basePrice: 110,
        price: 110,
        prevPrice: 110,
        volatility: 0.15,
        dividendYield: 0.045,
        desc: 'Multinational oil exploration, natural gas & refining conglomerate.',
        icon: 'fa-oil-well',
        color: 'text-orange-400',
        priceHistory: [102, 105, 108, 104, 110]
    },
    {
        symbol: 'SHOP',
        name: 'HyperCart Retail',
        sector: 'Consumer Goods',
        basePrice: 140,
        price: 140,
        prevPrice: 140,
        volatility: 0.12,
        dividendYield: 0.018,
        desc: 'E-commerce logistics powerhouse and omni-channel retail chain.',
        icon: 'fa-cart-shopping',
        color: 'text-blue-400',
        priceHistory: [130, 134, 136, 138, 140]
    },
    {
        symbol: 'ORBT',
        name: 'OrbitX Aerospace',
        sector: 'Aerospace & Defense',
        basePrice: 210,
        price: 210,
        prevPrice: 210,
        volatility: 0.16,
        dividendYield: 0.020,
        desc: 'Satellite launch systems and defense technology contractor.',
        icon: 'fa-rocket',
        color: 'text-purple-400',
        priceHistory: [195, 200, 204, 208, 210]
    },
    {
        symbol: 'PIX',
        name: 'Pixelverse Media',
        sector: 'Entertainment',
        basePrice: 75,
        price: 75,
        prevPrice: 75,
        volatility: 0.19,
        dividendYield: 0.012,
        desc: 'Global media franchise, video streaming network, and interactive gaming.',
        icon: 'fa-gamepad',
        color: 'text-pink-400',
        priceHistory: [68, 70, 72, 74, 75]
    },
    {
        symbol: 'APXS',
        name: 'Apex Semiconductor',
        sector: 'Technology',
        basePrice: 145,
        price: 145,
        prevPrice: 145,
        volatility: 0.25,
        dividendYield: 0.010,
        desc: 'Precision microchip fabrication and foundry partner for mobile & auto tech.',
        icon: 'fa-microchip',
        color: 'text-cyan-400',
        priceHistory: [132, 138, 140, 142, 145]
    },
    {
        symbol: 'NEUR',
        name: 'NeuralNet AI',
        sector: 'Technology',
        basePrice: 230,
        price: 230,
        prevPrice: 230,
        volatility: 0.30,
        dividendYield: 0.0,
        desc: 'Autonomous AI models, robotics intelligence, and enterprise automation.',
        icon: 'fa-brain',
        color: 'text-cyan-300',
        priceHistory: [190, 210, 205, 220, 230]
    },
    {
        symbol: 'ZTRS',
        name: 'ZeroTrust Systems',
        sector: 'Cybersecurity',
        basePrice: 82,
        price: 82,
        prevPrice: 82,
        volatility: 0.19,
        dividendYield: 0.0,
        desc: 'Identity verification and zero-trust perimeter protection software.',
        icon: 'fa-lock',
        color: 'text-indigo-400',
        priceHistory: [75, 78, 76, 80, 82]
    },
    {
        symbol: 'GENO',
        name: 'Genova Pharma',
        sector: 'Healthcare & Biotech',
        basePrice: 115,
        price: 115,
        prevPrice: 115,
        volatility: 0.16,
        dividendYield: 0.022,
        desc: 'Pharmaceutical giant specializing in rare immunology & cardiology treatments.',
        icon: 'fa-pills',
        color: 'text-emerald-400',
        priceHistory: [108, 110, 112, 114, 115]
    },
    {
        symbol: 'PLSE',
        name: 'Pulse Medical',
        sector: 'Healthcare & Biotech',
        basePrice: 78,
        price: 78,
        prevPrice: 78,
        volatility: 0.14,
        dividendYield: 0.015,
        desc: 'Surgical robotics, cardiac implants, and diagnostic monitoring systems.',
        icon: 'fa-heart-pulse',
        color: 'text-emerald-300',
        priceHistory: [72, 74, 75, 76, 78]
    },
    {
        symbol: 'PRUD',
        name: 'Prudential Trust',
        sector: 'Financials',
        basePrice: 155,
        price: 155,
        prevPrice: 155,
        volatility: 0.08,
        dividendYield: 0.038,
        desc: 'Commercial insurance underwriting and institutional asset management.',
        icon: 'fa-vault',
        color: 'text-amber-400',
        priceHistory: [148, 150, 152, 153, 155]
    },
    {
        symbol: 'FTG',
        name: 'FinTech Global',
        sector: 'Financials',
        basePrice: 62,
        price: 62,
        prevPrice: 62,
        volatility: 0.21,
        dividendYield: 0.008,
        desc: 'Digital payment gateway, merchant acquiring, and mobile banking app.',
        icon: 'fa-credit-card',
        color: 'text-amber-300',
        priceHistory: [54, 58, 56, 60, 62]
    },
    {
        symbol: 'HYDR',
        name: 'HydroPower Systems',
        sector: 'Renewable Energy',
        basePrice: 42,
        price: 42,
        prevPrice: 42,
        volatility: 0.20,
        dividendYield: 0.012,
        desc: 'Hydroelectric dam turbines and green hydrogen fuel storage solutions.',
        icon: 'fa-water',
        color: 'text-yellow-400',
        priceHistory: [36, 38, 40, 39, 42]
    },
    {
        symbol: 'TITN',
        name: 'Titan Power & Gas',
        sector: 'Energy',
        basePrice: 88,
        price: 88,
        prevPrice: 88,
        volatility: 0.11,
        dividendYield: 0.042,
        desc: 'Regulated electric power utility and regional natural gas pipelines.',
        icon: 'fa-bolt',
        color: 'text-orange-400',
        priceHistory: [82, 84, 85, 86, 88]
    },
    {
        symbol: 'WEAR',
        name: 'OmniWear Apparel',
        sector: 'Consumer Goods',
        basePrice: 55,
        price: 55,
        prevPrice: 55,
        volatility: 0.15,
        dividendYield: 0.025,
        desc: 'Global athletic footwear, sportswear brands, and outdoor gear.',
        icon: 'fa-shirt',
        color: 'text-blue-400',
        priceHistory: [50, 52, 51, 53, 55]
    },
    {
        symbol: 'FBITE',
        name: 'FreshBite Foods',
        sector: 'Consumer Goods',
        basePrice: 68,
        price: 68,
        prevPrice: 68,
        volatility: 0.09,
        dividendYield: 0.030,
        desc: 'Packaged organic foods, beverage distribution, and grocery brand portfolio.',
        icon: 'fa-utensils',
        color: 'text-blue-300',
        priceHistory: [64, 65, 66, 67, 68]
    },
    {
        symbol: 'STEL',
        name: 'Stellar Propulsion',
        sector: 'Aerospace & Defense',
        basePrice: 175,
        price: 175,
        prevPrice: 175,
        volatility: 0.17,
        dividendYield: 0.018,
        desc: 'Jet engines, hypersonic test vehicles, and military flight systems.',
        icon: 'fa-plane',
        color: 'text-purple-400',
        priceHistory: [160, 166, 168, 172, 175]
    },
    {
        symbol: 'STRM',
        name: 'StreamMax Global',
        sector: 'Entertainment',
        basePrice: 52,
        price: 52,
        prevPrice: 52,
        volatility: 0.22,
        dividendYield: 0.005,
        desc: 'Subscription video-on-demand platform and live sports broadcasting.',
        icon: 'fa-tv',
        color: 'text-pink-400',
        priceHistory: [45, 48, 47, 50, 52]
    }
];

export const BLOG_TEMPLATES = [
    {
        symbol: 'AETH',
        bullish: {
            title: 'Aether Tech AI Chip Leak Crushes Benchmarks',
            author: 'TechInsider Blog',
            excerpt: 'Insiders report Aether Tech’s next-gen neural processing units are outperforming competitors by 40%. Wall Street analysts are raising target estimates ahead of release.',
            impact: 0.28
        },
        bearish: {
            title: 'Supply Shortages Cripple Aether Tech Production',
            author: 'Silicon Wire',
            excerpt: 'Global wafer shortages and fabrication delays are projected to push back Aether Tech’s major product rollout, triggering analyst downgrades.',
            impact: -0.25
        }
    },
    {
        symbol: 'BYTE',
        bullish: {
            title: 'Cybersecurity Surge: Byte Dynamics Signs Multi-Billion Enterprise Deals',
            author: 'Cloud & Security Journal',
            excerpt: 'A surge in enterprise security mandates has led Byte Dynamics to record high recurring revenue growth this quarter.',
            impact: 0.22
        },
        bearish: {
            title: 'Price War Threatens Byte Dynamics Margins',
            author: 'Enterprise Tech Watch',
            excerpt: 'Aggressive price discounting by cloud rivals is putting pressure on Byte Dynamics’ software subscription margins.',
            impact: -0.20
        }
    },
    {
        symbol: 'CURE',
        bullish: {
            title: 'FDA Grants Breakthrough Status to BioCure Oncology Drug',
            author: 'BioPharma Daily',
            excerpt: 'BioCure Labs received expedited FDA review approval for its promising gene therapy treatment, sparking immense investor optimism.',
            impact: 0.40
        },
        bearish: {
            title: 'BioCure Labs Phase 3 Trial Fails Efficacy Thresholds',
            author: 'Biotech Clinical Review',
            excerpt: 'Trial data for BioCure’s lead candidate fell short of primary endpoints, causing concerns over trial continuation.',
            impact: -0.38
        }
    },
    {
        symbol: 'VND',
        bullish: {
            title: 'Vanguard Shield Posts Record Trading Income',
            author: 'Wall Street Chronicle',
            excerpt: 'Higher interest margins and robust investment banking activity drove net profits to historic highs for Vanguard Shield.',
            impact: 0.15
        },
        bearish: {
            title: 'Commercial Credit Defaults Drag Vanguard Shield Profits',
            author: 'Financial Times',
            excerpt: 'Vanguard Shield announced increased provisions for loan losses due to stress in commercial property portfolios.',
            impact: -0.16
        }
    },
    {
        symbol: 'SOLR',
        bullish: {
            title: 'Solaris Energy Awarded Massive Federal Grid Grant',
            author: 'Green Energy Outlook',
            excerpt: 'Solaris Energy will supply battery storage systems for a state-wide clean energy overhaul, bolstering long-term revenue backlog.',
            impact: 0.30
        },
        bearish: {
            title: 'Tariff Escalation Hits Solaris Energy Supply Chain',
            author: 'Renewable Business Weekly',
            excerpt: 'Raw material import tariffs on rare earth minerals threaten solar cell production costs for Solaris Energy.',
            impact: -0.24
        }
    },
    {
        symbol: 'APEX',
        bullish: {
            title: 'OPEC Output Cuts Rally Crude Prices; Apex Petroleum Outperforms',
            author: 'Commodity Trader Monthly',
            excerpt: 'Tight global crude supplies and new offshore strikes position Apex Petroleum for strong free cash flow and dividend hikes.',
            impact: 0.20
        },
        bearish: {
            title: 'Regulatory Crackdowns Target Apex Petroleum Offshore Drilling',
            author: 'Energy Market Monitor',
            excerpt: 'Environmental compliance costs and offshore drilling restrictions are pressuring Apex Petroleum’s exploration guidance.',
            impact: -0.18
        }
    },
    {
        symbol: 'SHOP',
        bullish: {
            title: 'HyperCart Retail Reports Monster Holiday Shopping Figures',
            author: 'Consumer Retail Digest',
            excerpt: 'Record e-commerce order volumes and same-day delivery expansion drove HyperCart’s quarterly earnings past consensus.',
            impact: 0.18
        },
        bearish: {
            title: 'Consumer Spending Slowdown Bites HyperCart Logistics',
            author: 'Retail Analyst Weekly',
            excerpt: 'Softening consumer confidence and elevated freight expenditures weigh heavily on HyperCart Retail’s operating outlook.',
            impact: -0.17
        }
    },
    {
        symbol: 'ORBT',
        bullish: {
            title: 'OrbitX Aerospace Secures $4.5B Defense Satellite Contract',
            author: 'Defense Tech Insider',
            excerpt: 'The Department of Defense awarded OrbitX Aerospace a massive contract for next-gen satellite launch infrastructure.',
            impact: 0.25
        },
        bearish: {
            title: 'Payload Anomaly Triggers Delay for OrbitX Orbital Launch',
            author: 'Space Operations Journal',
            excerpt: 'Pre-flight technical glitches have grounded OrbitX’s flagship rocket booster, delaying lucrative commercial missions.',
            impact: -0.22
        }
    },
    {
        symbol: 'PIX',
        bullish: {
            title: 'Pixelverse Media Franchise Launch Breaks Entertainment Records',
            author: 'Hollywood & Gaming Review',
            excerpt: 'Pixelverse Media’s blockbuster game release and companion streaming series drove unprecedented subscriber growth.',
            impact: 0.26
        },
        bearish: {
            title: 'Streaming Subscriber Churn Hits Pixelverse Media',
            author: 'Digital Media Trends',
            excerpt: 'Heightened competition in digital streaming led to unexpected subscriber cancellations for Pixelverse Media.',
            impact: -0.21
        }
    }
];

export function ensureInvestmentState(user) {
    if (!user.investments) {
        user.investments = {
            savings: 0,
            stocks: {},
            stockMarket: JSON.parse(JSON.stringify(INITIAL_STOCKS)),
            blogPosts: []
        };
    }
    if (typeof user.investments.savings !== 'number') user.investments.savings = 0;
    if (!user.investments.stocks) user.investments.stocks = {};
    if (!user.investments.stockMarket || user.investments.stockMarket.length === 0) {
        user.investments.stockMarket = JSON.parse(JSON.stringify(INITIAL_STOCKS));
    }
    if (!user.investments.blogPosts) user.investments.blogPosts = [];
    
    // Ensure all initial stocks are present in market
    INITIAL_STOCKS.forEach(initStock => {
        const existing = user.investments.stockMarket.find(s => s.symbol === initStock.symbol);
        if (!existing) {
            user.investments.stockMarket.push(JSON.parse(JSON.stringify(initStock)));
        } else {
            if (!existing.priceHistory) existing.priceHistory = [existing.price || initStock.basePrice];
        }
    });

    if (user.age >= 18 && user.investments.blogPosts.length === 0) {
        user.investments.blogPosts = generateInvestmentBlogPosts(user.investments.stockMarket, user.age);
    }
}

export function generateInvestmentBlogPosts(stockMarket, age) {
    const shuffled = [...BLOG_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    return selected.map((tpl, i) => {
        const isBullish = Math.random() < 0.5;
        const data = isBullish ? tpl.bullish : tpl.bearish;
        const stock = stockMarket.find(s => s.symbol === tpl.symbol);

        return {
            id: `blog_${age}_${i}_${Date.now()}`,
            title: data.title,
            author: data.author,
            symbol: tpl.symbol,
            stockName: stock ? stock.name : tpl.symbol,
            sector: stock ? stock.sector : 'General',
            sentiment: isBullish ? 'bullish' : 'bearish',
            impact: data.impact,
            excerpt: data.excerpt,
            age: age
        };
    });
}

export function processInvestmentsAgeUp(user) {
    ensureInvestmentState(user);

    // 1. High-Yield Savings 3.5% APY compounding
    let savingsInterest = 0;
    if (user.investments.savings > 0) {
        savingsInterest = Math.floor(user.investments.savings * 0.035);
        user.investments.savings += savingsInterest;
        if (savingsInterest > 0) {
            addLog(`Your High-Yield Savings Account earned $${savingsInterest.toLocaleString()} in interest (3.5% APY).`, 'good');
        }
    }

    // 2. Stock Market Annual Price Simulation
    const generalMarketDrift = (Math.random() - 0.47) * 0.08; // mild bullish market bias
    const activeBlogs = user.investments.blogPosts || [];
    let totalDividends = 0;

    user.investments.stockMarket.forEach(stock => {
        // Check for active blog hint for this stock
        const hint = activeBlogs.find(b => b.symbol === stock.symbol);
        const hintImpact = hint ? hint.impact : 0;

        const randomNoise = (Math.random() + Math.random() - 1.0) * (stock.volatility || 0.15);

        const totalPctChange = generalMarketDrift + randomNoise + hintImpact;
        const clampedChange = Math.max(-0.55, Math.min(0.75, totalPctChange));

        stock.prevPrice = stock.price;
        const newPrice = Math.max(2.50, Math.round((stock.price * (1 + clampedChange)) * 100) / 100);
        stock.price = newPrice;

        if (!stock.priceHistory) stock.priceHistory = [];
        stock.priceHistory.push(newPrice);
        if (stock.priceHistory.length > 8) {
            stock.priceHistory.shift();
        }

        // Dividend payout if user owns shares
        const holding = user.investments.stocks[stock.symbol];
        if (holding && holding.shares > 0 && stock.dividendYield > 0) {
            const divAmount = Math.floor(holding.shares * stock.price * stock.dividendYield);
            if (divAmount > 0) {
                user.money += divAmount;
                totalDividends += divAmount;
            }
        }
    });

    if (totalDividends > 0) {
        addLog(`Received $${totalDividends.toLocaleString()} in cash dividends from your stock portfolio!`, 'good');
    }

    // 3. Generate NEW blog posts for next year
    user.investments.blogPosts = generateInvestmentBlogPosts(user.investments.stockMarket, user.age);
}

export function buyStock(user, symbol, quantity) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot trade stocks while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const sharesToBuy = parseInt(quantity, 10);
    if (isNaN(sharesToBuy) || sharesToBuy <= 0) {
        return { success: false, msg: 'Invalid share quantity.' };
    }

    const stock = user.investments.stockMarket.find(s => s.symbol === symbol);
    if (!stock) {
        return { success: false, msg: 'Stock not found.' };
    }

    const totalCost = Math.round(stock.price * sharesToBuy);
    if (user.money < totalCost) {
        return { success: false, msg: `Insufficient funds. You need $${totalCost.toLocaleString()} to buy ${sharesToBuy} shares of ${symbol}.` };
    }

    user.money -= totalCost;
    if (!user.investments.stocks[symbol]) {
        user.investments.stocks[symbol] = { shares: 0, totalCost: 0 };
    }

    user.investments.stocks[symbol].shares += sharesToBuy;
    user.investments.stocks[symbol].totalCost += totalCost;

    return {
        success: true,
        msg: `Successfully purchased ${sharesToBuy} shares of ${stock.name} (${symbol}) for $${totalCost.toLocaleString()}.`
    };
}

export function sellStock(user, symbol, quantity) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot trade stocks while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const sharesToSell = parseInt(quantity, 10);
    if (isNaN(sharesToSell) || sharesToSell <= 0) {
        return { success: false, msg: 'Invalid share quantity.' };
    }

    const holding = user.investments.stocks[symbol];
    if (!holding || holding.shares < sharesToSell) {
        return { success: false, msg: `You do not own ${sharesToSell} shares of ${symbol}.` };
    }

    const stock = user.investments.stockMarket.find(s => s.symbol === symbol);
    if (!stock) {
        return { success: false, msg: 'Stock not found.' };
    }

    const totalProceeds = Math.round(stock.price * sharesToSell);
    const avgCostPerShare = holding.totalCost / holding.shares;
    const costBasisRemoved = Math.round(avgCostPerShare * sharesToSell);

    user.money += totalProceeds;
    holding.shares -= sharesToSell;
    holding.totalCost -= costBasisRemoved;

    if (holding.shares <= 0) {
        delete user.investments.stocks[symbol];
    }

    return {
        success: true,
        msg: `Successfully sold ${sharesToSell} shares of ${stock.name} (${symbol}) for $${totalProceeds.toLocaleString()}.`
    };
}

export function depositSavings(user, amount) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot manage savings while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const depositAmt = parseInt(amount, 10);
    if (isNaN(depositAmt) || depositAmt <= 0) {
        return { success: false, msg: 'Invalid deposit amount.' };
    }

    if (user.money < depositAmt) {
        return { success: false, msg: 'Insufficient cash funds available.' };
    }

    user.money -= depositAmt;
    user.investments.savings += depositAmt;

    return {
        success: true,
        msg: `Deposited $${depositAmt.toLocaleString()} into High-Yield Savings.`
    };
}

export function withdrawSavings(user, amount) {
    if (!isAlive(user)) return { success: false, msg: 'Cannot manage savings while dead or at 0 HP.' };
    ensureInvestmentState(user);
    const withdrawAmt = parseInt(amount, 10);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
        return { success: false, msg: 'Invalid withdrawal amount.' };
    }

    if (user.investments.savings < withdrawAmt) {
        return { success: false, msg: 'Insufficient funds in High-Yield Savings.' };
    }

    user.investments.savings -= withdrawAmt;
    user.money += withdrawAmt;

    return {
        success: true,
        msg: `Withdrew $${withdrawAmt.toLocaleString()} from High-Yield Savings.`
    };
}
