import { Utils } from '../../ui/utils.js';
import { AvatarLogic } from '../avatarLogic.js';
import { clampStat, adjustStat, isAlive } from './playerStatsLogic.js';
import { getSkillXp } from './educationSkillsLogic.js';
import { checkMortality } from './healthMortalityLogic.js';
import { calculateInheritance, calculateSpousalLifeInsurance, breakUpWithPartner } from './relationshipsNpcLogic.js';
import { getRandomFirstName, getRandomLastName, progressNPCOccupation } from './npcGeneratorLogic.js';

export function calculatePrisonSecurity(crimeCategory, crimeId, sentenceYears) {
    if (crimeId === 'murder' || sentenceYears >= 15) {
        return { level: 'Supermax', facilityName: 'Ironwood State Supermax Penitentiary' };
    } else if (crimeCategory === 'violent' || crimeCategory === 'heist' || sentenceYears >= 6) {
        return { level: 'Maximum', facilityName: 'Oakridge Maximum Security Institution' };
    } else if (sentenceYears >= 3) {
        return { level: 'Medium', facilityName: 'Waynesburg Medium Correctional Facility' };
    } else {
        return { level: 'Minimum', facilityName: 'Green Valley Minimum Security Camp' };
    }
}

export function generateCellmate(securityLevel) {
    const isMale = Math.random() < 0.5;
    const firstName = getRandomFirstName(isMale ? 'male' : 'female');
    const lastName = getRandomLastName();
    const crimes = ['Armed Robbery', 'Grand Theft', 'Assault', 'Racketeering', 'Burglary', 'Tax Evasion', 'Extortion'];
    const personalities = ['chill', 'volatile', 'scholar', 'intimidating', 'trader'];
    const id = 'cellmate_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const gender = isMale ? 'male' : 'female';
    const age = Math.floor(Math.random() * 30) + 20;
    
    return {
        id,
        name: `${firstName} ${lastName}`,
        gender,
        age,
        crime: crimes[Math.floor(Math.random() * crimes.length)],
        personality: personalities[Math.floor(Math.random() * personalities.length)],
        status: Math.floor(Math.random() * 30) + 35,
        appearance: AvatarLogic.generateRandomAppearance(id, gender)
    };
}

