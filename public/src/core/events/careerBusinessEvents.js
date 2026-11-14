import { GameLogic } from '../gameLogic.js';
import { getSkillXpSafe, getUserStat, ensureEventFlags } from './eventHelpers.js';

export const CAREER_BUSINESS_EVENTS = {
    coworker_credit_theft: {
        id: "coworker_credit_theft",
        category: "career",
        minAge: 22,
        maxAge: 64,
        probability: 0.22,
        priority: 30,
        cooldownYears: 8,
        condition: (user) => Boolean((user.jobTitle || user.careerTrack) && user.careerTrack !== 'mafia_syndicate' && user.careerTrack !== 'pro_athlete' && user.age >= 22 && user.age <= 64),
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Stolen Project Credit",
            badge: "Workplace Drama",
            badgeColor: "bg-red-700",
            avatar: null,
            narrative: "During a major department all-hands meeting, an ambitious coworker presents your project slides and takes all personal credit for your weeks of hard work!",
            options: [
                {
                    id: "call_out_public",
                    title: "Call Them Out in the Meeting",
                    description: "Present live version history and timestamps",
                    icon: "fa-bullhorn",
                    color: "red",
                    badge: "Smarts 50+"
                },
                {
                    id: "private_boss_meeting",
                    title: "Meet Privately with Your Boss",
                    description: "Share the commit logs and document timestamps calmly",
                    icon: "fa-user-tie",
                    color: "blue"
                },
                {
                    id: "demand_coworker_share",
                    title: "Confront Coworker in Private",
                    description: "Demand a follow-up correction email to the team",
                    icon: "fa-handshake",
                    color: "emerald"
                },
                {
                    id: "let_it_slide",
                    title: "Let It Slide",
                    description: "Keep quiet to avoid workplace tension",
                    icon: "fa-comment-slash",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = getUserStat(user, 'smarts', 50);

            if (choiceId === "call_out_public") {
                if (userSmarts >= 50) {
                    GameLogic.adjustStat(user, 'smarts', 15);
                    GameLogic.adjustStat(user, 'happiness', 15);
                    if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.min(100, user.jobPerformance + 8);
                    return {
                        log: "You calmly displayed the timestamped creation logs on screen. The executive team applauded your transparency and your coworker turned beet red!",
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -15);
                    if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.max(0, user.jobPerformance - 5);
                    return {
                        log: "You started an emotional argument during the presentation. Your manager asked you both to step outside.",
                        logType: "bad"
                    };
                }
            } else if (choiceId === "private_boss_meeting") {
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 10);
                if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.min(100, user.jobPerformance + 10);
                return {
                    log: "You presented your project records in a private 1-on-1. Your boss commended your professionalism and promised you lead credit!",
                    logType: "good"
                };
            } else if (choiceId === "demand_coworker_share") {
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "You confronted your coworker over coffee. They apologized and sent a team update crediting your core contribution.",
                    logType: "neutral"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', -15);
                return {
                    log: "You stayed quiet while your coworker received accolades for your project. You went home feeling bitter.",
                    logType: "bad"
                };
            }
        }
    },

    career_headhunter_poach: {
        id: "career_headhunter_poach",
        category: "career",
        minAge: 22,
        maxAge: 62,
        probability: 0.30,
        priority: 55,
        cooldownYears: 6,
        condition: (user) => Boolean(
            user.jobTitle &&
            user.careerTrack &&
            user.careerTrack !== 'mafia_syndicate' &&
            user.careerTrack !== 'pro_athlete' &&
            (user.jobPerformance ?? 50) >= 80 &&
            (user.yearsInRole ?? 0) >= 1
        ),
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Executive Headhunter Offer",
            badge: "Career Opportunity",
            badgeColor: "bg-emerald-600",
            avatar: null,
            narrative: `Word of your standout performance as ${user.jobTitle} reached a rival firm! A headhunter reaches out with an enticing poaching offer.`,
            options: [
                {
                    id: "leverage_raise",
                    title: "Leverage Offer for a Counter-Raise",
                    description: "Negotiate +12% salary to stay at your current company",
                    icon: "fa-chart-line",
                    color: "emerald"
                },
                {
                    id: "take_signing_bonus",
                    title: "Accept Competitor Signing Bonus",
                    description: "Pocket $4,000 cash & an 8% salary bump",
                    icon: "fa-handshake",
                    color: "blue"
                },
                {
                    id: "decline_politely",
                    title: "Decline Out of Loyalty",
                    description: "Stay put and boost internal reputation",
                    icon: "fa-shield-alt",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const currentSal = user.jobSalary || 40000;
            if (choiceId === "leverage_raise") {
                const newSalary = Math.round(currentSal * 1.12);
                user.jobSalary = newSalary;
                if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.min(100, user.jobPerformance + 5);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: `Your boss matched the outside offer! Your salary jumped to $${newSalary.toLocaleString()}/yr.`,
                    logType: "good",
                    badges: [{ label: "+12% Salary", tone: "good" }]
                };
            } else if (choiceId === "take_signing_bonus") {
                user.money = (user.money ?? 0) + 4000;
                user.jobSalary = Math.round(currentSal * 1.08);
                user.yearsInRole = 0;
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: `You jumped to the rival firm with a $4,000 signing bonus and a raise to $${user.jobSalary.toLocaleString()}/yr!`,
                    logType: "good",
                    badges: [{ label: "+8% Salary", tone: "good" }]
                };
            } else {
                if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.min(100, user.jobPerformance + 15);
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "Leadership noticed your loyalty and bumped your internal performance review.",
                    logType: "good"
                };
            }
        }
    },

    pro_athlete_paparazzi_scandal: {
        id: "pro_athlete_paparazzi_scandal",
        category: "career",
        minAge: 18,
        maxAge: 41,
        probability: 0.35,
        priority: 55,
        cooldownYears: 5,
        condition: (user) => user.careerTrack === 'pro_athlete',
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Locker Room Media Storm",
            badge: "Pro Sports Spotlight",
            badgeColor: "bg-amber-600",
            avatar: null,
            narrative: "Paparazzi caught a heated clip of you leaving the stadium after a tough loss, and sports talk shows are blowing it out of proportion!",
            options: [
                {
                    id: "charity_press_conf",
                    title: "Host a Youth Clinic Press Event",
                    description: "Flip the narrative with community leadership",
                    icon: "fa-basketball-ball",
                    color: "emerald",
                    badge: "Leadership 25+"
                },
                {
                    id: "hire_pr_firm",
                    title: "Hire Crisis PR Team ($5,000)",
                    description: "Issue a polished statement and kill the story",
                    icon: "fa-shield-alt",
                    color: "blue",
                    badge: "$5,000",
                    disabled: (user.money ?? 0) < 5000
                },
                {
                    id: "clap_back_online",
                    title: "Clap Back on Social Media",
                    description: "Tell critics exactly how you feel",
                    icon: "fa-fire",
                    color: "red"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const leadXp = getSkillXpSafe(user, 'leadership');
            const userSmarts = getUserStat(user, 'smarts', 50);

            if (choiceId === "charity_press_conf") {
                if (leadXp >= 25 || userSmarts >= 60) {
                    GameLogic.adjustStat(user, 'happiness', 20);
                    GameLogic.adjustStat(user, 'looks', 5);
                    return {
                        log: "Your youth sports camp went viral for all the right reasons—the media praised your maturity!",
                        logType: "good"
                    };
                }
                GameLogic.adjustStat(user, 'happiness', -5);
                return {
                    log: "Reporters kept pressing you about the clip, though fans appreciated the charity effort.",
                    logType: "neutral"
                };
            } else if (choiceId === "hire_pr_firm") {
                user.money = Math.max(0, (user.money ?? 0) - 5000);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "Your crisis PR team buried the story within 24 hours and preserved your endorsements.",
                    logType: "good"
                };
            } else {
                if (Math.random() < 0.5) {
                    GameLogic.adjustStat(user, 'happiness', 15);
                    return {
                        log: "Fans loved your unfiltered honesty and your jersey sales spiked overnight!",
                        logType: "good"
                    };
                } else {
                    user.money = Math.max(0, (user.money ?? 0) - 2500);
                    GameLogic.adjustStat(user, 'happiness', -15);
                    return {
                        log: "The league fined you $2,500 for conduct detrimental to the team.",
                        logType: "bad"
                    };
                }
            }
        }
    },

    mafia_federal_wiretap: {
        id: "mafia_federal_wiretap",
        category: "crime",
        minAge: 18,
        maxAge: 75,
        probability: 0.35,
        priority: 65,
        cooldownYears: 5,
        condition: (user) => user.careerTrack === 'mafia_syndicate',
        getTargetNPC: () => null,
        render: (user) => {
            const martialXp = getSkillXpSafe(user, 'martial_arts');
            return {
                title: "Whispers of a Wiretap",
                badge: "Syndicate Alert",
                badgeColor: "bg-red-800",
                avatar: null,
                narrative: "Your Capo whispers that the feds might have planted a listening bug inside the Syndicate's back-room social club.",
                options: [
                    {
                        id: "sweep_club",
                        title: "Conduct a Midnight Bug Sweep",
                        description: "Carefully inspect every fixture and phone line",
                        icon: "fa-search",
                        color: "indigo",
                        badge: "Smarts 65+"
                    },
                    {
                        id: "intimidate_rat",
                        title: "Corner the Suspected Informant",
                        description: "Force a confession before the feds move",
                        icon: "fa-user-secret",
                        color: "red",
                        badge: "Martial Arts 40+",
                        disabled: martialXp < 40
                    },
                    {
                        id: "lay_low",
                        title: "Burn Burner Phones & Lay Low",
                        description: "Stay off the radar until heat blows over",
                        icon: "fa-phone-slash",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = getUserStat(user, 'smarts', 50);

            if (choiceId === "sweep_club") {
                if (userSmarts >= 65) {
                    user.money = (user.money ?? 0) + 3000;
                    GameLogic.adjustStat(user, 'smarts', 10);
                    GameLogic.adjustStat(user, 'happiness', 15);
                    return {
                        log: "You found a hidden transmitter inside a espresso machine! The Don rewarded you with $3,000.",
                        logType: "good"
                    };
                }
                GameLogic.adjustStat(user, 'happiness', -15);
                return {
                    log: "You tore up half the floorboards and found nothing, irritating the Capo.",
                    logType: "bad"
                };
            } else if (choiceId === "intimidate_rat") {
                user.mafiaCrimesThisYear = (user.mafiaCrimesThisYear || 0) + 1;
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: "You cornered the associate and recovered a concealed wire before a single word reached federal ears. (+1 Syndicate Quota)",
                    logType: "good",
                    badges: [{ label: "+1 Syndicate Quota", tone: "good" }]
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', -5);
                return {
                    log: "You wiped your burner phones and kept all meetings off-site until the heat cooled.",
                    logType: "neutral"
                };
            }
        }
    },

    business_whistleblower_leak: {
        id: "business_whistleblower_leak",
        category: "business",
        minAge: 18,
        maxAge: 85,
        probability: 0.40,
        priority: 65,
        cooldownYears: 5,
        condition: (user) => Boolean(
            user.hasBusiness &&
            (user.supplierId === 'cheap' || (user.employeeMorale ?? 80) < 45)
        ),
        getTargetNPC: () => null,
        render: (user) => {
            const compCash = user.compCash ?? 0;
            const companyName = user.companyName || "your company";
            return {
                title: "Whistleblower Threat",
                badge: "Corporate Crisis",
                badgeColor: "bg-red-700",
                avatar: null,
                narrative: `Cutting corners with budget suppliers or strained morale at ${companyName} has triggered a crisis—a disgruntled insider threatens to leak internal memos to investigative press!`,
                options: [
                    {
                        id: "upgrade_and_compensate",
                        title: "Upgrade Suppliers & Pay Morale Bonus ($15,000 Co. Cash)",
                        description: "Switch to Standard suppliers and boost morale",
                        icon: "fa-check-double",
                        color: "emerald",
                        badge: "$15k Co. Cash",
                        disabled: compCash < 15000
                    },
                    {
                        id: "pr_damage_control",
                        title: "Publish Reform Pledge ($5,000 Co. Cash)",
                        description: "Contain the story with transparent PR",
                        icon: "fa-bullhorn",
                        color: "blue",
                        badge: "$5k Co. Cash",
                        disabled: compCash < 5000
                    },
                    {
                        id: "stonewall_press",
                        title: "Issue Gag Orders & Deny Everything",
                        description: "Save company cash and weather the backlash",
                        icon: "fa-gavel",
                        color: "red"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "upgrade_and_compensate") {
                user.compCash = Math.max(0, (user.compCash ?? 0) - 15000);
                user.supplierId = 'standard';
                user.employeeMorale = Math.min(100, (user.employeeMorale ?? 50) + 25);
                user.businessReputation = Math.min(100, (user.businessReputation ?? 50) + 12);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "You upgraded to Standard suppliers and issued staff bonuses. The whistleblower stood down and morale surged!",
                    logType: "good",
                    badges: [{ label: "+25 Morale", tone: "good" }, { label: "+12 Reputation", tone: "good" }]
                };
            } else if (choiceId === "pr_damage_control") {
                user.compCash = Math.max(0, (user.compCash ?? 0) - 5000);
                user.employeeMorale = Math.min(100, (user.employeeMorale ?? 50) + 10);
                user.businessReputation = Math.max(0, (user.businessReputation ?? 50) - 5);
                return {
                    log: "Your transparent reform plan softened the press blow and calmed internal tensions.",
                    logType: "neutral"
                };
            } else {
                user.businessReputation = Math.max(0, (user.businessReputation ?? 50) - 20);
                user.employeeMorale = Math.max(0, (user.employeeMorale ?? 50) - 15);
                GameLogic.adjustStat(user, 'happiness', -10);
                return {
                    log: "The leaked memos hit the front page, tanking public trust and staff morale.",
                    logType: "bad",
                    badges: [{ label: "-20 Reputation", tone: "bad" }, { label: "-15 Morale", tone: "bad" }]
                };
            }
        }
    },

    business_viral_breakout: {
        id: "business_viral_breakout",
        category: "business",
        minAge: 18,
        maxAge: 85,
        probability: 0.30,
        priority: 55,
        cooldownYears: 6,
        condition: (user) => Boolean(user.hasBusiness && (user.businessReputation ?? 50) >= 60),
        getTargetNPC: () => null,
        render: (user) => {
            const compCash = user.compCash ?? 0;
            const companyName = user.companyName || "your company";
            return {
                title: "Viral Product Breakout",
                badge: "Business Boom",
                badgeColor: "bg-emerald-600",
                avatar: null,
                narrative: `A major creator organically praised ${companyName}'s flagship offering, sending millions of eyeballs to your storefront overnight!`,
                options: [
                    {
                        id: "scale_fulfillment",
                        title: "Surge Fulfillment & Ad Spend ($10,000 Co. Cash)",
                        description: "Capitalize aggressively on the viral wave",
                        icon: "fa-rocket",
                        color: "emerald",
                        badge: "$10k Co. Cash",
                        disabled: compCash < 10000
                    },
                    {
                        id: "organic_ride",
                        title: "Ride the Organic Demand Safely",
                        description: "Capture steady profits with zero extra spend",
                        icon: "fa-chart-line",
                        color: "blue"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "scale_fulfillment") {
                user.compCash = Math.max(0, (user.compCash ?? 0) - 10000) + 35000;
                user.businessReputation = Math.min(100, (user.businessReputation ?? 50) + 12);
                GameLogic.adjustStat(user, 'happiness', 20);
                return {
                    log: "Your rapid scaling nailed every viral order—netting +$25,000 in Company Treasury and huge brand buzz!",
                    logType: "good",
                    badges: [{ label: "+12 Reputation", tone: "good" }]
                };
            } else {
                user.compCash = (user.compCash ?? 0) + 12000;
                user.businessReputation = Math.min(100, (user.businessReputation ?? 50) + 6);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "Demand surged smoothly and added +$12,000 directly into your Company Treasury.",
                    logType: "good",
                    badges: [{ label: "+6 Reputation", tone: "good" }]
                };
            }
        }
    },

    underworld_old_associate: {
        id: "underworld_old_associate",
        category: "crime",
        minAge: 20,
        maxAge: 80,
        probability: 0.35,
        priority: 60,
        oncePerLife: true,
        condition: (user) => Boolean(
            !user.inPrison &&
            (user.everInPrison ||
             (user.lifetimeCrimesCommitted || 0) > 0 ||
             (user.criminalRecord || []).some(r => r.verdict === 'guilty'))
        ),
        getTargetNPC: () => null,
        render: () => ({
            title: "Ghost from the Past",
            badge: "Underworld Tie",
            badgeColor: "bg-red-700",
            avatar: null,
            narrative: "An old underworld associate tracks you down outside a diner: 'I've got one last clean fence drop lined up—easy $5,000 split. You in or are you going straight?'",
            options: [
                {
                    id: "take_fence_cut",
                    title: "Take the $5,000 Fence Drop",
                    description: "One more score for fast cash (Risky)",
                    icon: "fa-mask",
                    color: "red"
                },
                {
                    id: "walk_straight",
                    title: "Turn Them Down & Stay Clean",
                    description: "Leave that life behind for good",
                    icon: "fa-walking",
                    color: "emerald"
                },
                {
                    id: "tip_detective",
                    title: "Tip Off Local Detectives",
                    description: "Collect a $1,000 informant reward",
                    icon: "fa-user-shield",
                    color: "blue"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const flags = ensureEventFlags(user);
            if (choiceId === "take_fence_cut") {
                user.money = (user.money ?? 0) + 5000;
                flags.shady_fence_deal = user.age;
                GameLogic.adjustStat(user, 'happiness', 8);
                return {
                    log: "The midnight handoff went smooth—you stuffed $5,000 in unmarked bills into your jacket.",
                    logType: "good"
                };
            } else if (choiceId === "walk_straight") {
                GameLogic.adjustStat(user, 'happiness', 15);
                GameLogic.adjustStat(user, 'smarts', 8);
                return {
                    log: "You shut the door on your past and walked away with your peace of mind intact.",
                    logType: "good"
                };
            } else {
                user.money = (user.money ?? 0) + 1000;
                GameLogic.adjustStat(user, 'smarts', 5);
                GameLogic.adjustStat(user, 'happiness', -5);
                return {
                    log: "Police intercepted the shipment and wired you a $1,000 anonymous tip reward.",
                    logType: "neutral"
                };
            }
        }
    },

    burnout_overwork_warning: {
        id: "burnout_overwork_warning",
        category: "career",
        minAge: 22,
        maxAge: 65,
        probability: 0.30,
        priority: 50,
        cooldownYears: 6,
        condition: (user) => Boolean((user.jobTitle || user.hasBusiness) && getUserStat(user, 'happiness', 100) < 45),
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Exhaustion & Burnout",
            badge: "Mental Wellness",
            badgeColor: "bg-amber-600",
            avatar: null,
            narrative: "Staring at your inbox at midnight, you realize your happiness has hit rock bottom from relentless work stress.",
            options: [
                {
                    id: "take_sabbatical",
                    title: "Book a Restorative Retreat ($800)",
                    description: "Unplug completely to recover health and joy",
                    icon: "fa-spa",
                    color: "emerald",
                    badge: "$800",
                    disabled: (user.money ?? 0) < 800
                },
                {
                    id: "delegate_workload",
                    title: "Set Boundaries & Delegate",
                    description: "Reclaim your evenings",
                    icon: "fa-clock",
                    color: "blue"
                },
                {
                    id: "grind_harder",
                    title: "Drink More Coffee & Push Through",
                    description: "Sacrifice wellness for output",
                    icon: "fa-coffee",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "take_sabbatical") {
                user.money = Math.max(0, (user.money ?? 0) - 800);
                GameLogic.adjustStat(user, 'happiness', 25);
                GameLogic.adjustStat(user, 'health', 10);
                return {
                    log: "A quiet week off the grid worked wonders—you returned feeling completely recharged!",
                    logType: "good"
                };
            } else if (choiceId === "delegate_workload") {
                GameLogic.adjustStat(user, 'happiness', 15);
                if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.max(0, user.jobPerformance - 5);
                return {
                    log: "You handed off non-urgent tasks and reclaimed your work-life balance.",
                    logType: "good"
                };
            } else {
                if (typeof user.jobPerformance === 'number') user.jobPerformance = Math.min(100, user.jobPerformance + 10);
                GameLogic.adjustStat(user, 'health', -10);
                GameLogic.adjustStat(user, 'happiness', -10);
                return {
                    log: "You powered through the quarter on pure caffeine, taking a toll on your health.",
                    logType: "bad"
                };
            }
        }
    },

    patent_licensing_offer: {
        id: "patent_licensing_offer",
        category: "career",
        minAge: 19,
        maxAge: 30,
        probability: 0.55,
        priority: 90,
        oncePerLife: true,
        condition: (user) => user.lifeEventFlags?.built_solar_rover === true,
        getTargetNPC: () => null,
        render: () => ({
            title: "Science Fair Patent Offer",
            badge: "Past Milestone Payoff",
            badgeColor: "bg-emerald-600",
            avatar: null,
            narrative: "Remember that 1st-place Solar Robotics project you built as a kid? A clean-tech hardware startup discovered your archived schematic and wants to license it!",
            options: [
                {
                    id: "sell_patent_outright",
                    title: "Sell the Schematic Outright ($6,000)",
                    description: "Cash out big on your childhood invention",
                    icon: "fa-dollar-sign",
                    color: "emerald"
                },
                {
                    id: "keep_royalty_stake",
                    title: "Take $2,500 + Technical Advisor Credit",
                    description: "Boost your career reputation & intellect",
                    icon: "fa-lightbulb",
                    color: "blue"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "sell_patent_outright") {
                user.money = (user.money ?? 0) + 6000;
                GameLogic.adjustStat(user, 'happiness', 20);
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "You sold the solar rover schematic for $6,000! Childhood curiosity literally paid dividends.",
                    logType: "good"
                };
            } else {
                user.money = (user.money ?? 0) + 2500;
                GameLogic.adjustStat(user, 'smarts', 15);
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: "You pocketed $2,500 and got listed as a Founding Technical Advisor on their patent filing!",
                    logType: "good"
                };
            }
        }
    },

    regulatory_inquiry_knock: {
        id: "regulatory_inquiry_knock",
        category: "finance",
        minAge: 20,
        maxAge: 90,
        probability: 0.65,
        priority: 95,
        oncePerLife: true,
        condition: (user) => {
            const flags = user.lifeEventFlags || {};
            const insiderAge = flags.insider_trade_used;
            const fenceAge = flags.shady_fence_deal;
            return Boolean(
                (typeof insiderAge === 'number' && (user.age - insiderAge) >= 1) ||
                (typeof fenceAge === 'number' && (user.age - fenceAge) >= 1)
            );
        },
        getTargetNPC: () => null,
        render: (user) => {
            const userSmarts = getUserStat(user, 'smarts', 50);
            const hasLawEdge = user.gradSchoolDegree === 'Law School' || userSmarts >= 75;
            const isInsider = typeof user.lifeEventFlags?.insider_trade_used === 'number';

            return {
                title: isInsider ? "SEC Compliance Inquiry" : "Detective Follow-Up",
                badge: "Past Consequence",
                badgeColor: "bg-red-700",
                avatar: null,
                narrative: isInsider
                    ? "Federal regulators flagged the suspiciously well-timed options trade you made earlier and want an explanation!"
                    : "A city detective shows up asking how you suddenly came into $5,000 in unmarked cash after that late-night fence drop!",
                options: [
                    {
                        id: "lawyer_up_dismiss",
                        title: "Present Legal Defense & Paperwork",
                        description: "Dismiss the inquiry cleanly using legal/analytical skill",
                        icon: "fa-balance-scale",
                        color: "indigo",
                        badge: "Law / Smarts 75+",
                        disabled: !hasLawEdge
                    },
                    {
                        id: "pay_settlement",
                        title: "Pay $3,500 Fine & Settle Quietly",
                        description: "Close the file without escalation",
                        icon: "fa-file-invoice-dollar",
                        color: "amber",
                        badge: "$3,500"
                    },
                    {
                        id: "bluff_investigator",
                        title: "Bluff Through the Interview",
                        description: "Claim it was sheer luck (High Risk)",
                        icon: "fa-mask",
                        color: "red"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "lawyer_up_dismiss") {
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: "Your airtight documentation forced investigators to close the inquiry with zero charges!",
                    logType: "good"
                };
            } else if (choiceId === "pay_settlement") {
                user.money = (user.money ?? 0) - 3500;
                GameLogic.adjustStat(user, 'happiness', -8);
                return {
                    log: "You paid a $3,500 civil penalty to close the investigation permanently.",
                    logType: "bad"
                };
            } else {
                if (Math.random() < 0.45) {
                    GameLogic.adjustStat(user, 'happiness', 10);
                    return {
                        log: "Somehow they bought your alibi and dropped the inquiry!",
                        logType: "neutral"
                    };
                } else {
                    user.money = (user.money ?? 0) - 5000;
                    GameLogic.adjustStat(user, 'happiness', -20);
                    return {
                        log: "They saw right through your bluff and slapped you with a $5,000 penalty!",
                        logType: "bad"
                    };
                }
            }
        }
    }
};
