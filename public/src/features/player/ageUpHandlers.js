import { GameLogic } from '../../core/gameLogic.js';
import { state, addLog } from '../../core/state.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { CAREER_TRACKS, SPECIAL_CAREER_TRACKS, PRO_SPORTS_LEAGUES, GRAD_SCHOOLS } from '../../core/constants.js';
import { AvatarLogic } from '../../core/avatarLogic.js';
import { loadModule } from '../../core/moduleLoader.js';
import { SoundManager } from '../../core/soundManager.js';

export function handleHealth(user) {
    if (typeof user.health !== 'number') user.health = 100;
    
    // Call the pure function
    const decay = GameLogic.calculateHealthDecay(user.age);
    const benefits = GameLogic.calculateHealthBenefits(user.gymMembership, user.hasBetterDiet);

    // Mutate state with a hard floor of 0 and cap of 100
    user.health = Math.max(0, Math.min(100, user.health - decay + benefits));

    // Execute UI side-effects
    if (user.health < 30 && (user.health + decay - benefits) >= 30) {
        addLog("Your health has reached a critical low. Your risk of death is severely elevated.", "major");
    }
}

export function handleSmarts(user) {
    if (typeof user.smarts !== 'number') user.smarts = 50;
    const delta = GameLogic.calculateSmartsDelta(user.age, user.isStudent);
    if (delta !== 0) {
        user.smarts = Math.max(0, Math.min(100, user.smarts + delta));
    }
}

export function handleLooks(user) {
    if (typeof user.looks !== 'number') user.looks = 50;
    const delta = GameLogic.calculateLooksDelta(user.age);
    if (delta !== 0) {
        user.looks = Math.max(0, Math.min(100, user.looks + delta));
    }
}

