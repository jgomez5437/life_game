import { GameLogic } from './gameLogic.js';
import { MAJORS } from './constants.js';

function getSkillXpSafe(user, skillKey) {
    if (!user || !skillKey) return 0;
    if (typeof GameLogic.getSkillXp === 'function') {
        return GameLogic.getSkillXp(user, skillKey);
    }
    return Math.max(0, Math.min(100, Number(user.skills?.[skillKey]?.xp) || 0));
}

function getUserStat(user, statName, fallback = 50) {
    return user?.[statName] ?? user?.stats?.[statName] ?? fallback;
}

function isLivingNPC(r) {
    if (!r) return false;
    return r.lifeStatus !== 'Deceased' && !r.isDead && r.isAlive !== false && !r.deathCause;
}

function ensureEventFlags(user) {
    if (!user) return {};
    if (!user.lifeEventFlags || typeof user.lifeEventFlags !== 'object' || Array.isArray(user.lifeEventFlags)) {
        user.lifeEventFlags = {};
    }
    return user.lifeEventFlags;
}

export const LIFE_EVENTS = {
    // ==========================================
    // TODDLER & EARLY CHILDHOOD (Ages 1–4)
    // ==========================================
    toddler_daycare_blocks: {
        id: "toddler_daycare_blocks",
        category: "childhood",
        minAge: 1,
        maxAge: 4,
        probability: 0.35,
        priority: 30,
        oncePerLife: true,
        condition: (user) => user.age >= 1 && user.age <= 4,
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Playtime Blocks",
            badge: "Early Childhood",
            badgeColor: "bg-amber-500",
            avatar: null,
            narrative: "During playtime, you are presented with a giant bin filled with colorful wooden building blocks.",
            options: [
                {
                    id: "build_tower",
                    title: "Build a Tall Skyscraper",
                    description: "Carefully balance the blocks",
                    icon: "fa-cubes",
                    color: "emerald"
                },
                {
                    id: "smash_blocks",
                    title: "Roar & Smash Towers",
                    description: "Unleash your inner dinosaur",
                    icon: "fa-bomb",
                    color: "amber"
                },
                {
                    id: "share_blocks",
                    title: "Share Blocks with Toddlers",
                    description: "Practice kindness",
                    icon: "fa-heart",
                    color: "blue"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "build_tower") {
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "You carefully balanced a towering block skyscraper! The caretakers applauded.",
                    logType: "good"
                };
            } else if (choiceId === "smash_blocks") {
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: "You rampaged across the carpet knocking down every tower in sight!",
                    logType: "neutral"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 15);
                return {
                    log: "You shared your favorite blue blocks with another toddler and shared giggles.",
                    logType: "good"
                };
            }
        }
    },

    // ==========================================
    // ELEMENTARY & MIDDLE SCHOOL (Ages 5–13)
    // ==========================================
    classmate_fight: {
        id: "classmate_fight",
        category: "school",
        minAge: 6,
        maxAge: 17,
        probability: 0.25,
        priority: 40,
        oncePerLife: true,
        condition: (user) => user.age >= 6 && user.age <= 17,
        getTargetNPC: (user) => {
            const classmates = (user.relationships || []).filter(r => r.type === 'Classmate' || r.category === 'classmate');
            if (classmates.length > 0) {
                return classmates[Math.floor(Math.random() * classmates.length)];
            }
            return {
                name: "Bully Classmate",
                type: "Classmate",
                age: user.age,
                smarts: 40,
                health: 80
            };
        },
        render: (user, targetNPC) => ({
            title: "Classroom Confrontation",
            badge: "School Conflict",
            badgeColor: "bg-red-600",
            avatar: targetNPC,
            narrative: `During break, your classmate ${targetNPC ? targetNPC.name : 'a bully'} approaches you aggressively, shoving your shoulder and picking a fight in front of an eager crowd!`,
            options: [
                {
                    id: "fight_back",
                    title: "Fight Back",
                    description: "Stand your ground and throw a counter-punch",
                    icon: "fa-fist-raised",
                    color: "red"
                },
                {
                    id: "tell_teacher",
                    title: "Tell the Teacher / Principal",
                    description: "Report the bullying to school staff",
                    icon: "fa-user-tie",
                    color: "blue"
                },
                {
                    id: "defuse",
                    title: "Defuse with Wit & Humor",
                    description: "Try to disarm the tension with a witty comeback",
                    icon: "fa-laugh-beam",
                    color: "emerald",
                    badge: "Smarts 55+"
                },
                {
                    id: "walk_away",
                    title: "Walk Away",
                    description: "Ignore the taunts and walk away",
                    icon: "fa-walking",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = getUserStat(user, 'smarts', 50);
            const userHealth = getUserStat(user, 'health', 100);
            const npcSmarts = targetNPC?.smarts || 40;
            const npcHealth = targetNPC?.health || 70;

            const flags = ensureEventFlags(user);
            flags.classmate_fight_choice = choiceId;
            flags.classmate_fight_name = targetNPC?.name || 'a former classmate';

            if (choiceId === "fight_back") {
                const won = GameLogic.calculateFightOutcome(userSmarts, userHealth, npcSmarts, npcHealth);
                if (won) {
                    GameLogic.adjustStat(user, 'health', -5);
                    GameLogic.adjustStat(user, 'happiness', 15);
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 20);
                    return {
                        log: `You threw a sharp counter-hook and knocked ${targetNPC ? targetNPC.name : 'the bully'} to the floor! The crowd went wild.`,
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'health', -20);
                    GameLogic.adjustStat(user, 'happiness', -15);
                    return {
                        log: `You swung hard but ${targetNPC ? targetNPC.name : 'the bully'} tackled you to the ground and gave you a black eye.`,
                        logType: "bad"
                    };
                }
            } else if (choiceId === "tell_teacher") {
                GameLogic.adjustStat(user, 'smarts', 5);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 25);
                return {
                    log: `You reported ${targetNPC ? targetNPC.name : 'the classmate'} to the principal's office. They were given detention and warned.`,
                    logType: "neutral"
                };
            } else if (choiceId === "defuse") {
                if (userSmarts >= 55) {
                    GameLogic.adjustStat(user, 'smarts', 10);
                    GameLogic.adjustStat(user, 'happiness', 10);
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                    flags.classmate_fight_defused = true;
                    return {
                        log: `You cracked a hilarious, disarming joke that made the onlookers laugh. ${targetNPC ? targetNPC.name : 'The bully'} chuckled and walked off!`,
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -5);
                    return {
                        log: `Your comeback was awkward and nobody laughed. You slunk away embarrassed.`,
                        logType: "bad"
                    };
                }
            } else {
                GameLogic.adjustStat(user, 'happiness', -5);
                return {
                    log: "You calmly walked away from the confrontation. You avoided injury, though you took a slight hit to your pride.",
                    logType: "neutral"
                };
            }
        }
    },

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

    science_fair_project: {
        id: "science_fair_project",
        category: "school",
        minAge: 10,
        maxAge: 14,
        probability: 0.25,
        priority: 40,
        oncePerLife: true,
        condition: (user) => user.age >= 10 && user.age <= 14,
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Annual Science Fair",
            badge: "School Event",
            badgeColor: "bg-blue-600",
            avatar: null,
            narrative: "The annual middle school Science Fair is coming up! How do you want to tackle your science project?",
            options: [
                {
                    id: "complex_robotics",
                    title: "Build a Solar Robotics Project",
                    description: "Aim for 1st Place with an ambitious build",
                    icon: "fa-robot",
                    color: "emerald",
                    badge: "Smarts 55+"
                },
                {
                    id: "baking_soda_volcano",
                    title: "Classic Baking Soda Volcano",
                    description: "Reliable, messy, and classic",
                    icon: "fa-mountain",
                    color: "blue"
                },
                {
                    id: "slacker_poster",
                    title: "Slap Together a Poster Overnight",
                    description: "Minimal effort science project",
                    icon: "fa-file-alt",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = getUserStat(user, 'smarts', 50);

            if (choiceId === "complex_robotics") {
                if (userSmarts >= 55) {
                    GameLogic.adjustStat(user, 'smarts', 20);
                    GameLogic.adjustStat(user, 'happiness', 20);
                    const flags = ensureEventFlags(user);
                    flags.built_solar_rover = true;
                    return {
                        log: "Your automated solar rover took 1st Place at the Science Fair and won a gold ribbon!",
                        logType: "good",
                        badges: [{ label: "1st Place Gold Ribbon", tone: "good" }]
                    };
                } else {
                    GameLogic.adjustStat(user, 'smarts', 10);
                    return {
                        log: "Your robot shorted out during the demonstration with a spark, but judges praised the ambition.",
                        logType: "neutral"
                    };
                }
            } else if (choiceId === "baking_soda_volcano") {
                GameLogic.adjustStat(user, 'smarts', 5);
                GameLogic.adjustStat(user, 'happiness', 10);
                return {
                    log: "Red lava erupted everywhere and amused the judges. A solid honorable mention!",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'smarts', 2);
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "You glued some printed Wikipedia articles onto poster board at 2 AM. You received a passing grade.",
                    logType: "neutral"
                };
            }
        }
    },

    // ==========================================
    // TEENAGE MILESTONES (Ages 14–17)
    // ==========================================
    teen_driving_lesson: {
        id: "teen_driving_lesson",
        category: "milestone",
        minAge: 15,
        maxAge: 17,
        probability: 0.35,
        priority: 45,
        oncePerLife: true,
        condition: (user) => {
            if (user.age < 15 || user.age > 17) return false;
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
        render: (user, targetNPC) => ({
            title: "First Driving Lesson",
            badge: "Teen Milestone",
            badgeColor: "bg-indigo-600",
            avatar: targetNPC,
            narrative: `Your ${targetNPC ? targetNPC.type.toLowerCase() : 'parent'}, ${targetNPC ? targetNPC.name : ''}, took you to an empty mall parking lot to give you your very first driving lesson behind the wheel!`,
            options: [
                {
                    id: "drive_carefully",
                    title: "Drive Carefully & Practice Parking",
                    description: "Focus on mirrors and smooth braking",
                    icon: "fa-car",
                    color: "emerald"
                },
                {
                    id: "speed_up",
                    title: "Step on the Gas",
                    description: "See how fast this car can accelerate!",
                    icon: "fa-tachometer-alt",
                    color: "amber"
                },
                {
                    id: "refuse_drive",
                    title: "Too Anxious to Drive",
                    description: "Ask to switch back to the passenger seat",
                    icon: "fa-ban",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "drive_carefully") {
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 10);
                return {
                    log: `You practiced three-point turns and parallel parking smoothly. ${targetNPC ? targetNPC.name : 'Your parent'} praised your focus!`,
                    logType: "good"
                };
            } else if (choiceId === "speed_up") {
                const roll = Math.random();
                if (roll > 0.45) {
                    GameLogic.adjustStat(user, 'happiness', 20);
                    GameLogic.adjustStat(user, 'looks', 5);
                    return {
                        log: `You zipped around the light poles like a pro stunt driver and made the tires squeal! Pure adrenaline!`,
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -15);
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.max(0, targetNPC.status - 20);
                    return {
                        log: `You slammed the gas, lost control, and mounted the curb! ${targetNPC ? targetNPC.name : 'Your parent'} screamed in sheer terror.`,
                        logType: "bad"
                    };
                }
            } else {
                GameLogic.adjustStat(user, 'happiness', -5);
                return {
                    log: "You were overwhelmed by the dashboard controls and asked to practice another day.",
                    logType: "neutral"
                };
            }
        }
    },

    teen_sneak_out_party: {
        id: "teen_sneak_out_party",
        category: "social",
        minAge: 14,
        maxAge: 17,
        probability: 0.26,
        priority: 30,
        oncePerLife: true,
        condition: (user) => user.age >= 14 && user.age <= 17,
        getTargetNPC: (user) => {
            const friends = (user.relationships || []).filter(r => r.type === 'Friend' || r.type === 'Classmate' || r.category === 'friend');
            return friends.length > 0 ? friends[Math.floor(Math.random() * friends.length)] : null;
        },
        render: (user, targetNPC) => ({
            title: "Midnight Bonfire Party",
            badge: "Social Scene",
            badgeColor: "bg-purple-600",
            avatar: targetNPC,
            narrative: `Your ${targetNPC ? targetNPC.type.toLowerCase() : 'friend'}, ${targetNPC ? targetNPC.name : 'a classmate'}, messages you at 11:30 PM: "Everyone is sneaking out to the lake bonfire tonight. Are you coming?!"`,
            options: [
                {
                    id: "sneak_out",
                    title: "Sneak Out Bedroom Window",
                    description: "Creep out and head to the bonfire party",
                    icon: "fa-moon",
                    color: "purple"
                },
                {
                    id: "stay_home",
                    title: "Stay Home & Study",
                    description: "Play it safe and sleep early",
                    icon: "fa-book-open",
                    color: "blue"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "sneak_out") {
                const roll = Math.random();
                if (roll < 0.65) {
                    GameLogic.adjustStat(user, 'happiness', 25);
                    GameLogic.adjustStat(user, 'looks', 10);
                    if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 15);
                    return {
                        log: `You snuck out effortlessly and partied around the bonfire under the stars until 3 AM!`,
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -20);
                    return {
                        log: "You stepped on a squeaky floorboard and your parents caught you climbing back through the window. Grounded for a month!",
                        logType: "bad"
                    };
                }
            } else {
                GameLogic.adjustStat(user, 'smarts', 10);
                return {
                    log: "You decided against the risk and got a great night's sleep after studying.",
                    logType: "neutral"
                };
            }
        }
    },

    school_prom_invitation: {
        id: "school_prom_invitation",
        category: "social",
        minAge: 16,
        maxAge: 17,
        probability: 0.30,
        priority: 45,
        oncePerLife: true,
        condition: (user) => user.age >= 16 && user.age <= 17,
        getTargetNPC: (user) => {
            const cohort = (user.relationships || []).filter(r => r.type === 'Classmate' || r.type === 'Friend');
            return cohort.length > 0 ? cohort[Math.floor(Math.random() * cohort.length)] : null;
        },
        render: (user, targetNPC) => ({
            title: "High School Prom Invitation",
            badge: "High School Milestone",
            badgeColor: "bg-pink-600",
            avatar: targetNPC,
            narrative: `High School Prom is approaching! ${targetNPC ? targetNPC.name : 'A popular classmate'} walks up with a creative poster asking if you'd like to go as their date!`,
            options: [
                {
                    id: "accept_with_flair",
                    title: "Say Yes & Go Together",
                    description: "Rent an outfit and hit the dance floor",
                    icon: "fa-star",
                    color: "emerald"
                },
                {
                    id: "go_with_friends",
                    title: "Go with a Group of Friends",
                    description: "Dance with your squad without romance drama",
                    icon: "fa-users",
                    color: "blue"
                },
                {
                    id: "skip_prom",
                    title: "Skip Prom Entirely",
                    description: "Save your money and relax at home",
                    icon: "fa-times-circle",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "accept_with_flair") {
                GameLogic.adjustStat(user, 'happiness', 25);
                GameLogic.adjustStat(user, 'looks', 10);
                if (targetNPC && typeof targetNPC.status === 'number') targetNPC.status = Math.min(100, targetNPC.status + 20);
                return {
                    log: `You went to prom with ${targetNPC ? targetNPC.name : 'your date'} and danced the night away!`,
                    logType: "good"
                };
            } else if (choiceId === "go_with_friends") {
                GameLogic.adjustStat(user, 'happiness', 20);
                return {
                    log: "You arrived with your best friends and owned the dance floor all night long!",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'smarts', 10);
                return {
                    log: "You skipped the expensive tickets and spent a quiet evening relaxing.",
                    logType: "neutral"
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

    // ==========================================
    // OBVIOUS DOMAIN-SPECIFIC EVENTS
    // ==========================================
    university_hackathon_finals: {
        id: "university_hackathon_finals",
        category: "education",
        minAge: 18,
        maxAge: 45,
        probability: 0.40,
        priority: 50,
        oncePerLife: true,
        condition: (user) => Boolean(user.universityEnrolled || user.gradSchoolEnrolled),
        getTargetNPC: () => null,
        render: (user) => ({
            title: "Campus Innovation Hackathon",
            badge: "University Life",
            badgeColor: "bg-indigo-600",
            avatar: null,
            narrative: "Your university is hosting a 48-hour Innovation & Startup Challenge with a $2,500 grand prize and recruiters watching!",
            options: [
                {
                    id: "lead_tech_build",
                    title: "Lead the Technical Prototype",
                    description: "Pull an all-nighter building a live product",
                    icon: "fa-laptop-code",
                    color: "emerald",
                    badge: "Coding/Design 30+ or Smarts 65+"
                },
                {
                    id: "pitch_business",
                    title: "Deliver the Keynote Stage Pitch",
                    description: "Win the judges over with storytelling",
                    icon: "fa-microphone",
                    color: "blue",
                    badge: "Leadership 25+"
                },
                {
                    id: "cram_finals_instead",
                    title: "Skip & Study for Regular Exams",
                    description: "Focus steadily on your coursework",
                    icon: "fa-book",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const codingXp = getSkillXpSafe(user, 'coding');
            const designXp = getSkillXpSafe(user, 'design');
            const leadXp = getSkillXpSafe(user, 'leadership');
            const userSmarts = getUserStat(user, 'smarts', 50);

            if (choiceId === "lead_tech_build") {
                if (codingXp >= 30 || designXp >= 30 || userSmarts >= 65) {
                    user.money = (user.money ?? 0) + 2500;
                    if (typeof user.schoolPerformance === 'number') user.schoolPerformance = Math.min(100, user.schoolPerformance + 15);
                    GameLogic.adjustStat(user, 'smarts', 10);
                    GameLogic.adjustStat(user, 'happiness', 15);
                    return {
                        log: "Your team's prototype blew the judges away and won 1st Place ($2,500 prize)!",
                        logType: "good",
                        badges: [{ label: "+15 School Perf", tone: "good" }]
                    };
                } else {
                    if (typeof user.schoolPerformance === 'number') user.schoolPerformance = Math.min(100, user.schoolPerformance + 6);
                    GameLogic.adjustStat(user, 'smarts', 5);
                    return {
                        log: "Your demo crashed halfway through, but professors admired your grit and gave extra credit.",
                        logType: "neutral"
                    };
                }
            } else if (choiceId === "pitch_business") {
                if (leadXp >= 25 || userSmarts >= 55) {
                    user.money = (user.money ?? 0) + 750;
                    if (typeof user.schoolPerformance === 'number') user.schoolPerformance = Math.min(100, user.schoolPerformance + 10);
                    GameLogic.adjustStat(user, 'happiness', 10);
                    return {
                        log: "Your charismatic pitch clinched Runner-Up Honors ($750) and impressed campus recruiters!",
                        logType: "good"
                    };
                }
                if (typeof user.schoolPerformance === 'number') user.schoolPerformance = Math.min(100, user.schoolPerformance + 5);
                GameLogic.adjustStat(user, 'happiness', 5);
                return {
                    log: "You got stage fright during Q&A, but gained solid presentation experience.",
                    logType: "neutral"
                };
            } else {
                if (typeof user.schoolPerformance === 'number') user.schoolPerformance = Math.min(100, user.schoolPerformance + 8);
                GameLogic.adjustStat(user, 'smarts', 5);
                return {
                    log: "You stayed in the quiet library stacks and aced your weekly quizzes.",
                    logType: "neutral"
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
    },

    virtuoso_talent_scout: {
        id: "virtuoso_talent_scout",
        category: "skills",
        minAge: 14,
        maxAge: 70,
        probability: 0.35,
        priority: 55,
        oncePerLife: true,
        condition: (user) => Boolean(
            user.skills && Object.values(user.skills).some(s => s && (s.xp || 0) >= 55)
        ),
        getTargetNPC: () => null,
        render: () => ({
            title: "Talent Scout Invitation",
            badge: "Skill Recognition",
            badgeColor: "bg-indigo-600",
            avatar: null,
            narrative: "Your dedicated practice hasn't gone unnoticed! A regional showcase director invites you to perform and demonstrate your mastery in front of paying guests.",
            options: [
                {
                    id: "headline_showcase",
                    title: "Headline the Showcase Stage",
                    description: "Go all out for a $1,800 appearance fee",
                    icon: "fa-star",
                    color: "emerald"
                },
                {
                    id: "network_mentors",
                    title: "Workshop & Network Backstage",
                    description: "Connect with master mentors (+Smarts & $600)",
                    icon: "fa-users",
                    color: "blue"
                },
                {
                    id: "keep_hobby_private",
                    title: "Keep Your Craft Personal",
                    description: "Decline the spotlight politely",
                    icon: "fa-heart",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            if (choiceId === "headline_showcase") {
                user.money = (user.money ?? 0) + 1800;
                GameLogic.adjustStat(user, 'happiness', 20);
                GameLogic.adjustStat(user, 'looks', 5);
                return {
                    log: "Your showcase earned a standing ovation and a $1,800 honorarium!",
                    logType: "good"
                };
            } else if (choiceId === "network_mentors") {
                user.money = (user.money ?? 0) + 600;
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 12);
                return {
                    log: "You traded techniques with elite pros backstage and walked away sharper and $600 richer.",
                    logType: "good"
                };
            } else {
                GameLogic.adjustStat(user, 'happiness', 8);
                return {
                    log: "You chose to keep practicing purely for the love of the craft.",
                    logType: "neutral"
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

export const EventManager = {
    ensureFlags: ensureEventFlags,

    setFlag: (user, key, value) => {
        const flags = ensureEventFlags(user);
        flags[key] = value;
    },

    getFlag: (user, key, fallback = null) => {
        if (!user?.lifeEventFlags) return fallback;
        return user.lifeEventFlags[key] !== undefined ? user.lifeEventFlags[key] : fallback;
    },

    updateHabitTrackers: (user) => {
        if (!user) return;
        const flags = ensureEventFlags(user);
        const currentDiet = user.diet || (user.hasBetterDiet ? 'balanced' : 'junk');

        if ((user.age || 0) >= 18 && currentDiet === 'junk' && !user.gymMembership) {
            flags.junkDietYears = (flags.junkDietYears || 0) + 1;
        } else {
            flags.junkDietYears = 0;
        }
    },

    canTriggerEvent: (evt, user, gameState, targetNPC = null) => {
        if (!evt || !user || !gameState) return false;
        const currentAge = user.age || 0;
        const history = Array.isArray(gameState.completedEventsHistory) ? gameState.completedEventsHistory : [];

        if (evt.oncePerLife) {
            if (history.some(h => h.eventId === evt.id)) return false;
        }

        if (evt.oncePerNpc && targetNPC?.id) {
            if (history.some(h => h.eventId === evt.id && h.npcId === targetNPC.id)) return false;
        }

        if (typeof evt.cooldownYears === 'number' && evt.cooldownYears > 0) {
            const pastMatches = history.filter(h => h.eventId === evt.id);
            if (pastMatches.length > 0) {
                const lastAge = Math.max(...pastMatches.map(h => Number(h.age) || 0));
                if ((currentAge - lastAge) < evt.cooldownYears) return false;
            }
        }

        return true;
    },

    evaluateAgeUpEvents: (user, gameState) => {
        if (!user || !gameState) return;
        if (!gameState.pendingEvents) gameState.pendingEvents = [];
        if (!gameState.completedEventsHistory) gameState.completedEventsHistory = [];

        EventManager.updateHabitTrackers(user);

        const currentAge = user.age || 0;

        // Collect eligible events with resolved targetNPC
        const eligibleEntries = [];
        for (const key in LIFE_EVENTS) {
            const evt = LIFE_EVENTS[key];

            if (evt.minAge !== undefined && currentAge < evt.minAge) continue;
            if (evt.maxAge !== undefined && currentAge > evt.maxAge) continue;
            if (evt.condition && !evt.condition(user, gameState)) continue;

            const targetNPC = evt.getTargetNPC ? evt.getTargetNPC(user, gameState) : null;
            if (!EventManager.canTriggerEvent(evt, user, gameState, targetNPC)) continue;

            eligibleEntries.push({
                evt,
                targetNPC,
                priority: typeof evt.priority === 'number' ? evt.priority : 25
            });
        }

        // Group by descending priority so milestones & consequence chains evaluate before general flavor events
        const priorityGroups = new Map();
        for (const entry of eligibleEntries) {
            if (!priorityGroups.has(entry.priority)) {
                priorityGroups.set(entry.priority, []);
            }
            priorityGroups.get(entry.priority).push(entry);
        }

        const sortedPriorities = Array.from(priorityGroups.keys()).sort((a, b) => b - a);

        for (const prio of sortedPriorities) {
            const shuffled = priorityGroups.get(prio).sort(() => 0.5 - Math.random());
            for (const { evt, targetNPC } of shuffled) {
                const roll = Math.random();
                if (roll <= (evt.probability ?? 0.25)) {
                    gameState.pendingEvents.push({
                        eventId: evt.id,
                        npcId: targetNPC ? targetNPC.id : null
                    });

                    gameState.completedEventsHistory.push({
                        eventId: evt.id,
                        age: currentAge,
                        npcId: targetNPC ? targetNPC.id : null
                    });

                    return; // Only 1 life event per age up for smooth pacing
                }
            }
        }
    }
};
