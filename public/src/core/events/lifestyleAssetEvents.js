import { GameLogic } from '../gameLogic.js';
import { getSkillXpSafe, getUserStat, ensureEventFlags } from './eventHelpers.js';

export const LIFESTYLE_ASSET_EVENTS = {
    // ==========================================
    // HEALTH / GENERAL (Universal)
    // ==========================================
    flu_season: {
        id: "flu_season",
        category: "general",
        type: "health_penalty",
        minAge: 10,
        maxAge: 100,
        probability: 0.08,
        priority: 10,
        cooldownYears: 5,
        condition: (user) => {
            const health = getUserStat(user, 'health', 100);
            return health < 80 && health > 30;
        },
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Flu Season",
            badge: "Health Event",
            badgeColor: "bg-red-600",
            avatar: null,
            narrative: "You've caught a nasty strain of the seasonal flu. How do you want to handle it?",
            options: [
                {
                    id: "rest",
                    title: "Rest at home (Free)",
                    description: "Tough it out",
                    icon: "fa-bed",
                    color: "slate"
                },
                {
                    id: "doctor",
                    title: "Visit Doctor ($150)",
                    description: "Get medicine",
                    icon: "fa-user-md",
                    color: "blue",
                    badge: "$150",
                    disabled: (user.money ?? 0) < 150
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "rest") {
                GameLogic.adjustStat(user, 'health', -10);
                GameLogic.adjustStat(user, 'happiness', -5);
                return {
                    log: "You rested at home but still feel miserable.",
                    logType: "bad"
                };
            } else if (choiceId === "doctor") {
                user.money = Math.max(0, (user.money ?? 0) - 150);
                GameLogic.adjustStat(user, 'health', 5);
                return {
                    log: "The doctor prescribed medication and you're recovering.",
                    logType: "good"
                };
            }
        }
    },

    // ==========================================
    // SUBTLE LIFESTYLE & HABIT-DRIVEN EVENTS
    // ==========================================
    junk_diet_wake_up_call: {
        id: "junk_diet_wake_up_call",
        category: "health",
        minAge: 24,
        maxAge: 75,
        probability: 0.45,
        priority: 55,
        oncePerLife: true,
        condition: (user) => {
            const junkYears = user.lifeEventFlags?.junkDietYears || 0;
            const health = getUserStat(user, 'health', 100);
            return user.age >= 24 && user.age <= 75 && junkYears >= 3 && health < 80;
        },
        getTargetNPC: () => null,
        render: (user) => {
            const userMoney = user.money ?? 0;
            return {
                title: "Lifestyle Wake-Up Call",
                badge: "Health Warning",
                badgeColor: "bg-red-600",
                avatar: null,
                narrative: "Years of skipping workouts and relying on fast food finally caught up with you—climbing a single flight of stairs leaves you dizzy and short of breath.",
                options: [
                    {
                        id: "overhaul_diet",
                        title: "Overhaul Diet & Start Daily Walks",
                        description: "Switch to a Balanced Diet immediately",
                        icon: "fa-apple-alt",
                        color: "emerald"
                    },
                    {
                        id: "executive_screening",
                        title: "Book Full Medical Screening ($500)",
                        description: "Get bloodwork and a tailored wellness plan",
                        icon: "fa-stethoscope",
                        color: "blue",
                        badge: "$500",
                        disabled: userMoney < 500
                    },
                    {
                        id: "ignore_warning",
                        title: "Shrug It Off & Order Fries",
                        description: "Convince yourself you're just tired",
                        icon: "fa-hamburger",
                        color: "amber"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const flags = ensureEventFlags(user);
            if (choiceId === "overhaul_diet") {
                user.diet = 'balanced';
                user.hasBetterDiet = true;
                flags.junkDietYears = 0;
                GameLogic.adjustStat(user, 'health', 12);
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "You cleared out your pantry, started daily brisk walks, and switched to a Balanced Diet!",
                    logType: "good",
                    badges: [{ label: "Balanced Diet Active", tone: "good" }]
                };
            } else if (choiceId === "executive_screening") {
                user.money = Math.max(0, (user.money ?? 0) - 500);
                user.diet = 'balanced';
                user.hasBetterDiet = true;
                flags.junkDietYears = 0;
                GameLogic.adjustStat(user, 'health', 18);
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "Your doctor caught early warning signs just in time and put you on a recovery regimen.",
                    logType: "good",
                    badges: [{ label: "Balanced Diet Active", tone: "good" }]
                };
            } else {
                flags.ignored_health_warning = true;
                GameLogic.adjustStat(user, 'health', -10);
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "You brushed off the warning signs and grabbed a greasy combo meal on the way home.",
                    logType: "bad"
                };
            }
        }
    },

    uninsured_jewelry_mugger: {
        id: "uninsured_jewelry_mugger",
        category: "lifestyle",
        minAge: 18,
        maxAge: 85,
        probability: 0.35,
        priority: 60,
        cooldownYears: 8,
        condition: (user) => {
            return (user.assets || []).some(a =>
                a.category === 'jewelry' && a.wearing && !a.insured && (a.value || 0) >= 5000
            );
        },
        getTargetNPC: () => null,
        render: (user) => {
            const piece = (user.assets || []).find(a =>
                a.category === 'jewelry' && a.wearing && !a.insured && (a.value || 0) >= 5000
            );
            const pieceName = piece ? piece.name : "luxury jewelry";
            const martialXp = getSkillXpSafe(user, 'martial_arts');

            return {
                title: "Flashing Uninsured Bling",
                badge: "Street Encounter",
                badgeColor: "bg-red-700",
                avatar: null,
                narrative: `Walking down a dimly lit block wearing your uninsured ${pieceName}, an opportunistic mugger steps out and demands you hand it over!`,
                options: [
                    {
                        id: "martial_arts_disarm",
                        title: "Disarm the Mugger",
                        description: "Use trained self-defense to neutralize the threat",
                        icon: "fa-hand-rock",
                        color: "emerald",
                        badge: "Martial Arts 40+",
                        disabled: martialXp < 40
                    },
                    {
                        id: "outsmart_decoy",
                        title: "Distract & Bolt",
                        description: "Use quick thinking to slip past them",
                        icon: "fa-brain",
                        color: "indigo",
                        badge: "Smarts 65+"
                    },
                    {
                        id: "hand_over_jewelry",
                        title: "Hand Over the Piece Safely",
                        description: "Avoid injury and surrender the uninsured item",
                        icon: "fa-gem",
                        color: "amber"
                    },
                    {
                        id: "fight_untrained",
                        title: "Swing Wildly",
                        description: "Refuse to give it up without a brawl",
                        icon: "fa-fist-raised",
                        color: "red"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = getUserStat(user, 'smarts', 50);
            const idx = (user.assets || []).findIndex(a =>
                a.category === 'jewelry' && a.wearing && !a.insured && (a.value || 0) >= 5000
            );
            const piece = idx >= 0 ? user.assets[idx] : null;
            const pieceName = piece ? piece.name : "luxury jewelry";

            if (choiceId === "martial_arts_disarm") {
                GameLogic.adjustStat(user, 'happiness', 15);
                GameLogic.adjustStat(user, 'looks', 5);
                return {
                    log: `Your Martial Arts training kicked in! You swept the mugger's stance, kept your ${pieceName}, and walked away unscathed.`,
                    logType: "good",
                    badges: [{ label: "Protected Asset", tone: "good" }]
                };
            } else if (choiceId === "outsmart_decoy") {
                if (userSmarts >= 65) {
                    GameLogic.adjustStat(user, 'smarts', 8);
                    GameLogic.adjustStat(user, 'happiness', 12);
                    return {
                        log: `You pointed behind them shouting "Police!", sprinted into a crowded lobby, and saved your ${pieceName}!`,
                        logType: "good"
                    };
                } else {
                    if (idx >= 0) user.assets.splice(idx, 1);
                    GameLogic.adjustStat(user, 'health', -10);
                    GameLogic.adjustStat(user, 'happiness', -20);
                    return {
                        log: `Your bluff failed. They shoved you down and made off with your uninsured ${pieceName}!`,
                        logType: "bad",
                        badges: [{ label: `Lost ${pieceName}`, tone: "bad" }]
                    };
                }
            } else if (choiceId === "hand_over_jewelry") {
                if (idx >= 0) user.assets.splice(idx, 1);
                GameLogic.adjustStat(user, 'happiness', -20);
                return {
                    log: `You stayed safe by handing over your uninsured ${pieceName}. That hurts—time to insure valuables next time.`,
                    logType: "bad",
                    badges: [{ label: `Lost ${pieceName}`, tone: "bad" }]
                };
            } else {
                if (Math.random() < 0.4) {
                    GameLogic.adjustStat(user, 'health', -10);
                    GameLogic.adjustStat(user, 'happiness', 10);
                    return {
                        log: `You took a bruised rib in the scuffle, but chased the mugger off and kept your ${pieceName}!`,
                        logType: "neutral"
                    };
                } else {
                    if (idx >= 0) user.assets.splice(idx, 1);
                    GameLogic.adjustStat(user, 'health', -20);
                    GameLogic.adjustStat(user, 'happiness', -25);
                    return {
                        log: `You were overpowered in the alley and lost your uninsured ${pieceName}.`,
                        logType: "bad",
                        badges: [{ label: `Lost ${pieceName}`, tone: "bad" }]
                    };
                }
            }
        }
    },

    beater_car_highway_breakdown: {
        id: "beater_car_highway_breakdown",
        category: "lifestyle",
        minAge: 16,
        maxAge: 85,
        probability: 0.38,
        priority: 55,
        cooldownYears: 5,
        condition: (user) => {
            return (user.assets || []).some(a =>
                a.category === 'vehicle' && (a.condition ?? 100) <= 35 && (a.condition ?? 100) > 0
            );
        },
        getTargetNPC: () => null,
        render: (user) => {
            const car = (user.assets || []).find(a =>
                a.category === 'vehicle' && (a.condition ?? 100) <= 35 && (a.condition ?? 100) > 0
            );
            const carName = car ? car.name : "vehicle";
            const tradesXp = getSkillXpSafe(user, 'trades_tech');
            const userMoney = user.money ?? 0;

            return {
                title: "Highway Breakdown",
                badge: "Vehicle Neglect",
                badgeColor: "bg-amber-600",
                avatar: null,
                narrative: `White smoke pours from under the hood of your neglected ${carName} (${car?.condition ?? 30}% condition) in the middle of rush hour!`,
                options: [
                    {
                        id: "diy_mechanic",
                        title: "Pop the Hood & Fix It Yourself",
                        description: "Use mechanical know-how to restore it roadside",
                        icon: "fa-wrench",
                        color: "emerald",
                        badge: "Trades 35+",
                        disabled: tradesXp < 35
                    },
                    {
                        id: "call_tow_shop",
                        title: "Tow to a Repair Shop ($600)",
                        description: "Get proper repairs and restore condition",
                        icon: "fa-truck-pickup",
                        color: "blue",
                        badge: "$600",
                        disabled: userMoney < 600
                    },
                    {
                        id: "limp_home",
                        title: "Limp It Home Knocking & Sputtering",
                        description: "Save cash now at the expense of the engine",
                        icon: "fa-exclamation-triangle",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const car = (user.assets || []).find(a =>
                a.category === 'vehicle' && (a.condition ?? 100) <= 35 && (a.condition ?? 100) > 0
            );
            const carName = car ? car.name : "vehicle";

            if (choiceId === "diy_mechanic") {
                if (car) car.condition = Math.min(100, (car.condition ?? 25) + 25);
                GameLogic.adjustStat(user, 'smarts', 8);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: `You patched the coolant hose and tightened the belt yourself—saving hundreds and restoring your ${carName} to ${car?.condition ?? 50}% condition!`,
                    logType: "good",
                    badges: [{ label: "+25% Car Condition", tone: "good" }]
                };
            } else if (choiceId === "call_tow_shop") {
                user.money = Math.max(0, (user.money ?? 0) - 600);
                if (car) car.condition = Math.min(100, (car.condition ?? 25) + 30);
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: `The mechanic replaced the worn alternator and flushed the radiator. Your ${carName} is back up to ${car?.condition ?? 55}% condition.`,
                    logType: "good",
                    badges: [{ label: "+30% Car Condition", tone: "good" }]
                };
            } else {
                if (car) car.condition = Math.max(1, (car.condition ?? 25) - 15);
                GameLogic.adjustStat(user, 'happiness', -10);
                return {
                    log: `You crawled home in the breakdown lane while the engine rattled ominously.`,
                    logType: "bad",
                    badges: [{ label: "-15% Car Condition", tone: "bad" }]
                };
            }
        }
    },

    debt_collector_knock: {
        id: "debt_collector_knock",
        category: "finance",
        minAge: 20,
        maxAge: 85,
        probability: 0.35,
        priority: 60,
        cooldownYears: 5,
        condition: (user) => {
            const money = user.money ?? 0;
            const loans = user.studentLoans ?? 0;
            return money < 0 || (loans >= 60000 && money < 5000);
        },
        getTargetNPC: () => null,
        render: (user) => {
            const userSmarts = getUserStat(user, 'smarts', 50);
            const hasLawEdge = user.gradSchoolDegree === 'Law School' || userSmarts >= 70;

            return {
                title: "Collections Notice at the Door",
                badge: "Financial Pressure",
                badgeColor: "bg-red-700",
                avatar: null,
                narrative: "A stern debt-recovery representative knocks on your door demanding immediate action on your mounting balances.",
                options: [
                    {
                        id: "legal_dispute",
                        title: "Cite Debt Protection Statutes",
                        description: "Challenge invalid fees and demand relief",
                        icon: "fa-balance-scale",
                        color: "indigo",
                        badge: "Law / Smarts 70+",
                        disabled: !hasLawEdge
                    },
                    {
                        id: "payment_plan",
                        title: "Negotiate a Restructured Plan",
                        description: "Commit to steady debt reduction",
                        icon: "fa-file-signature",
                        color: "blue"
                    },
                    {
                        id: "dodge_collector",
                        title: "Turn Off the Lights & Hide",
                        description: "Ignore the knock and stress out",
                        icon: "fa-eye-slash",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "legal_dispute") {
                let reliefMsg = "You cited consumer protection laws and wiped $1,500 in unlawful penalties!";
                if ((user.studentLoans ?? 0) > 0) {
                    const cut = Math.min(user.studentLoans, 3500);
                    user.studentLoans -= cut;
                    reliefMsg = `You challenged compounded fees and had $${cut.toLocaleString()} forgiven from your student loans!`;
                } else {
                    user.money = (user.money ?? 0) + 1500;
                }
                GameLogic.adjustStat(user, 'smarts', 8);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: reliefMsg,
                    logType: "good"
                };
            } else if (choiceId === "payment_plan") {
                if ((user.studentLoans ?? 0) > 0) {
                    user.studentLoans = Math.max(0, user.studentLoans - 1000);
                }
                if ((user.money ?? 0) >= 250) {
                    user.money -= 250;
                }
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "You negotiated lower interest terms and put the collection agency on a manageable schedule.",
                    logType: "neutral"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', -15);
                return {
                    log: "You hid behind the curtains until they left a bright red final-notice envelope on your porch.",
                    logType: "bad"
                };
            }
        }
    },

    medical_emergency_flight: {
        id: "medical_emergency_flight",
        category: "career",
        minAge: 24,
        maxAge: 75,
        probability: 0.35,
        priority: 65,
        oncePerLife: true,
        condition: (user) => user.careerTrack === 'medicine' || user.careerTrack === 'nursing' || user.gradSchoolDegree === 'Medical School',
        getTargetNPC: () => null,
        render: () => ({
            title: "In-Flight Medical Emergency",
            badge: "Medical Calling",
            badgeColor: "bg-cyan-600",
            avatar: null,
            narrative: "Cruising at 35,000 feet, the flight attendant calls over the intercom: 'Is there a doctor or medical professional on board?!' A passenger is experiencing acute chest pain.",
            options: [
                {
                    id: "step_in_hero",
                    title: "Take Charge & Stabilize the Passenger",
                    description: "Use your clinical training to save a life",
                    icon: "fa-user-md",
                    color: "emerald"
                },
                {
                    id: "assist_calmly",
                    title: "Guide Crew from Your Row",
                    description: "Offer basic triage instructions quietly",
                    icon: "fa-notes-medical",
                    color: "blue"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "step_in_hero") {
                user.money = (user.money ?? 0) + 1500;
                GameLogic.adjustStat(user, 'happiness', 25);
                GameLogic.adjustStat(user, 'smarts', 10);
                return {
                    log: "You administered emergency oxygen and stabilized the passenger until landing! The airline gifted you a $1,500 travel voucher and applause.",
                    logType: "good",
                    badges: [{ label: "Life Saved", tone: "good" }]
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 12);
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "You helped the crew monitor vitals calmly until paramedics met the plane on the tarmac.",
                    logType: "good"
                };
            }
        }
    },

    real_estate_zoning_windfall: {
        id: "real_estate_zoning_windfall",
        category: "assets",
        minAge: 18,
        maxAge: 95,
        probability: 0.30,
        priority: 50,
        cooldownYears: 7,
        condition: (user) => (user.assets || []).some(a => a.category === 'property'),
        getTargetNPC: () => null,
        render: (user) => {
            const prop = (user.assets || []).find(a => a.category === 'property');
            const propName = prop ? prop.name : "your property";
            const leadXp = getSkillXpSafe(user, 'leadership');
            const canLobbyFree = leadXp >= 40;
            const userMoney = user.money ?? 0;

            return {
                title: "City Transit Rezoning Vote",
                badge: "Real Estate",
                badgeColor: "bg-cyan-600",
                avatar: null,
                narrative: `City Hall is voting on a new express transit hub just two blocks from ${propName}!`,
                options: [
                    {
                        id: "lobby_transit_hub",
                        title: canLobbyFree ? "Speak at City Council (Free w/ Leadership)" : "Back the Neighborhood Coalition ($1,000)",
                        description: "Push for approval to raise property values by +12%",
                        icon: "fa-city",
                        color: "emerald",
                        badge: canLobbyFree ? "Leadership 40+" : "$1,000",
                        disabled: !canLobbyFree && userMoney < 1000
                    },
                    {
                        id: "sell_easement_rights",
                        title: "Grant Utility Easement Rights",
                        description: "Collect an immediate $3,500 municipal payout",
                        icon: "fa-file-contract",
                        color: "blue"
                    },
                    {
                        id: "oppose_noise",
                        title: "Vote Against Construction Noise",
                        description: "Keep the block quiet and peaceful",
                        icon: "fa-volume-mute",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const prop = (user.assets || []).find(a => a.category === 'property');
            const leadXp = getSkillXpSafe(user, 'leadership');

            if (choiceId === "lobby_transit_hub") {
                if (leadXp < 40) {
                    user.money = Math.max(0, (user.money ?? 0) - 1000);
                }
                let gain = 0;
                if (prop && typeof prop.value === 'number') {
                    gain = Math.round(prop.value * 0.12);
                    prop.value += gain;
                }
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: `The transit hub passed! ${prop ? prop.name : 'Your property'} appreciated by +$${gain.toLocaleString()}!`,
                    logType: "good",
                    badges: gain > 0 ? [{ label: `+$${gain.toLocaleString()} Property Value`, tone: "good" }] : []
                };
            } else if (choiceId === "sell_easement_rights") {
                user.money = (user.money ?? 0) + 3500;
                GameLogic.adjustStat(user, 'happiness', 8);
                return {
                    log: "You signed a minor sidewalk utility easement and pocketed $3,500.",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "The project moved to another district, keeping your street quiet.",
                    logType: "neutral"
                };
            }
        }
    },

    stock_market_insider_tip: {
        id: "stock_market_insider_tip",
        category: "finance",
        minAge: 18,
        maxAge: 85,
        probability: 0.28,
        priority: 55,
        oncePerLife: true,
        condition: (user) => Boolean(
            user.investments &&
            ((user.investments.savings || 0) >= 5000 ||
             Object.values(user.investments.stocks || {}).some(s => (s?.shares || 0) > 0))
        ),
        getTargetNPC: () => null,
        render: () => ({
            title: "Overheard Executive Lounge Tip",
            badge: "Market Temptation",
            badgeColor: "bg-purple-600",
            avatar: null,
            narrative: "In an airport business lounge, you overhear two executives whispering about an unannounced biotech buyout happening tomorrow morning.",
            options: [
                {
                    id: "trade_on_tip",
                    title: "Quietly Buy Options Before Open",
                    description: "Chase a quick $4,500 windfall (Risky)",
                    icon: "fa-chart-area",
                    color: "amber"
                },
                {
                    id: "stick_fundamentals",
                    title: "Stick to Public Fundamentals",
                    description: "Invest safely without touching insider info",
                    icon: "fa-shield-alt",
                    color: "emerald"
                },
                {
                    id: "report_tip",
                    title: "Report the Leak to Market Regulators",
                    description: "Do the ethical thing",
                    icon: "fa-flag",
                    color: "blue"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const flags = ensureEventFlags(user);
            if (choiceId === "trade_on_tip") {
                user.money = (user.money ?? 0) + 4500;
                flags.insider_trade_used = user.age;
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "The buyout hit the news at 9:30 AM and your quick trade cleared +$4,500!",
                    logType: "good"
                };
            } else if (choiceId === "stick_fundamentals") {
                user.money = (user.money ?? 0) + 600;
                GameLogic.adjustStat(user, 'smarts', 10);
                return {
                    log: "You ignored the hot tip and rebalanced your portfolio cleanly for a steady +$600 gain.",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "You tipped off market compliance and slept soundly knowing your portfolio is spotless.",
                    logType: "good"
                };
            }
        }
    }
};