// sub systems that ageup calls
export async function handleFinances(user) {
    // 1. Birthday Money (Kids only)
    if (user.age >= 5 && user.age <= 18) {
        const bdayMoney = GameLogic.calculateBirthdayMoney();
        user.money += bdayMoney;
        addLog(`You received ${Utils.formatMoney(bdayMoney)} for your birthday!`, 'good');
    }

    // 2. Job Salary + annual adjustments
    if (user.jobTitle) {
        user.yearsInCareer = (user.yearsInCareer || 0) + 1;
        
        if (user.careerTrack === 'mafia_syndicate') {
            const crimes = user.mafiaCrimesThisYear || 0;
            if (crimes < 3) {
                addLog(`You failed to meet your Syndicate quota (${crimes}/3). The boss had you beaten. No pay this year.`, 'bad');
                GameLogic.adjustStat(user, 'health', -25);
                GameLogic.adjustStat(user, 'happiness', -20);
                user.yearsInRole = (user.yearsInRole || 0); // No progress
            } else {
                user.money += user.jobSalary;
                addLog(`You met your Syndicate quota and received your cut of ${Utils.formatMoney(user.jobSalary)}.`, 'good');
                user.yearsInRole = (user.yearsInRole || 0) + 1;
                
                // Mafia Promotions
                const track = SPECIAL_CAREER_TRACKS.find(t => t.key === 'mafia_syndicate');
                const lvlIdx = user.careerLevel || 0;
                const level = track?.levels[lvlIdx];
                const nextLevel = track?.levels[lvlIdx + 1];

                if (nextLevel && level.minYears !== null && user.yearsInRole >= level.minYears) {
                    if (Math.random() < 0.6) { // 60% chance to promote when eligible
                        user.careerLevel++;
                        const nextSalary = GameLogic.calculateScaledSalary(nextLevel.salary, user.city);
                        user.jobTitle = nextLevel.title;
                        user.jobSalary = nextSalary;
                        user.yearsInRole = 0;
                        GameLogic.adjustStat(user, 'happiness', 25);
                        addLog(`You've been promoted to ${nextLevel.title} in the Syndicate! Cut: ${Utils.formatMoney(user.jobSalary)}/yr. (+25 Happiness)`, 'major');
                        SoundManager.play('milestone');
                    }
                }
            }
            user.mafiaCrimesThisYear = 0;
            user.careerActionTaken = false;
        } else if (user.careerTrack === 'pro_athlete') {
            const league = PRO_SPORTS_LEAGUES[user.athleteSport] || PRO_SPORTS_LEAGUES.football;
            const lvlIdx = user.careerLevel || 0;
            const level = league.levels[lvlIdx] || league.levels[0];
            const nextLevel = league.levels[lvlIdx + 1];

            // Mandatory Age 42+ Retirement
            if ((user.age || 0) >= 42) {
                addLog(`At age ${user.age}, you have hung up your cleats and officially retired from professional sports. What an incredible athletic career!`, 'major');
                user.careerTrack = null;
                user.careerLevel = 0;
                user.jobTitle = null;
                user.jobSalary = 0;
                user.athleteContract = null;
                if ((user.yearsInCareer || 0) >= 8) {
                    user.isRetired = true;
                    user.retirementPension = Math.round(level.salary * 0.15);
                    addLog(`Your ${user.yearsInCareer} years of league service qualified you for an annual pension of ${Utils.formatMoney(user.retirementPension)}/yr.`, 'good');
                }
            } else {
                user.athleteContract = user.athleteContract || {
                    contractType: 'Rookie Deal',
                    totalYears: 2,
                    yearsRemaining: 1,
                    annualSalary: user.jobSalary,
                    totalValue: user.jobSalary * 2
                };

                // Decrement contract years remaining
                user.athleteContract.yearsRemaining = Math.max(0, (user.athleteContract.yearsRemaining || 1) - 1);

                const quota = user.athleteGamesThisYear || 0;
                if (quota < 3) {
                    // Missed season actions
                    user.athletePoorSeasons = (user.athletePoorSeasons || 0) + 1;
                    const fineSalary = Math.round(user.jobSalary * 0.5);
                    user.money += fineSalary;
                    user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + fineSalary;
                    GameLogic.adjustStat(user, 'happiness', -12);
                    addLog(`You failed your team workout & season quota (${quota}/3). Fined 50% of your annual salary, receiving ${Utils.formatMoney(fineSalary)}. (-12 Happiness)`, 'bad');

                    if (user.athletePoorSeasons >= 2) {
                        addLog(`Due to repeated failure to report in playing shape, the ${league.leagueName} franchise has waived your contract. You are now a Free Agent.`, 'bad');
                        user.careerTrack = null;
                        user.jobTitle = null;
                        user.jobSalary = 0;
                        user.athleteContract = null;
                        user.athletePoorSeasons = 0;
                    }
                } else {
                    // Quota met: full salary installment
                    user.athletePoorSeasons = 0;
                    user.money += user.jobSalary;
                    user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + user.jobSalary;
                    user.yearsInRole = (user.yearsInRole || 0) + 1;
                    addLog(`You completed the season with the ${league.leagueName} and received your contract salary of ${Utils.formatMoney(user.jobSalary)}.`, 'good');

                    // Championship Ring Roll (scales with prospectScore & careerLevel)
                    const evalResult = GameLogic.evaluateAthleteProspect(user, user.athleteSport);
                    const ringChance = Math.min(0.35, 0.08 + (evalResult.prospectScore / 100) * 0.15 + lvlIdx * 0.03);
                    if (Math.random() < ringChance) {
                        user.athleteRings = (user.athleteRings || 0) + 1;
                        const ringBonus = GameLogic.calculateScaledSalary(100000 + lvlIdx * 150000, user.city);
                        user.money += ringBonus;
                        user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + ringBonus;
                        GameLogic.adjustStat(user, 'happiness', 25);
                        addLog(`CHAMPIONS! You and your squad won the ${league.championshipName}! Won a championship ring and a ${Utils.formatMoney(ringBonus)} bonus! (+25 Happiness)`, 'major');
                        SoundManager.play('milestone');
                    }

                    // MVP Award Roll (available at Level 2+)
                    if (lvlIdx >= 2) {
                        const mvpChance = Math.min(0.25, 0.04 + (evalResult.prospectScore / 100) * 0.12);
                        if (Math.random() < mvpChance) {
                            user.athleteMvps = (user.athleteMvps || 0) + 1;
                            GameLogic.adjustStat(user, 'happiness', 20);
                            addLog(`🏆 LEAGUE MVP! You were officially named Most Valuable Player of the ${league.leagueName}! (+20 Happiness)`, 'major');
                            SoundManager.play('milestone');
                        }
                    }

                    // Natural athletic physical decay if age >= 33
                    if (user.age >= 33) {
                        const healthDecay = Math.floor(Math.random() * 3) + 2;
                        GameLogic.adjustStat(user, 'health', -healthDecay);
                    }
                }

                // Contract Expiration & Multi-Year Extension Negotiation
                if (user.careerTrack === 'pro_athlete' && user.athleteContract.yearsRemaining <= 0) {
                    if ((user.health || 0) < 45 || user.athletePoorSeasons > 0) {
                        addLog(`Your contract expired and the team decided not to re-sign you due to health and conditioning concerns. You are now a Free Agent.`, 'bad');
                        user.careerTrack = null;
                        user.jobTitle = null;
                        user.jobSalary = 0;
                        user.athleteContract = null;
                    } else {
                        // Extension negotiation
                        let targetLvl = lvlIdx;
                        if (nextLevel && user.yearsInRole >= (level.minYears || 1)) {
                            const evalResult = GameLogic.evaluateAthleteProspect(user, user.athleteSport);
                            const promoChance = Math.min(0.85, 0.40 + (evalResult.prospectScore / 100) * 0.35);
                            if (Math.random() < promoChance) {
                                targetLvl = lvlIdx + 1;
                            }
                        }

                        user.careerLevel = targetLvl;
                        const newContract = GameLogic.generateAthleteContract(user.athleteSport, targetLvl, 70, false);
                        const scaledNewSalary = GameLogic.calculateScaledSalary(newContract.annualSalary, user.city);
                        user.jobSalary = scaledNewSalary;
                        user.jobTitle = league.levels[targetLvl].title;
                        user.athleteContract = newContract;
                        user.yearsInRole = 0;

                        if (newContract.signingBonus > 0) {
                            const scaledBonus = GameLogic.calculateScaledSalary(newContract.signingBonus, user.city);
                            user.money += scaledBonus;
                            user.athleteCareerEarnings = (user.athleteCareerEarnings || 0) + scaledBonus;
                            addLog(`CONTRACT EXTENSION! Signed a new ${newContract.totalYears}-Year, ${Utils.formatMoney(newContract.totalValue)} ${newContract.contractType} as ${user.jobTitle}! Salary: ${Utils.formatMoney(scaledNewSalary)}/yr with a ${Utils.formatMoney(scaledBonus)} extension bonus!`, 'major');
                        } else {
                            addLog(`CONTRACT EXTENSION! Signed a new ${newContract.totalYears}-Year, ${Utils.formatMoney(newContract.totalValue)} ${newContract.contractType} as ${user.jobTitle}! New salary: ${Utils.formatMoney(scaledNewSalary)}/yr.`, 'major');
                        }
                        GameLogic.adjustStat(user, 'happiness', 20);
                        SoundManager.play('milestone');
                    }
                }
            }

            user.athleteGamesThisYear = 0;
            user.athleteEndorsementThisYear = false;
            user.careerActionTaken = false;
        } else {
            user.money += user.jobSalary;
            if (user.hasSeenJobSalary) {
                addLog(`Earned ${Utils.formatMoney(user.jobSalary)} as a ${user.jobTitle}.`, 'good');
            }

            // Annual cost-of-living raise (~2%, silent)
            user.jobSalary += Math.max(500, Math.floor(user.jobSalary * 0.02));

            if (user.careerTrack) {
                // ── Career-track: promotion / demotion system ──────────────────
                user.yearsInRole = (user.yearsInRole || 0) + 1;
                const track = CAREER_TRACKS.find(t => t.key === user.careerTrack);
                const lvlIdx   = user.careerLevel || 0;
                const level    = track?.levels[lvlIdx];
                const nextLevel = track?.levels[lvlIdx + 1];

                if (track && level) {
                    if (user.jobPerformance <= 20) {
                        // Poor performance
                        user.consecutivePoorYears = (user.consecutivePoorYears || 0) + 1;
                        if (user.consecutivePoorYears >= 2) {
                            if (lvlIdx > 0) {
                                user.careerLevel--;
                                const demoted = track.levels[user.careerLevel];
                                const demotedSalary = GameLogic.calculateScaledSalary(demoted.salary, user.city);
                                user.jobTitle  = demoted.title;
                                user.jobSalary = demotedSalary;
                                user.consecutivePoorYears = 0;
                                user.yearsInRole = 0;
                                GameLogic.adjustStat(user, 'happiness', -15);
                                addLog(`Demoted to ${demoted.title} due to sustained poor performance. New salary: ${Utils.formatMoney(user.jobSalary)}/yr. (-15 Happiness)`, 'bad');
                            } else {
                                GameLogic.adjustStat(user, 'happiness', -25);
                                addLog(`Terminated from ${user.jobTitle} due to sustained poor performance. (-25 Happiness)`, 'bad');
                                user.jobTitle = null; user.jobSalary = 0; user.jobPerformance = 50;
                                user.careerTrack = null; user.careerLevel = 0; user.yearsInRole = 0; user.yearsInCareer = 0;
                                user.consecutivePoorYears = 0; user.careerActionTaken = false; user.hasSeenJobSalary = false;
                            }
                        } else {
                            GameLogic.adjustStat(user, 'happiness', -5);
                            addLog('Your employer issued a formal warning about your performance. (-5 Happiness)', 'bad');
                        }
                    } else {
                        user.consecutivePoorYears = 0;
                        let promoted = false;

                        const skillBonuses = GameLogic.getCareerSkillBonuses
                            ? GameLogic.getCareerSkillBonuses(user, user.careerTrack)
                            : { promoBonus: 0, raiseRate: 0.05 };

                        // Promotion check
                        if (nextLevel && level.minYears !== null && user.yearsInRole >= level.minYears && user.jobPerformance >= 75) {
                            const basePromoChance = user.jobPerformance >= 95 ? 0.80 : user.jobPerformance >= 85 ? 0.50 : 0.25;
                            const promoChance = Math.min(0.95, basePromoChance + (skillBonuses.promoBonus || 0));
                            if (Math.random() < promoChance) {
                                user.careerLevel++;
                                const nextSalary = GameLogic.calculateScaledSalary(nextLevel.salary, user.city);
                                user.jobTitle  = nextLevel.title;
                                user.jobSalary = Math.max(user.jobSalary, nextSalary);
                                user.yearsInRole = 0;
                                user.jobPerformance = 60;
                                GameLogic.adjustStat(user, 'happiness', 20);
                                addLog(`Promoted to ${nextLevel.title}! New salary: ${Utils.formatMoney(user.jobSalary)}/yr. (+20 Happiness)`, 'major');
                                SoundManager.play('milestone');
                                promoted = true;
                            }
                        }

                        // Performance raise if not promoted
                        if (!promoted && user.jobPerformance >= 80) {
                            const raiseRate = skillBonuses.raiseRate || 0.05;
                            const perfBonus = Math.floor(user.jobSalary * raiseRate);
                            user.jobSalary += perfBonus;
                            GameLogic.adjustStat(user, 'happiness', 8);
                            addLog(`Outstanding performance! Your salary increased to ${Utils.formatMoney(user.jobSalary)}/yr. (+8 Happiness)`, 'good');
                        }
                    }
                }
            } else {
                // ── Part-time / legacy flat job ────────────────────────────────
                if (user.jobPerformance >= 80) {
                    const perfBonus = Math.floor(user.jobSalary * 0.05);
                    user.jobSalary += perfBonus;
                    GameLogic.adjustStat(user, 'happiness', 8);
                    addLog(`Outstanding performance! Your salary increased to ${Utils.formatMoney(user.jobSalary)}/yr. (+8 Happiness)`, 'good');
                } else if (user.jobPerformance <= 20 && Math.random() < 0.4) {
                    GameLogic.adjustStat(user, 'happiness', -25);
                    addLog(`Your employer let you go from ${user.jobTitle} due to poor performance. (-25 Happiness)`, 'bad');
                    user.jobTitle = null; user.jobSalary = 0; user.jobPerformance = 50; user.yearsInCareer = 0;
                    user.careerActionTaken = false; user.hasSeenJobSalary = false;
                }
            }
        }
    }

    if (user.isRetired && user.retirementPension > 0) {
        user.money += user.retirementPension;
        addLog(`Received your pension of ${Utils.formatMoney(user.retirementPension)}.`, 'good');
    }

    // 3. Living Expenses
    const annualLivingExpense = GameLogic.addLivingExpenses(user.age, user.isStudent, user.city);
    if (annualLivingExpense > 0) {
        user.monthlyLivingExpense = annualLivingExpense;
        user.money -= annualLivingExpense;

        if (!user.hasSeenExpenseMsg) {
            addLog(`Your basic living expenses in ${user.city} are ${Utils.formatMoney(Math.round(annualLivingExpense / 12))}/month.`, 'neutral');
            user.hasSeenExpenseMsg = true;
        }
    }

    // 4. Student Loans
    const yearlyStudentLoanPayment = GameLogic.addStudentLoanPayment(user.age, user.studentLoans, user.isStudent); 
    if (yearlyStudentLoanPayment > 0) {
        user.money = (user.money || 0) - yearlyStudentLoanPayment;
        user.studentLoans = Math.max(0, (user.studentLoans || 0) - yearlyStudentLoanPayment);
        if (user.studentLoans === 0) {
            addLog('Fully paid off your student loans!', 'good');
        }
    }

    // 5. Active Health Costs
    const healthCosts = GameLogic.calculateActiveHealthCosts(user.gymMembership, user.hasBetterDiet);
    if (healthCosts > 0) {
        user.money -= healthCosts;
    }

    // 6. Child Expenses ($500/mo per child under 21, deducted silently)
    const childMonthlyOutflow = GameLogic.calculateChildMonthlyOutflow(user.relationships);
    if (childMonthlyOutflow > 0) {
        user.money -= childMonthlyOutflow * 12;
    }

    // 7. Business auto-quarter (runs silently each age-up)
    if (user.hasBusiness) {
        try {
            const m = await loadModule('businessDashboard');
            if (m && typeof m.autoProcessBusinessQuarter === 'function') {
                m.autoProcessBusinessQuarter(user);
            }
        } catch (bErr) {
            console.error("Error processing business quarter:", bErr);
        }
    }

    // 8. Mortgage Payments
    const mortgageResult = GameLogic.processMortgagePayments(user);
    if (mortgageResult.paidOff && mortgageResult.paidOff.length > 0) {
        mortgageResult.paidOff.forEach(propName => {
            addLog(`Fully paid off the mortgage on ${propName}!`, 'good');
        });
    }

    // 9. Rental Income & Tenant Events
    GameLogic.processRentalIncome(user, state);
    GameLogic.processTenantEvents(user, state);

    // 10. Spousal Income Contribution
    const spousalInfo = GameLogic.calculateSpousalIncomeContribution(user);
    if (spousalInfo.amount > 0) {
        user.money += spousalInfo.amount;
        addLog(`Your spouse ${spousalInfo.spouseName} contributed ${Utils.formatMoney(spousalInfo.amount)} to household income!`, 'good');
    }

    // 11. Sync Monthly Outflow Snapshot
    user.monthlyOutflow = GameLogic.calculateUserMonthlyOutflow(user);
}

