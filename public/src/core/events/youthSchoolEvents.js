import { GameLogic } from '../gameLogic.js';
import { getSkillXpSafe, getUserStat, isLivingNPC, ensureEventFlags } from './eventHelpers.js';

export const YOUTH_SCHOOL_EVENTS = {
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
    }
};