export function generateYardInmates(securityLevel) {
    const roles = [
        { role: 'Yard Boss', crime: 'Racketeering', perk: 'Unlocks Yard Respect' },
        { role: 'Contraband Dealer', crime: 'Smuggling', perk: 'Sells Black Market Items' },
        { role: 'Gang Recruiter', crime: 'Extortion', perk: 'Offer Gang Affiliation' },
        { role: 'Prison Snitch', crime: 'Fraud', perk: 'Risk of reporting you' }
    ];

    return roles.map((r, idx) => {
        const isMale = Math.random() < 0.5;
        const firstName = getRandomFirstName(isMale ? 'male' : 'female');
        const lastName = getRandomLastName();
        const id = `yard_inmate_${idx}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const gender = isMale ? 'male' : 'female';
        const age = Math.floor(Math.random() * 30) + 20;

        return {
            id,
            name: `${firstName} ${lastName}`,
            gender,
            age,
            role: r.role,
            crime: r.crime,
            perk: r.perk,
            status: Math.floor(Math.random() * 30) + 30,
            appearance: AvatarLogic.generateRandomAppearance(id, gender)
        };
    });
}

export function initPrisonState(user, verdictResult) {
    const sentenceYears = verdictResult.sentenceYears || 1;
    const crime = verdictResult.crime || { category: 'petty', id: 'unknown' };
    const security = calculatePrisonSecurity(crime.category, crime.id, sentenceYears);

    user.inPrison = true;
    user.everInPrison = true;
    user.prisonSentenceRemaining = sentenceYears;
    user.prisonTotalSentence = sentenceYears;
    user.prisonSecurity = security.level;
    user.facilityName = security.facilityName;
    user.prisonStats = {
        respect: 25,
        guardRelation: 50,
        gang: 'None',
        canteenCash: Math.max(0, Math.min(250, Math.floor(Math.max(0, user.money || 0) * 0.1))),
        solitaryTurns: 0,
        goodBehaviorPoints: 10,
        prisonJob: 'None',
        lawStudied: 0,
        contraband: []
    };
    user.cellmate = generateCellmate(security.level);
    user.yardInmates = generateYardInmates(security.level);

    if (Array.isArray(user.relationships)) {
        user.relationships.forEach(rel => {
            if (rel.category === 'spouse' || rel.category === 'partner') {
                rel.status = Math.max(0, (rel.status || 50) - 20);
            } else if (rel.category === 'friend') {
                rel.status = Math.max(0, (rel.status || 50) - 25);
            } else {
                rel.status = Math.max(0, (rel.status || 50) - 15);
            }
        });
    }

    user.jobTitle = null;
    user.salary = 0;
    user.universityEnrolled = false;
    user.gradSchoolEnrolled = false;
    user.isStudent = false;
}

export function processPrisonAgeUp(user) {
    if (!user || !user.inPrison) return { released: false };

    const stats = user.prisonStats || { respect: 25, guardRelation: 50, gang: 'None', canteenCash: 50, solitaryTurns: 0, goodBehaviorPoints: 10, prisonJob: 'None', lawStudied: 0, contraband: [] };
    user.prisonStats = stats;

    const events = [];
    let newlyAssignedCellmate = null;

    // 1. Sentence Countdown (Served time counts towards sentence even in solitary)
    user.prisonSentenceRemaining = Math.max(0, (user.prisonSentenceRemaining || 1) - 1);

    // 2. Solitary Confinement Penalty
    if (stats.solitaryTurns > 0) {
        stats.solitaryTurns--;
        user.happiness = clampStat((user.happiness || 50) - 20);
        user.health = clampStat((user.health || 100) - 10);
        events.push("Spent another grueling year in solitary confinement.");
    } else {
        // 3. New Cellmate Assignment (if in General Population without a cellmate)
        if (!user.cellmate) {
            user.cellmate = generateCellmate(user.prisonSecurity || 'Medium');
            newlyAssignedCellmate = user.cellmate;
            events.push(`Assigned a new cellmate named ${user.cellmate.name}.`);
        }

        // 4. Good Behavior Accrual
        if (stats.guardRelation >= 40) {
            stats.goodBehaviorPoints = (stats.goodBehaviorPoints || 0) + 10;
        }

        // 5. Prison Job Income
        const jobEarnings = {
            'Kitchen Duty': 350,
            'Laundry Detail': 250,
            'Library Assistant': 450,
            'Yard Maintenance': 300
        };
        if (stats.prisonJob && jobEarnings[stats.prisonJob]) {
            const earned = jobEarnings[stats.prisonJob];
            stats.canteenCash = (stats.canteenCash || 0) + earned;
            events.push(`Earned ${Utils.formatMoney(earned)} in canteen funds working ${stats.prisonJob}.`);
        }

        // 6. Outside Relationship Aging, Decay & Abandonment Check
        if (Array.isArray(user.relationships)) {
            for (let i = user.relationships.length - 1; i >= 0; i--) {
                const rel = user.relationships[i];
                rel.age++; // People in social continue aging while player is in prison

                // Progress NPC Occupation and check for milestone events
                const milestoneMsg = progressNPCOccupation(rel, user.age);
                if (milestoneMsg) {
                    events.push(milestoneMsg);
                }

                // Mortality check for aging relationships outside
                const deathCheck = checkMortality(rel.age, rel.health ?? 100);
                if (deathCheck.isDead) {
                    rel.deathCause = deathCheck.cause;
                    let deathMsg = `Your ${rel.type} ${rel.name} passed away at age ${rel.age} from ${deathCheck.cause}.`;
                    
                    // Inheritance / spousal insurance award while incarcerated
                    if (rel.type === 'Mother' || rel.type === 'Father' || rel.category === 'family') {
                        const inheritance = calculateInheritance(rel.age);
                        if (inheritance > 0) {
                            user.money = (user.money || 0) + inheritance;
                            deathMsg += ` You inherited ${Utils.formatMoney(inheritance)} held in outside estate accounts.`;
                        }
                    } else if (rel.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(rel.type)) {
                        const lifeInsurance = calculateSpousalLifeInsurance();
                        if (lifeInsurance > 0) {
                            user.money = (user.money || 0) + lifeInsurance;
                            deathMsg += ` Spousal life insurance policy paid out ${Utils.formatMoney(lifeInsurance)}.`;
                        }
                    }

                    events.push(deathMsg);
                    user.relationships.splice(i, 1);
                    continue;
                }

                // Differentiated relationship decay
                if (rel.category === 'spouse' || rel.category === 'partner') {
                    rel.status = Math.max(0, (rel.status || 50) - 12);
                } else if (rel.category === 'friend') {
                    rel.status = Math.max(0, (rel.status || 50) - 20);
                    if (rel.status < 15) {
                        events.push(`Your friend ${rel.name} stopped taking your prison calls and abandoned contact.`);
                        user.relationships.splice(i, 1);
                        continue;
                    }
                } else {
                    rel.status = Math.max(0, (rel.status || 50) - 8);
                }
            }

            const spouse = user.relationships.find(r => r.category === 'spouse' || r.category === 'partner');
            if (spouse && spouse.status < 30 && Math.random() < 0.25) {
                breakUpWithPartner(user, spouse);
                events.push(`Your partner ${spouse.name} filed for divorce/breakup while you were incarcerated.`);
            }
        }

        // 7. Random Prison Events
        const roll = Math.random();
        if (roll < 0.20 && stats.contraband && stats.contraband.length > 0) {
            // Guard Shakedown
            if (stats.snitchFramed) {
                stats.snitchFramed = false;
                events.push("Guards raided the cellblock during a shakedown, but found contraband planted on the Prison Snitch! Your cell stash was untouched.");
            } else {
                const hadPhoneOrShank = stats.contraband.includes('Contraband Cellphone') || stats.contraband.includes('Handmade Shank');
                stats.contraband = [];
                stats.solitaryTurns = 1;
                stats.guardRelation = Math.max(0, stats.guardRelation - 25);
                stats.goodBehaviorPoints = 0;

                if (hadPhoneOrShank) {
                    user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 1;
                    user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 1;
                    events.push("Guards raided your cell during a shakedown! Found illegal contraband (Phone/Shank): +1 year sentence added, 1 year in solitary confinement, and all contraband confiscated!");
                } else {
                    events.push("Guards raided your cell during a shakedown! Confiscated all contraband and put you in solitary confinement for 1 year.");
                }
            }
        } else if (roll > 0.85) {
            stats.respect = Math.min(100, stats.respect + 10);
            events.push("Gained respect among inmates after standing your ground during a yard standoff.");
        }
    }

    // 8. Release Check
    if (user.prisonSentenceRemaining <= 0) {
        user.inPrison = false;
        user.money = (user.money || 0) + 250; // Gate money
        user.prisonSentenceRemaining = 0;
        return {
            released: true,
            events,
            newCellmate: null,
            message: "You served your full prison sentence and were released back into society with $250 in gate money!"
        };
    }

    return {
        released: false,
        events,
        newCellmate: newlyAssignedCellmate,
        message: `Served 1 year of your sentence. ${user.prisonSentenceRemaining} years remaining.`
    };
}

export function interactCellmate(user, actionType) {
    if (!user || !user.cellmate) return { success: false, msg: "No cellmate assigned." };
    if (!isAlive(user)) return { success: false, msg: "Cannot interact while dead or at 0 HP." };
    const cm = user.cellmate;
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot interact with cellmates while locked in solitary confinement." };
    }

    if (actionType === 'talk' || actionType === 'chat') {
        cm.status = Math.min(100, (cm.status || 50) + 8);
        user.happiness = clampStat((user.happiness || 50) + 3);
        return { success: true, msg: `Chatted with ${cm.name}. They shared stories about why they are locked up for ${cm.crime}.` };
    }

    if (actionType === 'share_snack') {
        if (!stats.canteenCash || stats.canteenCash < 10) {
            return { success: false, msg: "You need at least $10 in canteen cash to buy a snack to share!" };
        }
        stats.canteenCash -= 10;
        cm.status = Math.min(100, (cm.status || 50) + 20);
        return { success: true, msg: `Gave ${cm.name} a ramen packet and chocolate bar. Relationship boosted!` };
    }

    if (actionType === 'fight') {
        return attackPrisonInmate(user, 'cellmate', 'cellmate', 'fists');
    }

    return { success: false, msg: "Invalid action." };
}

export function attackPrisonInmate(user, targetType, targetId, weaponType = 'fists') {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot fight while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot attack inmates while locked in solitary confinement." };
    }

    let target = null;
    if (targetType === 'cellmate') {
        target = user.cellmate;
    } else {
        target = (user.yardInmates || []).find(i => String(i.id) === String(targetId));
    }

    if (!target) return { success: false, msg: "Target inmate not found." };

    const hasShank = stats.contraband && stats.contraband.includes('Handmade Shank');
    const usingShank = weaponType === 'shank' && hasShank;

    if (weaponType === 'shank' && !hasShank) {
        return { success: false, msg: "You do not own a Handmade Shank in your cell mattress stash!" };
    }

    const martialArtsPower = Math.round((getSkillXp(user, 'martial_arts') / 100) * 50);
    const userPower = clampStat(user.health, 50) + clampStat(user.smarts, 50) + (usingShank ? 40 : 0) + martialArtsPower;
    const inmateDefense = Math.floor(Math.random() * 50) + 40;
    const win = Math.random() < (userPower / (userPower + inmateDefense));

    if (win) {
        const killChance = usingShank ? 0.35 : 0.15;
        const killed = Math.random() < killChance;

        if (killed) {
            if (usingShank) {
                const shankIdx = stats.contraband.indexOf('Handmade Shank');
                if (shankIdx !== -1) stats.contraband.splice(shankIdx, 1);
            }

            if (targetType === 'cellmate') {
                user.cellmate = null;
            } else {
                user.yardInmates = (user.yardInmates || []).filter(i => String(i.id) !== String(targetId));
            }

            user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 15;
            user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 15;
            stats.solitaryTurns = 2;
            stats.respect = Math.min(100, (stats.respect || 25) + 50);
            stats.guardRelation = 0;
            stats.goodBehaviorPoints = 0;

            return {
                success: true,
                killed: true,
                solitary: true,
                targetName: target.name,
                msg: `FATAL ATTACK! You inflicted a lethal strike on ${target.name}! Inmate died of injuries. +50 Respect earned (Inmates fear you), but court added +15 YEARS to your sentence and locked you in 2 years of Solitary Confinement!`
            };
        } else {
            target.status = 0;
            stats.respect = Math.min(100, (stats.respect || 25) + 25);

            const guardCaught = Math.random() < 0.45; // 45% chance guards witness the attack

            if (guardCaught) {
                stats.solitaryTurns = Math.max(stats.solitaryTurns || 0, 1);
                stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 25);
                stats.goodBehaviorPoints = 0;

                return {
                    success: true,
                    killed: false,
                    solitary: true,
                    targetName: target.name,
                    msg: `BRAWL CAUGHT! You beat up ${target.name}, but correctional officers rushed in and caught you in the act! You were thrown into Solitary Confinement for 1 year (-25 Guard Relation, +25 Respect).`
                };
            } else {
                stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 10);

                return {
                    success: true,
                    killed: false,
                    solitary: false,
                    targetName: target.name,
                    msg: `VIOLENT BRAWL! You brutally beat up ${target.name} out of sight of guards! Gained +25 Respect.`
                };
            }
        }
    } else {
        const healthLoss = Math.max(15, Math.round(35 * (1 - (getSkillXp(user, 'martial_arts') / 100) * 0.5)));
        adjustStat(user, 'health', -healthLoss);
        adjustStat(user, 'happiness', -20);

        const guardCaught = Math.random() < 0.35; // 35% chance guards break up lost fight

        if (guardCaught) {
            stats.solitaryTurns = Math.max(stats.solitaryTurns || 0, 1);
            stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 15);

            return {
                success: false,
                killed: false,
                solitary: true,
                targetName: target.name,
                msg: `BRAWL BROKEN UP! ${target.name} overpowered you in the fight before guards intervened and threw you into Solitary Confinement for 1 year! Lost ${healthLoss} Health.`
            };
        } else {
            return {
                success: false,
                killed: false,
                solitary: false,
                targetName: target.name,
                msg: `${target.name} retaliated fiercely and overpowered you in the brawl! Lost ${healthLoss} Health and 20 Happiness.`
            };
        }
    }
}

export function workoutPrisonYard(user, workoutType) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot work out while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot go to the prison yard while locked in solitary confinement." };
    }

    if (workoutType === 'bench_press') {
        stats.respect = Math.min(100, (stats.respect || 25) + 5);
        adjustStat(user, 'health', 4);
        return { success: true, msg: "Pumped iron at the yard bench press. Built muscle and gained +5 Respect!" };
    }

    if (workoutType === 'cardio') {
        adjustStat(user, 'health', 6);
        adjustStat(user, 'looks', 2);
        return { success: true, msg: "Ran laps around the yard track. Improved Health and Stamina!" };
    }

    return { success: false, msg: "Invalid workout." };
}

export function interactYardInmate(user, inmateId, actionType) {
    if (!user || !user.yardInmates) return { success: false, msg: "No inmates available." };
    if (!isAlive(user)) return { success: false, msg: "Cannot interact while dead or at 0 HP." };
    const inmate = user.yardInmates.find(i => String(i.id) === String(inmateId));
    if (!inmate) {
        // Defensive fallback: check if reference was actually for the cellmate
        if (user.cellmate && (inmateId === 'cellmate' || String(user.cellmate.id) === String(inmateId))) {
            return interactCellmate(user, actionType === 'chat' ? 'talk' : actionType);
        }
        return { success: false, msg: "Inmate not found." };
    }
    const stats = user.prisonStats;
    if (stats && stats.solitaryTurns > 0) {
        return { success: false, msg: "You cannot interact with yard inmates while locked in solitary confinement." };
    }

    if (actionType === 'chat') {
        inmate.status = Math.min(100, (inmate.status || 40) + 10);
        return { success: true, msg: `Talked with ${inmate.name} (${inmate.role}). Built rapport!` };
    }

    if (actionType === 'protection') {
        if ((stats.canteenCash || 0) < 50) {
            return { success: false, msg: "You need at least $50 in canteen cash to pay for yard protection." };
        }
        stats.canteenCash -= 50;
        stats.respect = Math.min(100, (stats.respect || 25) + 15);
        return { success: true, msg: `Paid ${inmate.name} $50 protection money. The ${inmate.role} has your back.` };
    }

    if (actionType === 'challenge_boss') {
        const martialArtsPower = Math.round((getSkillXp(user, 'martial_arts') / 100) * 50);
        const userPower = clampStat(user.health, 50) + clampStat(user.smarts, 50) + martialArtsPower;
        if (Math.random() < (userPower / 180)) {
            stats.respect = Math.min(100, (stats.respect || 25) + 40);
            stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 15);
            return { success: true, msg: `You challenged ${inmate.name} for Yard Supremacy and WON the brawl! Gained +40 Respect!` };
        } else {
            const healthLoss = Math.max(15, Math.round(30 * (1 - (getSkillXp(user, 'martial_arts') / 100) * 0.5)));
            adjustStat(user, 'health', -healthLoss);
            adjustStat(user, 'happiness', -20);
            return { success: false, msg: `${inmate.name} defeated you in the yard brawl! Lost ${healthLoss} Health and 20 Happiness.` };
        }
    }

    if (actionType === 'gang_mission') {
        if (stats.gang === 'None') {
            return { success: false, msg: "You must join a prison gang before accepting gang missions!" };
        }
        stats.respect = Math.min(100, (stats.respect || 25) + 15);
        stats.canteenCash = (stats.canteenCash || 0) + 50;
        return { success: true, msg: `Completed a gang favor for ${inmate.name}! Earned +15 Respect and $50 in canteen cash.` };
    }

    if (actionType === 'bribe_snitch') {
        if ((stats.canteenCash || 0) < 25) {
            return { success: false, msg: "You need $25 in canteen cash to bribe the snitch." };
        }
        stats.canteenCash -= 25;
        stats.snitchPacified = true;
        stats.guardRelation = Math.min(100, (stats.guardRelation || 50) + 10);
        return { success: true, msg: `Paid ${inmate.name} $25 to keep quiet. They promised not to snitch on your cell block!` };
    }

    if (actionType === 'confront_snitch') {
        stats.respect = Math.min(100, (stats.respect || 25) + 10);
        inmate.status = Math.max(0, (inmate.status || 40) - 20);
        return { success: true, msg: `Cornered and intimidated ${inmate.name} in the yard. Showed the block you won't tolerate snitches (+10 Respect)!` };
    }

    if (actionType === 'frame_snitch') {
        if (!stats.contraband || stats.contraband.length === 0) {
            return { success: false, msg: "You need contraband in your cell stash to plant on the snitch!" };
        }
        const planted = stats.contraband.pop();
        stats.snitchFramed = true;
        stats.respect = Math.min(100, (stats.respect || 25) + 20);
        return { success: true, msg: `Planted ${planted} in the snitch's bunk! The block cheered your cunning (+20 Respect).` };
    }

    if (actionType === 'join_gang') {
        if (stats.gang !== 'None') {
            return { success: false, msg: `You are already affiliated with the ${stats.gang}!` };
        }
        stats.gang = inmate.role === 'Yard Boss' ? 'Street Syndicate' : 'Brotherhood';
        stats.respect = Math.min(100, (stats.respect || 25) + 30);
        stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 20);
        return { success: true, msg: `Joined the ${stats.gang}! Gained +30 Respect, but guards will target you (-20 Guard Relation).` };
    }

    return { success: false, msg: "Invalid inmate action." };
}