export function refreshClassmates(user) {
    if (!user.relationships) user.relationships = [];
    
    user.relationships.forEach(r => {
        if (r.isCurrentClassmate) r.isCurrentClassmate = false;
    });

    // Clear old classmates/teachers (non-friends)
    user.relationships = user.relationships.filter(r => r.category !== 'classmate');
    // Generate new cohort
    const cohort = GameLogic.generateSchoolCohort(user.age);
    user.relationships.push(...cohort);
}

export function handleEducation(user) {
    // 1. High School Logic
    if (user.age === 18 || (user.age === 19 && user.highSchoolRetained)) {
        if (user.schoolPerformance > 25) {
            GameLogic.adjustStat(user, 'happiness', 15);
            addLog("You graduated High School! Enroll in University or find a job. (+15 Happiness)", 'good');
            SoundManager.play('milestone');
            user.highSchoolGraduated = true;
            user.highSchoolRetained = false;
            user.isStudent = false;
            // Clear classmates on graduation
            user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
            user.relationships = user.relationships.filter(r => r.category !== 'classmate');
        } else {
            GameLogic.adjustStat(user, 'happiness', -15);
            addLog("You failed. You must stay another year in High School. (-15 Happiness)", 'bad');
            user.highSchoolRetained = true;
            user.isStudent = true;
        }
    } else if (user.age === 20 && user.highSchoolRetained) {
        GameLogic.adjustStat(user, 'happiness', 5);
        addLog("Your high school took pity on you. You passed with a GED. (+5 Happiness)", 'green');
        user.hasGED = true;
        user.highSchoolRetained = false;
        user.isStudent = false;
    }

    // 2. University Logic
    if (user.universityEnrolled) {
        if (user.schoolPerformance < 25) {
            GameLogic.adjustStat(user, 'happiness', -15);
            addLog(`You failed your University classes this year. You must retake the year. (-15 Happiness)`, 'bad');
        } else {
            user.universitySchoolYear++;
            if (GameLogic.checkSchoolGraduated(user.universitySchoolYear, 4)) {
                user.universityEnrolled = false;
                user.isStudent = false;
                user.universityGraduated = true;
                // Clear classmates on graduation
                user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
                user.relationships = user.relationships.filter(r => r.category !== 'classmate');
                GameLogic.adjustStat(user, 'happiness', 20);
                addLog(`You finished University with a degree in ${user.major}! (+20 Happiness)`, 'good');
                SoundManager.play('milestone');
            } else {
                addLog(`Completed year ${user.universitySchoolYear} of University.`, 'neutral');
            }
        }
    }

    // 3. Grad School Logic
    if (user.gradSchoolEnrolled) {
        if (user.schoolPerformance < 25) {
            GameLogic.adjustStat(user, 'happiness', -15);
            addLog(`You failed your Grad School classes this year. You must retake the year. (-15 Happiness)`, 'bad');
        } else {
            user.gradSchoolYear++;
            const school = GRAD_SCHOOLS.find(s => s.name === user.gradSchoolType);
            if (GameLogic.checkSchoolGraduated(user.gradSchoolYear, school.years)) {
                user.gradSchoolEnrolled = false;
                user.isStudent = false;
                user.gradSchoolDegree = user.gradSchoolType;
                if (!Array.isArray(user.gradSchoolDegrees)) user.gradSchoolDegrees = [];
                if (!user.gradSchoolDegrees.includes(user.gradSchoolType)) user.gradSchoolDegrees.push(user.gradSchoolType);
                // Clear classmates on graduation
                user.relationships.forEach(r => { if (r.isCurrentClassmate) r.isCurrentClassmate = false; });
                user.relationships = user.relationships.filter(r => r.category !== 'classmate');
                GameLogic.adjustStat(user, 'happiness', 25);
                addLog(`Graduated from ${user.gradSchoolType}! (+25 Happiness)`, 'good');
                SoundManager.play('milestone');
            } else {
                addLog(`Completed year ${user.gradSchoolYear} of ${user.gradSchoolType}.`, 'neutral');
            }
        }
    }

    // 4. Transitions
    if (user.age === 12) {
        addLog("Started Middle School.", 'good');
        refreshClassmates(user);
    }
    if (user.age === 14) {
        addLog("Started High School.", 'good');
        refreshClassmates(user);
    }
}

