import { GameLogic } from './gameLogic.js';
import { MAJORS } from './constants.js';

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
                    title: "🥊 Fight Back",
                    description: "Stand your ground and throw a counter-punch",
                    icon: "fa-fist-raised",
                    color: "red"
                },
                {
                    id: "tell_teacher",
                    title: "🗣️ Tell the Teacher / Principal",
                    description: "Report the bullying to school staff",
                    icon: "fa-user-tie",
                    color: "blue"
                },
                {
                    id: "defuse",
                    title: "🕊️ Defuse with Wit & Humor",
                    description: "Try to disarm the tension with a witty comeback",
                    icon: "fa-laugh-beam",
                    color: "emerald"
                },
                {
                    id: "walk_away",
                    title: "🚶 Walk Away",
                    description: "Ignore the taunts and walk away",
                    icon: "fa-walking",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = user.smarts ?? user.stats?.smarts ?? 50;
            const userHealth = user.health ?? user.stats?.health ?? 100;
            const npcSmarts = targetNPC?.smarts || 40;
            const npcHealth = targetNPC?.health || 70;

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
        probability: 0.12,
        condition: (user) => {
            if (user.age < 4 || user.age > 17) return false;
            return (user.relationships || []).some(r => 
                (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && r.lifeStatus !== 'Deceased'
            );
        },
        getTargetNPC: (user) => {
            const parents = (user.relationships || []).filter(r => 
                (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && r.lifeStatus !== 'Deceased'
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
                        title: "✈️ Go Enthusiastically",
                        description: "Pack your bags with excitement",
                        icon: "fa-plane-departure",
                        color: "emerald"
                    },
                    {
                        id: "ask_money",
                        title: "🛍️ Ask for Souvenir Money",
                        description: "Ask for spending cash for the gift shop",
                        icon: "fa-hand-holding-usd",
                        color: "amber"
                    },
                    {
                        id: "complain",
                        title: "🛋️ Complain & Beg to Stay Home",
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
        condition: (user) => {
            if (user.age < 4 || user.age > 17) return false;
            return (user.relationships || []).some(r => 
                (r.type === 'Brother' || r.type === 'Sister' || r.category === 'sibling') && r.lifeStatus !== 'Deceased'
            );
        },
        getTargetNPC: (user) => {
            const siblings = (user.relationships || []).filter(r => 
                (r.type === 'Brother' || r.type === 'Sister' || r.category === 'sibling') && r.lifeStatus !== 'Deceased'
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
                    title: "🛡️ Take the Blame",
                    description: "Shield your sibling from punishment",
                    icon: "fa-shield-alt",
                    color: "emerald"
                },
                {
                    id: "cover_up",
                    title: "🧪 Superglue Cover-Up",
                    description: "Attempt an emergency repair before parents return",
                    icon: "fa-tools",
                    color: "blue"
                },
                {
                    id: "snitch_sibling",
                    title: "👆 Snitch Immediately",
                    description: "Point the finger at your sibling",
                    icon: "fa-bullhorn",
                    color: "red"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = user.smarts ?? user.stats?.smarts ?? 50;

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
                    title: "🤖 Build a Solar Robotics Project",
                    description: "Aim for 1st Place with an ambitious build",
                    icon: "fa-robot",
                    color: "emerald"
                },
                {
                    id: "baking_soda_volcano",
                    title: "🌋 Classic Baking Soda Volcano",
                    description: "Reliable, messy, and classic",
                    icon: "fa-mountain",
                    color: "blue"
                },
                {
                    id: "slacker_poster",
                    title: "📄 Slap Together a Poster Overnight",
                    description: "Minimal effort science project",
                    icon: "fa-file-alt",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = user.smarts ?? user.stats?.smarts ?? 50;

            if (choiceId === "complex_robotics") {
                if (userSmarts >= 55) {
                    GameLogic.adjustStat(user, 'smarts', 20);
                    GameLogic.adjustStat(user, 'happiness', 20);
                    return {
                        log: "Your automated solar rover took 1st Place at the Science Fair and won a gold ribbon!",
                        logType: "good"
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
        condition: (user) => {
            if (user.age < 15 || user.age > 17) return false;
            return (user.relationships || []).some(r => 
                (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && r.lifeStatus !== 'Deceased'
            );
        },
        getTargetNPC: (user) => {
            const parents = (user.relationships || []).filter(r => 
                (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && r.lifeStatus !== 'Deceased'
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
                    title: "🚗 Drive Carefully & Practice Parking",
                    description: "Focus on mirrors and smooth braking",
                    icon: "fa-car",
                    color: "emerald"
                },
                {
                    id: "speed_up",
                    title: "⚡ Step on the Gas",
                    description: "See how fast this car can accelerate!",
                    icon: "fa-tachometer-alt",
                    color: "amber"
                },
                {
                    id: "refuse_drive",
                    title: "🛑 Too Anxious to Drive",
                    description: "Ask to switch back to the passenger seat",
                    icon: "fa-ban",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = user.smarts ?? user.stats?.smarts ?? 50;

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
                    title: "🌙 Sneak Out Bedroom Window",
                    description: "Creep out and head to the bonfire party",
                    icon: "fa-moon",
                    color: "purple"
                },
                {
                    id: "stay_home",
                    title: "📖 Stay Home & Study",
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
                    title: "✨ Say Yes & Go Together",
                    description: "Rent an outfit and hit the dance floor",
                    icon: "fa-star",
                    color: "emerald"
                },
                {
                    id: "go_with_friends",
                    title: "💃 Go with a Group of Friends",
                    description: "Dance with your squad without romance drama",
                    icon: "fa-users",
                    color: "blue"
                },
                {
                    id: "skip_prom",
                    title: "🚫 Skip Prom Entirely",
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
        condition: (user) => {
            return (user.relationships || []).some(r => 
                (r.type === 'Son' || r.type === 'Daughter' || r.category === 'child') && 
                r.age === 18 && 
                r.lifeStatus !== 'Deceased'
            );
        },
        getTargetNPC: (user) => {
            return (user.relationships || []).find(r => 
                (r.type === 'Son' || r.type === 'Daughter' || r.category === 'child') && 
                r.age === 18 && 
                r.lifeStatus !== 'Deceased'
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
                        title: "🎓 Support Their Dream Major",
                        description: `Encourage them to pursue ${proposedMajor}`,
                        icon: "fa-thumbs-up",
                        color: "emerald"
                    },
                    {
                        id: "suggest_stem",
                        title: "💻 Suggest Computer Science & Tech",
                        description: "Steer them toward high-demand tech careers",
                        icon: "fa-laptop-code",
                        color: "blue"
                    },
                    {
                        id: "suggest_business",
                        title: "📈 Suggest Business & Finance",
                        description: "Steer them toward executive commerce & management",
                        icon: "fa-chart-line",
                        color: "blue"
                    },
                    {
                        id: "fund_tuition",
                        title: "💰 Gift $10,000 Tuition Assistance",
                        description: "Cover college expenses out of pocket",
                        icon: "fa-graduation-cap",
                        color: "amber",
                        disabled: userMoney < 10000
                    },
                    {
                        id: "dismiss_child",
                        title: "🤷 Tell Them They're an Adult Now",
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
        condition: (user) => (user.jobTitle || user.careerTrack) && user.age >= 22 && user.age <= 64,
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
                    title: "💥 Call Them Out in the Meeting",
                    description: "Present live version history and timestamps",
                    icon: "fa-bullhorn",
                    color: "red"
                },
                {
                    id: "private_boss_meeting",
                    title: "📁 Meet Privately with Your Boss",
                    description: "Share the commit logs and document timestamps calmly",
                    icon: "fa-user-tie",
                    color: "blue"
                },
                {
                    id: "demand_coworker_share",
                    title: "🤝 Confront Coworker in Private",
                    description: "Demand a follow-up correction email to the team",
                    icon: "fa-handshake",
                    color: "emerald"
                },
                {
                    id: "let_it_slide",
                    title: "🤐 Let It Slide",
                    description: "Keep quiet to avoid workplace tension",
                    icon: "fa-comment-slash",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userSmarts = user.smarts ?? user.stats?.smarts ?? 50;

            if (choiceId === "call_out_public") {
                if (userSmarts >= 50) {
                    GameLogic.adjustStat(user, 'smarts', 15);
                    GameLogic.adjustStat(user, 'happiness', 15);
                    return {
                        log: "You calmly displayed the timestamped creation logs on screen. The executive team applauded your transparency and your coworker turned beet red!",
                        logType: "good"
                    };
                } else {
                    GameLogic.adjustStat(user, 'happiness', -15);
                    return {
                        log: "You started an emotional argument during the presentation. Your manager asked you both to step outside.",
                        logType: "bad"
                    };
                }
            } else if (choiceId === "private_boss_meeting") {
                GameLogic.adjustStat(user, 'smarts', 10);
                GameLogic.adjustStat(user, 'happiness', 10);
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
        condition: (user) => {
            return (user.relationships || []).some(r => 
                (r.type === 'Wife' || r.type === 'Husband' || r.type === 'Partner' || r.category === 'spouse' || r.category === 'partner') && 
                r.lifeStatus !== 'Deceased'
            );
        },
        getTargetNPC: (user) => {
            const partners = (user.relationships || []).filter(r => 
                (r.type === 'Wife' || r.type === 'Husband' || r.type === 'Partner' || r.category === 'spouse' || r.category === 'partner') && 
                r.lifeStatus !== 'Deceased'
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
                        title: "🥂 Book the Luxury Resort ($1,500)",
                        description: "Pamper yourselves with fine dining & massages",
                        icon: "fa-glass-cheers",
                        color: "emerald",
                        disabled: userMoney < 1500
                    },
                    {
                        id: "budget_staycation",
                        title: "🕯️ Cook a Romantic Dinner at Home ($100)",
                        description: "Candlelight pasta and music at home",
                        icon: "fa-utensils",
                        color: "blue",
                        disabled: userMoney < 100
                    },
                    {
                        id: "decline_getaway",
                        title: "💼 Too Busy with Work / Errands",
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
                    title: "🏓 Play with Full Agility & Competitive Fire",
                    description: "Serve aces and dive for drop shots",
                    icon: "fa-trophy",
                    color: "emerald"
                },
                {
                    id: "coach_team",
                    title: "📋 Coach from the Sidelines",
                    description: "Guide your doubles partners strategically",
                    icon: "fa-clipboard-list",
                    color: "blue"
                },
                {
                    id: "enjoy_bingo",
                    title: "☕ Head to the Clubhouse for Bingo & Tea",
                    description: "Enjoy a relaxed afternoon with friends",
                    icon: "fa-mug-hot",
                    color: "slate"
                }
            ]
        }),
        resolve: (user, targetNPC, choiceId) => {
            const userHealth = user.health ?? user.stats?.health ?? 70;

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
        condition: (user) => {
            return user.age >= 60 && (user.relationships || []).some(r => 
                (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') && 
                r.lifeStatus !== 'Deceased'
            );
        },
        getTargetNPC: (user) => {
            const adultChildren = (user.relationships || []).filter(r => 
                (r.category === 'child' || r.type === 'Son' || r.type === 'Daughter') && 
                r.lifeStatus !== 'Deceased'
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
                        title: "🎁 Pass Down the Heirloom",
                        description: "Bestow the prized watch as a family heirloom",
                        icon: "fa-gift",
                        color: "emerald"
                    },
                    {
                        id: "keep_for_now",
                        title: "🕰️ Keep It in Your Collection",
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
        probability: 0.05,
        condition: (user) => {
            const health = user.health ?? user.stats?.health ?? 100;
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
    }
};

export const EventManager = {
    evaluateAgeUpEvents: (user, gameState) => {
        if (!gameState) return;
        if (!gameState.pendingEvents) gameState.pendingEvents = [];
        if (!gameState.completedEventsHistory) gameState.completedEventsHistory = [];

        const currentAge = user.age || 0;
        
        // Find eligible events
        const eligibleEvents = [];
        for (const key in LIFE_EVENTS) {
            const evt = LIFE_EVENTS[key];
            
            // Age check
            if (evt.minAge !== undefined && currentAge < evt.minAge) continue;
            if (evt.maxAge !== undefined && currentAge > evt.maxAge) continue;
            
            // Condition check
            if (evt.condition && !evt.condition(user, gameState)) continue;
            
            eligibleEvents.push(evt);
        }

        // Shuffle the eligible events
        const shuffled = eligibleEvents.sort(() => 0.5 - Math.random());
        
        for (const evt of shuffled) {
            const roll = Math.random();
            if (roll <= (evt.probability || 0.2)) {
                // Determine target NPC if applicable
                const targetNPC = evt.getTargetNPC ? evt.getTargetNPC(user, gameState) : null;
                
                // Add to pending events queue
                gameState.pendingEvents.push({
                    eventId: evt.id,
                    npcId: targetNPC ? targetNPC.id : null
                });
                
                // Track history
                gameState.completedEventsHistory.push({
                    eventId: evt.id,
                    age: currentAge
                });
                
                break; // Only 1 random event per age up for smooth pacing
            }
        }
    }
};