export function useContrabandPhone(user, phoneAction, targetId = null) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot use phone while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!stats || !stats.contraband || !stats.contraband.includes('Contraband Cellphone')) {
        return { success: false, msg: "You do not possess a Contraband Cellphone in your cell stash." };
    }

    // 25% chance guards catch user using phone
    const caught = Math.random() < 0.25;

    if (caught) {
        const phoneIdx = stats.contraband.indexOf('Contraband Cellphone');
        if (phoneIdx !== -1) stats.contraband.splice(phoneIdx, 1);
        stats.solitaryTurns = 1;
        stats.guardRelation = Math.max(0, (stats.guardRelation || 50) - 30);
        stats.goodBehaviorPoints = 0;
        user.prisonSentenceRemaining = (user.prisonSentenceRemaining || 1) + 1;
        user.prisonTotalSentence = (user.prisonTotalSentence || 1) + 1;
        return {
            success: false,
            caught: true,
            msg: "GUARD CAUGHT YOU ON THE PHONE! Officer confiscated your Contraband Cellphone, added +1 year to your sentence, and sent you to Solitary Confinement!"
        };
    }

    if (phoneAction === 'contact') {
        const rel = (user.relationships || []).find(r => String(r.id) === String(targetId));
        if (!rel) return { success: false, msg: "Contact not found." };

        rel.status = Math.min(100, (rel.status || 50) + 20);
        adjustStat(user, 'happiness', 10);
        return {
            success: true,
            msg: `Secretly texted and called ${rel.name} on your contraband phone! Reconnected outside (+20 status, +10 Happiness)!`
        };
    }

    if (phoneAction === 'legal') {
        stats.lawStudied = (stats.lawStudied || 0) + 35;
        adjustStat(user, 'smarts', 3);
        return {
            success: true,
            msg: "Called your private legal team hotline. Consulted appellate attorneys directly from your cell (+35 Law Study Points, +3 Smarts)!"
        };
    }

    return { success: false, msg: "Invalid phone action." };
}