export function handleMarket(user) {
    const marketForce = GameLogic.simulateVehicleMarket();
    GameLogic.updateOwnedVehicles(user, marketForce);
    GameLogic.updateOwnedProperties(user);
    GameLogic.updateOwnedJewelry(user);

    if (user.age >= 18) {
        GameLogic.processInvestmentsAgeUp(user);
    }

    user.lotteryTicketsBoughtThisYear = 0;
    GameLogic.rollOverMegaJackpot(user);
    
    if (marketForce > 0.06 && user.age > 15) {
        addLog("Inflation hits the auto market! Car prices are up.", "bad");
    } else if (marketForce < -0.06 && user.age > 15) {
        addLog("Auto market crash! Vehicle prices are down.", "good");
    }
}

export function handleLifeEvents(user) {
    // Baby Events
    if (user.age === 1) addLog("You've discovered building blocks.", 'good');
    else if (user.age === 2) addLog("You learned to walk.", 'good');
    else if (user.age === 3) addLog("You drew on the walls.", 'good');
    else if (user.age === 5) {
        addLog("Started Elementary School!", 'good');
        refreshClassmates(user);
    }
    
    // Random Events
    else if (user.age < 18 && user.age > 5) {
        if (user.age === 15) addLog("Legal working age reached.", 'neutral');
        
        const roll = Math.random();
        if (roll < 0.2) {
            const gift = Math.floor(Math.random() * 20) + 5;
            user.money += gift;
            addLog(`Found ${Utils.formatMoney(gift)} on the sidewalk!`, 'good');
        }
    } 
    // Adult Empty State
    else if (!user.highSchoolRetained && !user.jobTitle && !user.hasBusiness && !user.universityEnrolled && user.age >= 18 && user.age < 65) {
         addLog("Unemployed. Savings are dwindling.", 'bad');
    }
}

