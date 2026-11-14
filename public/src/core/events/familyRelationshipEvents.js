import { GameLogic } from '../gameLogic.js';
import { getSkillXpSafe, getUserStat, isLivingNPC } from './eventHelpers.js';

export const FAMILY_RELATIONSHIP_EVENTS = {
    parent_vacation: {
        id: "parent_vacation",
        category: "family",
        minAge: 4,
        maxAge: 17,
        probability: 0.16,
        priority: 30,
        cooldownYears: 5,
        condition: (user) => {
            if (user.age < 4 || user.age > 17) return false;
            return (user.relationships || []).some(r =>
                (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && isLivingNPC(r)
            );
        },
        getTargetNPC: (user) => {
            const parents = (user.relationships || []).filter(r =>
                (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && isLivingNPC(r)
            );
            return parents[Math.floor(Math.random() * parents.length)] || null;
        },
        render: (user, targetNPC) => {
            const destinations = ["a tropical beach resort", "a mountain camping retreat", "a theme park wonderland", "a sunny road trip"];
            const dest = destinations[Math.floor(Math.random() * destinations.length)];
            const parentName = targetNPC ? `${targetNPC.type} (${targetNPC.name})` : "Your parents";
            return {
                title: "Family Vacation Invitation",
                badge: "Family Time",
                badgeColor: "bg-emerald-600",
                avatar: targetNPC,
                narrative: `${parentName} booked an exciting family vacation to ${dest} and invited you to pack your bags!`,
                options: [
                    {
                        id: "go_enthusiastic",
                        title: "Go Enthusiastically",
                        description: "Pack your bags with excitement",
                        icon: "fa-plane-departure",
                        color: "emerald"
                    },
                    {
                        id: "ask_money",
                        title: "Ask for Souvenir Money",
                        description: "Ask for spending cash for the gift shop",
                        icon: "fa-hand-holding-usd",
                        color: "amber"
                    },
                    {
                        id: "complain",
                        title: "Complain & Beg to Stay Home",
                        description: "Refuse to go and stay glued to screens",
                        icon: "fa-couch",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "go_enthusiastic") {
                GameLogic.adjustStat(user, 'happiness', 20);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                return {
                    log: `You went on the family trip and had an unforgettable time exploring and bonding!`,
                    logType: "good"
                };
            } else if (choiceId === "ask_money") {
                const parentStatus = targetNPC?.status ?? 60;
                if (parentStatus >= 50) {
                    const allowance = 50;
                    user.money = (user.money ?? 0) + allowance;
                    GameLogic.adjustStat(user, 'happiness', 15);
                    return {
                        log: `${targetNPC ? targetNPC.name : 'Your parent'} happily handed you $50 for souvenir spending money!`,
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -5);
                    return {
                        log: `${targetNPC ? targetNPC.name : 'Your parent'} told you to be grateful for the trip and refused to give you extra money.`,
                        logType: "neutral"
                    };
                }
            } else {
                GameLogic.adjustStat(user, 'happiness', -5);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 15);
                return {
                    log: `You complained loudly and ruined the mood before the vacation.`,
                    logType: "bad"
                };
            }
        }
    },

    sibling_broken_vase: {
        id: "sibling_broken_vase",
        category: "family",
        minAge: 4,
        maxAge: 17,
        probability: 0.22,
        priority: 30,
        oncePerLife: true,
        condition: (user) => {
            if (user.age < 4 || user.age > 17) return false;
            return (user.relationships || []).some(r =>
                (r.type === 'Brother' || r.type === 'Sister' || r.category === 'sibling') && isLivingNPC(r)
            );
        },
        getTargetNPC: (user) => {
            const siblings = (user.relationships || []).filter(r =>
                (r.type === 'Brother' || r.type === 'Sister' || r.category === 'sibling') && isLivingNPC(r)
            );
            return siblings[Math.floor(Math.random() * siblings.length)] || null;
        },
        render: (user, targetNPC) => ({
            title: "Shattered Antique Vase",
            badge: "Sibling Drama",
            badgeColor: "bg-amber-600",
            avatar: targetNPC,
            narrative: `While roughhousing in the living room, your ${targetNPC ? targetNPC.type.toLowerCase() : 'sibling'} ${targetNPC ? targetNPC.name : ''} accidentally knocked over your parents' prize antique vase, shattering it into pieces!`,
            options: [
                {
                    id: "take_blame",
                    title: "Take the Blame",
                    description: "Shield your sibling from punishment",
                    icon: "fa-shield-alt",
                    color: "emerald"
                },
                {
                    id: "cover_up",
                    title: "Superglue Cover-Up",
                    description: "Attempt an emergency repair before parents return",
                    icon: "fa-tools",
                    color: "blue",
                    badge: "Smarts 50+"
                },
                {
                    id: "snitch_sibling",
                    title: "Snitch Immediately",
                    description: "Point the finger at your sibling",
                    icon: "fa-bullhorn",
                    color: "red"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = getUserStat(user, 'smarts', 50);

            if (choiceId === "take_blame") {
                GameLogic.adjustStat(user, 'happiness', -10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 25);
                return {
                    log: `You took full blame for the broken vase and got grounded for a week, but ${targetNPC ? targetNPC.name : 'your sibling'} is eternally grateful.`,
                    logType: "neutral"
                };
            } else if (choiceId === "cover_up") {
                if (userSmarts >= 50) {
                    GameLogic.adjustStat(user, 'smarts', 10);
                    GameLogic.adjustStat(user, 'happiness', 10);
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                    return {
                        log: `You and ${targetNPC ? targetNPC.name : 'your sibling'} quickly superglued the pieces seamlessly! Your parents never noticed.`,
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -10);
                    return {
                        log: `Your sloppy glue job collapsed when your parents touched the table. Both of you were grounded.`,
                        logType: "bad"
                    };
                }
            } else {
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 20);
                return {
                    log: `You immediately snitched on ${targetNPC ? targetNPC.name : 'your sibling'}. They were grounded and now give you the silent treatment.`,
                    logType: "bad"
                };
            }
        }
    },

    // ==========================================
    // ADULTHOOD & PARENTHOOD (Ages 18–64)
    // ==========================================
    child_major_approval: {
        id: "child_major_approval",
        category: "parenthood",
        minAge: 32,
        maxAge: 90,
        probability: 1.0, // Guaranteed when child turns 18
        priority: 100,
        oncePerNpc: true,
        condition: (user, gameState) => {
            const history = gameState?.completedEventsHistory || [];
            return (user.relationships || []).some(r =>
                (r.type === 'Son' || r.type === 'Daughter' || r.category === 'child') &&
                r.age === 18 &&
                isLivingNPC(r) &&
                !history.some(h => h.eventId === 'child_major_approval' && h.npcId === r.id)
            );
        },
        getTargetNPC: (user, gameState) => {
            const history = gameState?.completedEventsHistory || [];
            return (user.relationships || []).find(r =>
                (r.type === 'Son' || r.type === 'Daughter' || r.category === 'child') &&
                r.age === 18 &&
                isLivingNPC(r) &&
                !history.some(h => h.eventId === 'child_major_approval' && h.npcId === r.id)
            ) || null;
        },
        render: (user, targetNPC) => {
            const childName = targetNPC ? targetNPC.name : 'Your child';
            const childRelation = targetNPC ? targetNPC.type.toLowerCase() : 'child';
            const proposedMajor = targetNPC?.proposedMajor || 'Art & Humanities';
            const userMoney = user.money ?? 0;

            return {
                title: "University Major Consultation",
                badge: "Family Milestone",
                badgeColor: "bg-blue-600",
                avatar: targetNPC,
                narrative: `Your ${childRelation}, ${childName}, has officially turned 18 and is preparing for university! They approach you: "I'm thinking of majoring in ${proposedMajor}. What do you think?"`,
                options: [
                    {
                        id: "approve_dream",
                        title: "Support Their Dream Major",
                        description: `Encourage them to pursue ${proposedMajor}`,
                        icon: "fa-thumbs-up",
                        color: "emerald"
                    },
                    {
                        id: "suggest_stem",
                        title: "Suggest Computer Science & Tech",
                        description: "Steer them toward high-demand tech careers",
                        icon: "fa-laptop-code",
                        color: "blue"
                    },
                    {
                        id: "suggest_business",
                        title: "Suggest Business & Finance",
                        description: "Steer them toward executive commerce & management",
                        icon: "fa-chart-line",
                        color: "blue"
                    },
                    {
                        id: "fund_tuition",
                        title: "Gift $10,000 Tuition Assistance",
                        description: "Cover college expenses out of pocket",
                        icon: "fa-graduation-cap",
                        color: "amber",
                        badge: "$10,000",
                        disabled: userMoney < 10000
                    },
                    {
                        id: "dismiss_child",
                        title: "Tell Them They're an Adult Now",
                        description: "Let them figure out life on their own",
                        icon: "fa-times-circle",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const childName = targetNPC ? targetNPC.name : 'Your child';
            const proposedMajor = targetNPC?.proposedMajor || 'Art & Humanities';

            if (choiceId === "approve_dream") {
                GameLogic.adjustStat(user, 'happiness', 10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                return {
                    log: `You gave ${childName} your blessing to pursue ${proposedMajor}. They beamed with gratitude!`,
                    logType: "good"
                };
            } else if (choiceId === "suggest_stem") {
                const childStatus = targetNPC?.status ?? 50;
                if (childStatus >= 45) {
                    if (targetNPC) {
                        targetNPC.proposedMajor = 'Computer Science';
                        if (typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                    }
                    return {
                        log: `${childName} respected your advice and decided to enroll in Computer Science!`,
                        logType: "good"
                    };
                } else {
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 10);
                    return {
                        log: `${childName} felt you were being too controlling and insisted on their original choice.`,
                        logType: "bad"
                    };
                }
            } else if (choiceId === "suggest_business") {
                const childStatus = targetNPC?.status ?? 50;
                if (childStatus >= 45) {
                    if (targetNPC) {
                        targetNPC.proposedMajor = 'Business Administration';
                        if (typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                    }
                    return {
                        log: `${childName} agreed that a Business degree is versatile and updated their application!`,
                        logType: "good"
                    };
                } else {
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 10);
                    return {
                        log: `${childName} rolled their eyes and declined your business suggestion.`,
                        logType: "bad"
                    };
                }
            } else if (choiceId === "fund_tuition") {
                user.money = Math.max(0, (user.money ?? 0) - 10000);
                GameLogic.adjustStat(user, 'happiness', 20);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 30);
                return {
                    log: `You gifted ${childName} $10,000 for their college tuition! Tears of joy filled their eyes.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', -5);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 15);
                return {
                    log: `You told ${childName} they are 18 and need to figure it out themselves. They walked away dejected.`,
                    logType: "bad"
                };
            }
        }
    },

    spouse_surprise_getaway: {
        id: "spouse_surprise_getaway",
        category: "romance",
        minAge: 20,
        maxAge: 75,
        probability: 0.24,
        priority: 30,
        cooldownYears: 6,
        condition: (user) => {
            return (user.relationships || []).some(r =>
                (r.type === 'Wife' || r.type === 'Husband' || r.type === 'Partner' || r.category === 'spouse' || r.category === 'partner') &&
                isLivingNPC(r)
            );
        },
        getTargetNPC: (user) => {
            const partners = (user.relationships || []).filter(r =>
                (r.type === 'Wife' || r.type === 'Husband' || r.type === 'Partner' || r.category === 'spouse' || r.category === 'partner') &&
                isLivingNPC(r)
            );
            return partners[Math.floor(Math.random() * partners.length)] || null;
        },
        render: (user, targetNPC) => {
            const userMoney = user.money ?? 0;
            const partnerName = targetNPC ? `${targetNPC.type} (${targetNPC.name})` : "Your partner";

            return {
                title: "Spontaneous Weekend Getaway",
                badge: "Romance",
                badgeColor: "bg-pink-600",
                avatar: targetNPC,
                narrative: `${partnerName} gives you a warm hug: "Things have been so busy lately. Let's take off for a spontaneous weekend at a luxury spa resort!" ($1,500)`,
                options: [
                    {
                        id: "book_getaway",
                        title: "Book the Luxury Resort ($1,500)",
                        description: "Pamper yourselves with fine dining & massages",
                        icon: "fa-glass-cheers",
                        color: "emerald",
                        badge: "$1,500",
                        disabled: userMoney < 1500
                    },
                    {
                        id: "budget_staycation",
                        title: "Cook a Romantic Dinner at Home ($100)",
                        description: "Candlelight pasta and music at home",
                        icon: "fa-utensils",
                        color: "blue",
                        badge: "$100",
                        disabled: userMoney < 100
                    },
                    {
                        id: "decline_getaway",
                        title: "Too Busy with Work / Errands",
                        description: "Politely pass on the getaway plans",
                        icon: "fa-ban",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const partnerName = targetNPC ? targetNPC.name : 'your partner';

            if (choiceId === "book_getaway") {
                user.money = Math.max(0, (user.money ?? 0) - 1500);
                GameLogic.adjustStat(user, 'happiness', 20);
                GameLogic.adjustStat(user, 'looks', 5);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 25);
                return {
                    log: `You and ${partnerName} spent an unforgettable weekend in a luxury spa chalet overlooking the mountains!`,
                    logType: "good"
                };
            } else if (choiceId === "budget_staycation") {
                user.money = Math.max(0, (user.money ?? 0) - 100);
                GameLogic.adjustStat(user, 'happiness', 10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                return {
                    log: `You cooked an exquisite homemade dinner with candlelights and slow dancing in the living room.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', -5);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 15);
                return {
                    log: `You told ${partnerName} that you were too exhausted from work. They felt neglected.`,
                    logType: "bad"
                };
            }
        }
    },

    // ==========================================
    // GOLDEN YEARS & ELDERHOOD (Ages 65+)
    // ==========================================
    elder_pickleball_championship: {
        id: "elder_pickleball_championship",
        category: "elderhood",
        minAge: 65,
        maxAge: 110,
        probability: 0.30,
        priority: 30,
        oncePerLife: true,
        condition: (user) => user.age >= 65,
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Senior Community Championship",
            badge: "Golden Years",
            badgeColor: "bg-amber-600",
            avatar: null,
            narrative: "The annual Senior Community Pickleball & Lawn Bowls Championship tournament has reached the final rounds!",
            options: [
                {
                    id: "play_for_gold",
                    title: "Play with Full Agility & Competitive Fire",
                    description: "Serve aces and dive for drop shots",
                    icon: "fa-trophy",
                    color: "emerald",
                    badge: "Health 50+"
                },
                {
                    id: "coach_team",
                    title: "Coach from the Sidelines",
                    description: "Guide your doubles partners strategically",
                    icon: "fa-clipboard-list",
                    color: "blue"
                },
                {
                    id: "enjoy_bingo",
                    title: "Head to the Clubhouse for Bingo & Tea",
                    description: "Enjoy a relaxed afternoon with friends",
                    icon: "fa-mug-hot",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userHealth = getUserStat(user, 'health', 70);

            if (choiceId === "play_for_gold") {
                if (userHealth >= 50) {
                    GameLogic.adjustStat(user, 'happiness', 25);
                    GameLogic.adjustStat(user, 'health', 5);
                    return {
                        log: "You served blazing cross-court winners and took home the 1st Place Senior Championship Gold Trophy!",
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'health', -10);
                    GameLogic.adjustStat(user, 'happiness', 5);
                    return {
                        log: "You lunged for a championship volley and tweaked a hamstring, but earned cheers and a silver medal!",
                        logType: "neutral"
                    };
                }
            } else if (choiceId === "coach_team") {
                GameLogic.adjustStat(user, 'happiness', 15);
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "Your tactical adjustments carried your doubles team to a glorious tournament victory!",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "You drank warm herbal tea, caught up with friends, and hit a diagonal Bingo win!",
                    logType: "good"
                };
            }
        }
    },

    grandchild_heirloom_gift: {
        id: "grandchild_heirloom_gift",
        category: "legacy",
        minAge: 60,
        maxAge: 110,
        probability: 0.28,
        priority: 40,
        oncePerNpc: true,
        condition: (user, gameState) => {
            const history = gameState?.completedEventsHistory || [];
            return user.age >= 60 && (user.relationships || []).some(r =>
                (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') &&
                isLivingNPC(r) &&
                !history.some(h => h.eventId === 'grandchild_heirloom_gift' && h.npcId === r.id)
            );
        },
        getTargetNPC: (user, gameState) => {
            const history = gameState?.completedEventsHistory || [];
            const adultChildren = (user.relationships || []).filter(r =>
                (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') &&
                isLivingNPC(r) &&
                !history.some(h => h.eventId === 'grandchild_heirloom_gift' && h.npcId === r.id)
            );
            return adultChildren[Math.floor(Math.random() * adultChildren.length)] || null;
        },
        render: (user, targetNPC) => {
            const childName = targetNPC ? `${targetNPC.type} (${targetNPC.name})` : "Your child";

            return {
                title: "Family Keepsake",
                badge: "Family Legacy",
                badgeColor: "bg-yellow-600",
                avatar: targetNPC,
                narrative: `While visiting your home, ${childName} admires a cherished vintage wristwatch passed down through your family for generations.`,
                options: [
                    {
                        id: "gift_heirloom",
                        title: "Pass Down the Heirloom",
                        description: "Bestow the prized watch as a family heirloom",
                        icon: "fa-gift",
                        color: "emerald"
                    },
                    {
                        id: "keep_for_now",
                        title: "Keep It in Your Collection",
                        description: "Share fond memories of the watch while holding onto it",
                        icon: "fa-clock",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const childName = targetNPC ? targetNPC.name : 'your child';

            if (choiceId === "gift_heirloom") {
                GameLogic.adjustStat(user, 'happiness', 20);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 30);
                return {
                    log: `You fastened the vintage timepiece around ${childName}'s wrist. They promised to cherish it as a family treasure.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: `You recounted fond memories of the heirloom's history while keeping it safely in your collection.`,
                    logType: "neutral"
                };
            }
        }
    },

    neglected_family_intervention: {
        id: "neglected_family_intervention",
        category: "family",
        minAge: 20,
        maxAge: 90,
        probability: 0.40,
        priority: 60,
        cooldownYears: 6,
        condition: (user) => {
            return (user.relationships || []).some(r =>
                isLivingNPC(r) &&
                ['spouse', 'partner', 'family', 'child'].includes(r.category) &&
                typeof r.status === 'number' &&
                r.status < 35
            );
        },
        getTargetNPC: (user) => {
            const neglected = (user.relationships || []).filter(r =>
                isLivingNPC(r) &&
                ['spouse', 'partner', 'family', 'child'].includes(r.category) &&
                typeof r.status === 'number' &&
                r.status < 35
            );
            return neglected[Math.floor(Math.random() * neglected.length)] || null;
        },
        render: (user, targetNPC) => {
            const relLabel = targetNPC ? `${targetNPC.type} (${targetNPC.name})` : "a loved one";
            const userMoney = user.money ?? 0;

            return {
                title: "Heart-to-Heart Intervention",
                badge: "Neglected Bond",
                badgeColor: "bg-pink-600",
                avatar: targetNPC,
                narrative: `Your ${relLabel} pulls you aside with tears in their eyes: "We barely speak anymore. Have you forgotten about us?"`,
                options: [
                    {
                        id: "heartfelt_apology",
                        title: "Clear Your Schedule & Listen",
                        description: "Spend real quality time rebuilding trust",
                        icon: "fa-heart",
                        color: "emerald"
                    },
                    {
                        id: "lavish_makegood",
                        title: "Plan a Special Dinner Outing ($300)",
                        description: "Treat them to an unforgettable evening",
                        icon: "fa-utensils",
                        color: "blue",
                        badge: "$300",
                        disabled: userMoney < 300
                    },
                    {
                        id: "defensive_excuse",
                        title: "Get Defensive & Walk Away",
                        description: "Tell them they're overreacting",
                        icon: "fa-door-open",
                        color: "red"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const name = targetNPC ? targetNPC.name : "your loved one";
            const leadershipBonus = getSkillXpSafe(user, 'leadership') >= 30 ? 5 : 0;

            if (choiceId === "heartfelt_apology") {
                GameLogic.adjustStat(user, 'happiness', 10);
                if (targetNPC && typeof targetNPC.status === 'number') {
                    targetNPC.status = Math.min(100, targetNPC.status + 25 + leadershipBonus);
                }
                return {
                    log: `You put away your phone, apologized sincerely, and spent hours catching up with ${name}.`,
                    logType: "good"
                };
            } else if (choiceId === "lavish_makegood") {
                user.money = Math.max(0, (user.money ?? 0) - 300);
                GameLogic.adjustStat(user, 'happiness', 15);
                if (targetNPC && typeof targetNPC.status === 'number') {
                    targetNPC.status = Math.min(100, targetNPC.status + 30);
                }
                return {
                    log: `You treated ${name} to a candlelit dinner and promised to stay present in their life.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', -10);
                if (targetNPC && typeof targetNPC.status === 'number') {
                    targetNPC.status = Math.max(0, targetNPC.status - 15);
                }
                return {
                    log: `You snapped back at ${name} and walked out, widening the rift between you.`,
                    logType: "bad"
                };
            }
        }
    },

    // ==========================================
    // MULTI-STAGE CONSEQUENCE CHAINS
    // ==========================================
    high_school_reunion_encounter: {
        id: "high_school_reunion_encounter",
        category: "social",
        minAge: 24,
        maxAge: 36,
        probability: 0.45,
        priority: 85,
        oncePerLife: true,
        condition: (user) => Boolean(user.lifeEventFlags?.classmate_fight_choice),
        getTargetNPC: () => null,
        render: (user) => {
            const prevChoice = user.lifeEventFlags?.classmate_fight_choice;
            const prevName = user.lifeEventFlags?.classmate_fight_name || 'your old classmate';
            const defused = prevChoice === 'defuse' && user.lifeEventFlags?.classmate_fight_defused;

            const narrative = defused
                ? `At a bustling alumni mixer, ${prevName} walks over laughing: "I still remember that joke you cracked back in school when I picked a fight! Actually, our firm is hiring a consultant..."`
                : `At an alumni mixer, you lock eyes across the room with ${prevName}—the very classmate from your schoolyard confrontation years ago!`;

            return {
                title: "Unexpected Reunion",
                badge: "Past Consequence",
                badgeColor: "bg-indigo-600",
                avatar: null,
                narrative,
                options: [
                    {
                        id: "reconnect_coffee",
                        title: defused ? "Accept the $2,000 Consulting Gig" : "Buy Them a Coffee & Bury the Hatchet",
                        description: defused ? "Turn old goodwill into real money" : "Turn an old rival into a mature connection",
                        icon: "fa-handshake",
                        color: "emerald"
                    },
                    {
                        id: "flex_success",
                        title: "Mention Your Career & Achievements",
                        description: "Show how far you've come since school",
                        icon: "fa-award",
                        color: "blue"
                    },
                    {
                        id: "keep_walking",
                        title: "Give a Polite Nod & Move On",
                        description: "Leave high school in the past",
                        icon: "fa-walking",
                        color: "slate"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const defused = user.lifeEventFlags?.classmate_fight_choice === 'defuse' && user.lifeEventFlags?.classmate_fight_defused;

            if (choiceId === "reconnect_coffee") {
                if (defused) {
                    user.money = (user.money ?? 0) + 2000;
                    GameLogic.adjustStat(user, 'happiness', 20);
                    return {
                        log: "Your witty peace-making years ago paid off! Their firm brought you on for a $2,000 weekend project.",
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', 15);
                    GameLogic.adjustStat(user, 'smarts', 5);
                    return {
                        log: "You shared a laugh over old memories and genuinely buried the hatchet.",
                        logType: "good"
                    };
                }
            } else if (choiceId === "flex_success") {
                GameLogic.adjustStat(user, 'happiness', 12);
                GameLogic.adjustStat(user, 'looks', 5);
                return {
                    log: "You casually dropped your recent accomplishments and walked away feeling confident.",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "You gave a brief nod and mingled with old friends instead.",
                    logType: "neutral"
                };
            }
        }
    }
};