export function doPrisonJob(user, jobId) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot work while dead or at 0 HP." };
    if (user.prisonStats.solitaryTurns > 0) {
        return { success: false, msg: "Your prison job assignment is suspended while locked in solitary confinement." };
    }
    const validJobs = ['Kitchen Duty', 'Laundry Detail', 'Library Assistant', 'Yard Maintenance'];
    if (!validJobs.includes(jobId)) return { success: false, msg: "Invalid job title." };

    user.prisonStats.prisonJob = jobId;
    return { success: true, msg: `Assigned to ${jobId}. You will earn canteen cash each year.` };
}

export function doSolitaryActivity(user, actType) {
    if (!user || !user.inPrison) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot perform activities while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!stats || stats.solitaryTurns <= 0) return { success: false, msg: "Not in solitary confinement." };

    if (actType === 'pushups') {
        adjustStat(user, 'health', 2);
        stats.respect = Math.min(100, (stats.respect || 25) + 1);
        return { success: true, msg: "Did 100 cell push-ups in solitary confinement (+2 Health, +1 Respect)." };
    }

    if (actType === 'meditate') {
        adjustStat(user, 'smarts', 3);
        adjustStat(user, 'health', 1);
        return { success: true, msg: "Meditated on your life choices in solitary isolation (+3 Smarts, +1 Health)." };
    }

    return { success: false, msg: "Invalid solitary activity." };
}

