import { GameLogic } from '../gameLogic.js';
import { isLivingNPC } from './eventHelpers.js';

export const ADULT_CHILDREN_EVENTS = {
    child_wedding_celebration: {
        id: "child_wedding_celebration",
        category: "family",
        minAge: 35,
        maxAge: 110,
        probability: 0.55,
        priority: 75,
        oncePerNpc: true,
        cooldownYears: 2,
        condition: (user, gameState) => {
            const history = gameState?.completedEventsHistory || [];
            const rels = user?.relationships || [];
            return rels.some(r =>
                (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') &&
                isLivingNPC(r) &&
                r.justMarriedAtUserAge === user.age &&
                r.spouseId &&
                rels.some(s => s.id === r.spouseId && isLivingNPC(s)) &&
                !history.some(h => h.eventId === 'child_wedding_celebration' && h.npcId === r.id)
            );
        },
        getTargetNPC: (user, gameState) => {
            const history = gameState?.completedEventsHistory || [];
            const rels = user?.relationships || [];
            return rels.find(r =>
                (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') &&
                isLivingNPC(r) &&
                r.justMarriedAtUserAge === user.age &&
                r.spouseId &&
                rels.some(s => s.id === r.spouseId && isLivingNPC(s)) &&
                !history.some(h => h.eventId === 'child_wedding_celebration' && h.npcId === r.id)
            ) || null;
        },
        render: (user, targetNPC) => {
            const rels = user?.relationships || [];
            const spouse = targetNPC?.spouseId
                ? rels.find(s => s.id === targetNPC.spouseId && isLivingNPC(s))
                : null;
            const childName = targetNPC ? targetNPC.name : 'your child';
            const childLabel = targetNPC?.type ? targetNPC.type.toLowerCase() : 'child';
            const spouseName = spouse ? spouse.name : 'their partner';
            const userMoney = user?.money ?? 0;

            return {
                title: "A Family Wedding",
                badge: "Wedding Bells",
                badgeColor: "bg-pink-600",
                avatar: targetNPC,
                narrative: `Your ${childLabel}, ${childName}, just tied the knot with ${spouseName}! The newlyweds are glowing with joy and celebrating with the whole family.`,
                options: [
                    {
                        id: "gift_honeymoon",
                        title: "Sponsor a Dream Honeymoon ($5,000)",
                        description: "Treat the newlyweds to an unforgettable getaway",
                        icon: "fa-plane-departure",
                        color: "emerald",
                        badge: "$5,000",
                        disabled: userMoney < 5000
                    },
                    {
                        id: "gift_modest",
                        title: "Give a Thoughtful Wedding Gift ($500)",
                        description: "Help them furnish their new home together",
                        icon: "fa-gift",
                        color: "blue",
                        badge: "$500",
                        disabled: userMoney < 500
                    },
                    {
                        id: "toast_only",
                        title: "Offer a Heartfelt Wedding Toast",
                        description: "Share your warm blessing and wisdom for free",
                        icon: "fa-glass-cheers",
                        color: "amber"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const rels = user?.relationships || [];
            const spouse = targetNPC?.spouseId
                ? rels.find(s => s.id === targetNPC.spouseId && isLivingNPC(s))
                : null;
            const childName = targetNPC ? targetNPC.name : 'your child';
            const spouseName = spouse ? spouse.name : 'their spouse';

            if (choiceId === "gift_honeymoon") {
                user.money = Math.max(0, (user.money ?? 0) - 5000);
                GameLogic.adjustStat(user, 'happiness', 18);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 25);
                if (spouse && typeof spouse.status === 'number') spouse.status = Math.min(100, spouse.status + 20);
                return {
                    log: `You surprised ${childName} and ${spouseName} with an all-expenses-paid honeymoon! They were overjoyed.`,
                    logType: "good"
                };
            } else if (choiceId === "gift_modest") {
                user.money = Math.max(0, (user.money ?? 0) - 500);
                GameLogic.adjustStat(user, 'happiness', 12);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                if (spouse && typeof spouse.status === 'number') spouse.status = Math.min(100, spouse.status + 12);
                return {
                    log: `You gave ${childName} and ${spouseName} a generous $500 wedding gift to start their life together.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 8);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                if (spouse && typeof spouse.status === 'number') spouse.status = Math.min(100, spouse.status + 8);
                return {
                    log: `Your touching wedding toast brought happy tears to ${childName} and ${spouseName}.`,
                    logType: "good"
                };
            }
        }
    },

    first_grandchild_celebration: {
        id: "first_grandchild_celebration",
        category: "family",
        minAge: 35,
        maxAge: 115,
        probability: 1.0,
        priority: 80,
        oncePerLife: true,
        condition: (user) => {
            return (user?.relationships || []).some(r =>
                (r.type === 'Grandson' || r.type === 'Granddaughter') &&
                Number(r.age) === 0 &&
                isLivingNPC(r)
            );
        },
        getTargetNPC: (user) => {
            return (user?.relationships || []).find(r =>
                (r.type === 'Grandson' || r.type === 'Granddaughter') &&
                Number(r.age) === 0 &&
                isLivingNPC(r)
            ) || null;
        },
        render: (user, targetNPC) => {
            const rels = user?.relationships || [];
            const parentChild = targetNPC?.parentChildId
                ? rels.find(r => r.id === targetNPC.parentChildId && isLivingNPC(r))
                : null;
            const parentName = parentChild ? parentChild.name : 'your child';
            const parentLabel = parentChild?.type ? parentChild.type.toLowerCase() : 'child';
            const babyName = targetNPC ? targetNPC.name : 'your newborn grandchild';
            const userMoney = user?.money ?? 0;

            const narrative = targetNPC?.bornOutOfWedlock
                ? `Unexpected joy has arrived! Your unmarried ${parentLabel}, ${parentName}, just welcomed your very first grandchild, ${babyName}! How will you greet the newest member of the family?`
                : `Congratulations, Grandparent! Your ${parentLabel}, ${parentName}, just welcomed your very first grandchild, ${babyName}! Everyone is gathered lovingly around the crib.`;

            return {
                title: "Welcome, Grandparent!",
                badge: "First Grandchild",
                badgeColor: "bg-emerald-600",
                avatar: targetNPC,
                narrative,
                options: [
                    {
                        id: "college_fund",
                        title: "Start a $2,500 College Fund",
                        description: "Give your first grandchild a bright head start",
                        icon: "fa-piggy-bank",
                        color: "emerald",
                        badge: "$2,500",
                        disabled: userMoney < 2500
                    },
                    {
                        id: "nursery_gift",
                        title: "Bring Baby Gifts & Essentials ($250)",
                        description: "Spoil the newborn with clothes, toys, and blankets",
                        icon: "fa-baby-carriage",
                        color: "blue",
                        badge: "$250",
                        disabled: userMoney < 250
                    },
                    {
                        id: "parenting_wisdom",
                        title: "Share Loving Grandparent Advice",
                        description: "Offer warm encouragement and lend a helping hand",
                        icon: "fa-heart",
                        color: "pink"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const rels = user?.relationships || [];
            const parentChild = targetNPC?.parentChildId
                ? rels.find(r => r.id === targetNPC.parentChildId && isLivingNPC(r))
                : null;
            const babyName = targetNPC ? targetNPC.name : 'your grandchild';
            const parentName = parentChild ? parentChild.name : 'your child';

            if (choiceId === "college_fund") {
                user.money = Math.max(0, (user.money ?? 0) - 2500);
                GameLogic.adjustStat(user, 'happiness', 22);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                if (parentChild && typeof parentChild.status === 'number') parentChild.status = Math.min(100, parentChild.status + 25);
                return {
                    log: `You opened a $2,500 college fund for ${babyName}! ${parentName} was deeply moved by your generosity.`,
                    logType: "good"
                };
            } else if (choiceId === "nursery_gift") {
                user.money = Math.max(0, (user.money ?? 0) - 250);
                GameLogic.adjustStat(user, 'happiness', 15);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                if (parentChild && typeof parentChild.status === 'number') parentChild.status = Math.min(100, parentChild.status + 15);
                return {
                    log: `You arrived with a bundle of adorable baby gifts for ${babyName}, delighting ${parentName}.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 5);
                if (parentChild && typeof parentChild.status === 'number') parentChild.status = Math.min(100, parentChild.status + 10);
                return {
                    log: `You rocked ${babyName} to sleep and shared comforting parenting wisdom with ${parentName}.`,
                    logType: "good"
                };
            }
        }
    },

    spoil_grandchild_outing: {
        id: "spoil_grandchild_outing",
        category: "family",
        minAge: 45,
        maxAge: 115,
        probability: 0.25,
        priority: 35,
        cooldownYears: 4,
        condition: (user) => {
            return (user?.relationships || []).some(r =>
                (r.type === 'Grandson' || r.type === 'Granddaughter') &&
                isLivingNPC(r) &&
                Number(r.age) >= 3 &&
                Number(r.age) <= 16
            );
        },
        getTargetNPC: (user) => {
            const grandchildren = (user?.relationships || []).filter(r =>
                (r.type === 'Grandson' || r.type === 'Granddaughter') &&
                isLivingNPC(r) &&
                Number(r.age) >= 3 &&
                Number(r.age) <= 16
            );
            return grandchildren[Math.floor(Math.random() * grandchildren.length)] || null;
        },
        render: (user, targetNPC) => {
            const gkName = targetNPC ? targetNPC.name : 'your grandchild';
            const gkLabel = targetNPC?.type ? targetNPC.type.toLowerCase() : 'grandchild';
            const gkAge = typeof targetNPC?.age === 'number' ? targetNPC.age : 8;
            const userMoney = user?.money ?? 0;

            return {
                title: "Grandparent Weekend Outing",
                badge: "Grandparenting",
                badgeColor: "bg-amber-600",
                avatar: targetNPC,
                narrative: `Your ${gkLabel}, ${gkName} (Age ${gkAge}), is staying over for the weekend and looks up at you with wide eyes: "Can we do something super fun today?"`,
                options: [
                    {
                        id: "theme_park",
                        title: "Take Them to the Theme Park ($200)",
                        description: "Rollercoasters, cotton candy, and giant plush prizes",
                        icon: "fa-ticket-alt",
                        color: "emerald",
                        badge: "$200",
                        disabled: userMoney < 200
                    },
                    {
                        id: "ice_cream_story",
                        title: "Grab Ice Cream & Tell Family Stories ($30)",
                        description: "A double scoop and classic tales from your youth",
                        icon: "fa-ice-cream",
                        color: "blue",
                        badge: "$30",
                        disabled: userMoney < 30
                    },
                    {
                        id: "bake_together",
                        title: "Bake Cookies Together at Home",
                        description: "Make a delicious mess in the kitchen for free",
                        icon: "fa-cookie-bite",
                        color: "amber"
                    }
                ]
            };
        },
        resolve: (user, targetNPC, choiceId) => {
            const rels = user?.relationships || [];
            const parentChild = targetNPC?.parentChildId
                ? rels.find(r => r.id === targetNPC.parentChildId && isLivingNPC(r))
                : null;
            const gkName = targetNPC ? targetNPC.name : 'your grandchild';

            if (choiceId === "theme_park") {
                user.money = Math.max(0, (user.money ?? 0) - 200);
                GameLogic.adjustStat(user, 'happiness', 18);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 25);
                if (parentChild && typeof parentChild.status === 'number') parentChild.status = Math.min(100, parentChild.status + 10);
                return {
                    log: `You spoiled ${gkName} at the theme park with rides, cotton candy, and an oversized stuffed bear!`,
                    logType: "good"
                };
            } else if (choiceId === "ice_cream_story") {
                user.money = Math.max(0, (user.money ?? 0) - 30);
                GameLogic.adjustStat(user, 'happiness', 12);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                return {
                    log: `You shared ice cream sundaes with ${gkName} and regaled them with stories of your younger days.`,
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                return {
                    log: `You and ${gkName} covered the kitchen in flour and baked warm chocolate chip cookies together!`,
                    logType: "good"
                };
            }
        }
    }
};