export function handleRelationships(user) {
    // Guard clause prevents crashes if the array is missing or malformed
    if (!user.relationships || !Array.isArray(user.relationships)) return;
    
    if (!state.gameState.pendingFunerals) {
        state.gameState.pendingFunerals = [];
    }
    
    // Iterate backwards so we can splice safely
    for (let i = user.relationships.length - 1; i >= 0; i--) {
        const rel = user.relationships[i];
        rel.age++;
        
        // Progress NPC Occupation and check for milestones
        const milestoneMsg = GameLogic.progressNPCOccupation(rel, user.age);
        if (milestoneMsg) {
            addLog(milestoneMsg, 'good');
        }
        
        // Check Mortality
        const deathCheck = GameLogic.checkMortality(rel.age, rel.health ?? 100);
        if (deathCheck.isDead) {
            rel.deathCause = deathCheck.cause;

            if (rel.type === 'Teacher' && (user.isStudent || (user.age >= 5 && user.age <= 18))) {
                if (!state.gameState.pendingTeacherReplacements) {
                    state.gameState.pendingTeacherReplacements = [];
                }
                state.gameState.pendingTeacherReplacements.push({
                    deceasedTeacherName: rel.name
                });
            }

            state.gameState.pendingFunerals.push(rel);
            
            // Remove them from active relationships immediately
            user.relationships.splice(i, 1);
            continue; // Skip the rest of the updates for this person
        }
        
        // Passive relationship decay
        const previousStatus = rel.status || 0;
        rel.status = GameLogic.calculateRelationshipDecay(previousStatus, rel.interactedThisYear, rel.category, user.age);
        
        // Category shift logic
        const newCategory = GameLogic.checkRelationshipCategoryShift(rel.category, rel.status, rel.type);
        if (newCategory) {
            if (newCategory === 'enemy') {
                addLog(`${rel.name} is now your Enemy due to neglect!`, 'bad');
                rel.type = 'Enemy';
            } else if (newCategory === 'friend') {
                addLog(`You made amends with ${rel.name}. They are now a Friend.`, 'good');
                rel.type = 'Friend';
            }
            rel.category = newCategory;
        }
        
        // Reset interaction flag for next year
        rel.interactedThisYear = false;
    }
    
    // Reset global interaction flags
    user.hasSpentTimeWithAll = false;
    user.hasMetSomeoneThisYear = false;
    user.socialOutingsCountThisYear = 0;
}