export function buyCanteenItem(user, itemId) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot buy items while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!Array.isArray(stats.contraband)) stats.contraband = [];

    const catalog = {
        ramen: { name: 'Ramen Packet', price: 5, type: 'snack' },
        chocolate: { name: 'Chocolate Bar', price: 8, type: 'snack' },
        paper_pen: { name: 'Writing Paper & Pen', price: 12, type: 'utility' },
        cigarettes: { name: 'Pack of Cigarettes', price: 30, type: 'contraband' },
        shank: { name: 'Handmade Shank', price: 80, type: 'contraband' },
        cellphone: { name: 'Contraband Cellphone', price: 180, type: 'contraband' }
    };

    const item = catalog[itemId];
    if (!item) return { success: false, msg: "Invalid canteen item." };

    if ((stats.canteenCash || 0) < item.price) {
        return { success: false, msg: `Insufficient canteen cash. ${item.name} costs $${item.price}.` };
    }

    stats.canteenCash -= item.price;

    if (item.type === 'snack') {
        adjustStat(user, 'happiness', 5);
        return { success: true, msg: `Enjoyed a ${item.name}. Gained +5 Happiness!` };
    } else {
        stats.contraband.push(item.name);
        return { success: true, msg: `Purchased ${item.name} from the canteen dealer!` };
    }
}

export function sellContrabandItem(user, itemIndexOrName) {
    if (!user || !user.prisonStats) return { success: false, msg: "Not in prison." };
    if (!isAlive(user)) return { success: false, msg: "Cannot sell contraband while dead or at 0 HP." };
    const stats = user.prisonStats;
    if (!Array.isArray(stats.contraband)) stats.contraband = [];
    if (stats.contraband.length === 0) {
        return { success: false, msg: "You have no contraband items to sell." };
    }

    const sellValues = {
        'Writing Paper & Pen': 8,
        'Pack of Cigarettes': 20,
        'Handmade Shank': 50,
        'Contraband Cellphone': 120
    };

    let itemIndex = -1;
    if (typeof itemIndexOrName === 'number') {
        itemIndex = itemIndexOrName;
    } else {
        itemIndex = stats.contraband.findIndex(c => c === itemIndexOrName);
    }

    if (itemIndex < 0 || itemIndex >= stats.contraband.length) {
        return { success: false, msg: "Item not found in cell stash." };
    }

    const itemName = stats.contraband[itemIndex];
    const sellPrice = sellValues[itemName] || 15;

    stats.contraband.splice(itemIndex, 1);
    stats.canteenCash = (stats.canteenCash || 0) + sellPrice;

    return {
        success: true,
        itemName,
        sellPrice,
        msg: `Sold ${itemName} to the Contraband Dealer for $${sellPrice} in canteen cash!`
    };
}