export function handlePregnancy(user) {
    if (!user.isExpecting) return;

    const isMale = Math.random() < 0.5;
    const lastName = GameLogic.getLastName(user.username);
    const firstName = GameLogic.getRandomFirstName(isMale ? 'male' : 'female');

    const childId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
    const childOcc = GameLogic.generateNPCOccupation(0);
    const child = {
        id: childId,
        name: `${firstName} ${lastName}`,
        age: 0,
        type: isMale ? 'Son' : 'Daughter',
        gender: isMale ? 'male' : 'female',
        status: 100,
        category: 'child',
        interactedThisYear: false,
        appearance: AvatarLogic.generateRandomAppearance(childId, isMale ? 'male' : 'female'),
        ...childOcc
    };

    if (!user.relationships) user.relationships = [];
    user.relationships.push(child);
    addLog(`You had a baby ${isMale ? 'boy' : 'girl'}! Welcome, ${child.name}.`, 'good');
    SoundManager.play('newBaby');

    user.isExpecting = false;
    user.expectingWithId = null;
}

// Bumps the avatar cache version for the player and every relationship once
// per in-game year so avatarRenderer.js recomputes aged hair color/wrinkle
// opacity, rather than re-deriving them on every single UI render.
export function handleAppearanceAging(user) {
    user.avatarVersion = (user.avatarVersion || 0) + 1;
    (user.relationships || []).forEach(rel => {
        rel.avatarVersion = (rel.avatarVersion || 0) + 1;
    });
}

//Define the rendering function globally so script.js can call it.