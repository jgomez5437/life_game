/**
 * Life Profile Harvester & Archetype Classifier for Procedural Eulogy Engine.
 *
 * Extracts both current and historical life context (career history, retirement,
 * widowhood, marriage duration, assets, investments, crimes, and lineage) from
 * `user` state and `lifeLog` entries so eulogies reflect a complete life rather
 * than a status-at-death snapshot.
 */

import { GRAD_SCHOOL_DEGREE_TITLES, PRO_SPORTS_LEAGUES, SKILL_TRACKS } from '../constants.js';
import { BUSINESS_INDUSTRIES, HQ_TIERS } from '../../features/business/businessTypes.js';

/**
 * Format currency numbers for eulogy strings
 */
export function formatMoneyCompact(num) {
    const abs = Math.abs(num);
    if (abs >= 1000000000) {
        return `$${(abs / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (abs >= 1000000) {
        return `$${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (abs >= 1000) {
        return `$${(abs / 1000).toFixed(0)}k`;
    }
    return `$${abs.toLocaleString()}`;
}

function normalizeJobTitle(rawTitle) {
    if (!rawTitle || typeof rawTitle !== 'string') return { title: null, fromRetiredOccupation: false };
    let trimmed = rawTitle.trim();
    if (!trimmed || trimmed.toLowerCase() === 'unemployed') {
        return { title: null, fromRetiredOccupation: false };
    }
    if (trimmed.toLowerCase() === 'retired') {
        return { title: null, fromRetiredOccupation: true };
    }
    const retiredSuffixMatch = trimmed.match(/^(.+?)\s*\(retired\)$/i);
    if (retiredSuffixMatch) {
        return { title: retiredSuffixMatch[1].trim(), fromRetiredOccupation: true };
    }
    return { title: trimmed, fromRetiredOccupation: false };
}

function parseMoneyInt(str) {
    if (!str) return 0;
    const parsed = parseInt(String(str).replace(/,/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Extract comprehensive facts from user and lifeLog
 */
export function harvestLifeProfile(user, lifeLog = [], cause = null) {
    if (!user) user = {};
    const name = user.username || user.name || 'This character';
    const age = typeof user.age === 'number' ? user.age : (typeof user.ageAtDeath === 'number' ? user.ageAtDeath : 0);
    const gender = (user.gender || 'male').toLowerCase();
    const city = user.city || 'an unassuming town';
    const country = user.country || 'the country';
    const deathCause = cause || user.deathCause || user.causeOfDeath || 'Natural Causes';

    // Pronouns & grammatical verb agreement
    let pronouns = {
        sub: 'he',
        subCap: 'He',
        obj: 'him',
        pos: 'his',
        posCap: 'His',
        ref: 'himself',
        wasWere: 'was',
        hasHave: 'has',
        s: 's'
    };
    if (gender === 'female') {
        pronouns = {
            sub: 'she',
            subCap: 'She',
            obj: 'her',
            pos: 'her',
            posCap: 'Her',
            ref: 'herself',
            wasWere: 'was',
            hasHave: 'has',
            s: 's'
        };
    } else if (gender === 'non-binary' || gender === 'other') {
        pronouns = {
            sub: 'they',
            subCap: 'They',
            obj: 'them',
            pos: 'their',
            posCap: 'Their',
            ref: 'themselves',
            wasWere: 'were',
            hasHave: 'have',
            s: ''
        };
    }

    // Investments & Savings (computed early so they feed into totalEstate)
    let stockPortfolioValue = 0;
    let ownedStockCount = 0;
    if (user.investments && user.investments.stocks && user.investments.stockMarket) {
        user.investments.stockMarket.forEach(stk => {
            const h = user.investments.stocks[stk.symbol];
            if (h && h.shares > 0) {
                stockPortfolioValue += Math.round(h.shares * stk.price);
                ownedStockCount++;
            }
        });
    }
    const savingsBalance = Number(user.investments?.savings) || 0;

    // Estate calculation
    const assetValue = Array.isArray(user.assets) ? user.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0) : 0;
    const companyCash = (user.hasBusiness && typeof user.compCash === 'number') ? user.compCash : 0;
    const money = typeof user.money === 'number' ? user.money : 0;
    const computedEstate = money + assetValue + companyCash + stockPortfolioValue + savingsBalance;
    const totalEstate = (computedEstate === 0 && typeof user.finalNetWorth === 'number') ? user.finalNetWorth : computedEstate;

    let wealthTier = 'modest';
    if (totalEstate < 0) wealthTier = 'debt';
    else if (totalEstate < 15000) wealthTier = 'broke';
    else if (totalEstate < 250000) wealthTier = 'modest';
    else if (totalEstate < 2000000) wealthTier = 'wealthy';
    else if (totalEstate < 20000000) wealthTier = 'multimillionaire';
    else wealthTier = 'tycoon';

    // Relationships & Family
    const relationships = Array.isArray(user.relationships) ? user.relationships : [];
    const deceasedFamily = Array.isArray(user.deceasedFamily) ? user.deceasedFamily : [];
    const children = relationships.filter(r => r.type === 'Son' || r.type === 'Daughter' || r.category === 'child');
    const spouse = relationships.find(r => (r.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(r.type)) && !r.isDead && !r.deathCause);
    const deadSpouseInRels = relationships.find(r => (r.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(r.type)) && (r.isDead || r.deathCause));
    const partner = relationships.find(r => r.category === 'partner');
    const friends = relationships.filter(r => r.category === 'friend' || r.type === 'Friend' || r.type === 'Best Friend');
    const enemies = relationships.filter(r => r.category === 'enemy' || r.type === 'Enemy');
    const exes = relationships.filter(r => r.category === 'ex' || ['Ex-Spouse', 'Ex-Partner', 'Ex-Husband', 'Ex-Wife'].includes(r.type));
    const pets = relationships.filter(r => r.category === 'pet' || ['Dog', 'Cat', 'Bird', 'Horse'].includes(r.type));
    const livingParents = relationships.filter(r => (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && !r.isDead && !r.deathCause);

    // Life log scan
    let divorcesCount = 0;
    let loggedMarriagesCount = 0;
    let cheatedCount = 0;
    let lotteryWins = 0;
    let casinoWins = 0;
    let crimesCommitted = 0;
    let prisonEscapes = 0;
    let plasticSurgeries = 0;
    let droppedOut = false;
    let collegeDegree = false;
    let gradDegree = false;
    let bankHeists = 0;
    let murders = 0;
    let vacationsCount = 0;

    // Historical career & marriage reconstruction from lifeLog
    let loggedWorkYears = 0;
    let loggedRetired = false;
    let loggedRetiredJobTitle = null;
    let loggedLastJobTitle = null;
    let loggedPeakJobTitle = null;
    let loggedProAthlete = false;
    let loggedMafia = false;
    let loggedPension = 0;
    const marriageLogs = [];

    if (Array.isArray(lifeLog)) {
        for (const logItem of lifeLog) {
            if (!logItem || !Array.isArray(logItem.events)) continue;
            const logAge = typeof logItem.age === 'number' ? logItem.age : null;
            for (const ev of logItem.events) {
                const rawMsg = typeof ev?.msg === 'string' ? ev.msg.trim() : '';
                if (!rawMsg) continue;
                const txt = rawMsg.toLowerCase();

                if (txt.includes('divorce')) divorcesCount++;
                if (txt.includes('you married ') || txt.includes('wedding')) {
                    loggedMarriagesCount++;
                    const marriageMatch = rawMsg.match(/^You married (.+?) in a .*?wedding!/i);
                    if (marriageMatch) {
                        marriageLogs.push({ name: marriageMatch[1].trim(), age: logAge });
                    }
                }
                if (txt.includes('cheat') || txt.includes('infidelity') || txt.includes('caught having an affair')) cheatedCount++;
                if (txt.includes('lottery') && (txt.includes('won') || txt.includes('jackpot'))) lotteryWins++;
                if (txt.includes('blackjack') && txt.includes('won')) casinoWins++;
                if (txt.includes('arrested') || txt.includes('convicted') || txt.includes('guilty') || txt.includes('robbery') || txt.includes('murder')) crimesCommitted++;
                if (txt.includes('escaped from prison')) prisonEscapes++;
                if (txt.includes('plastic surgery') || txt.includes('cosmetic procedure')) plasticSurgeries++;
                if (txt.includes('dropped out')) droppedOut = true;
                if (txt.includes('bachelor') || txt.includes('graduated from university') || txt.includes('graduated from college')) collegeDegree = true;
                if (txt.includes('medical school') || txt.includes('law school') || txt.includes('business school') || txt.includes('psychiatry') || txt.includes('ph.d')) gradDegree = true;
                if (txt.includes('bank heist') && (txt.includes('escaped') || txt.includes('pulled off') || txt.includes('clean getaway'))) bankHeists++;
                if (txt.includes('murder against') || txt.includes('committed murder')) murders++;
                if (txt.includes('trip') || txt.includes('getaway') || txt.includes('vacation')) vacationsCount++;

                // Career & retirement history reconstruction
                const retireMatch = rawMsg.match(/^Retired from your position as (.+?)\./i);
                if (retireMatch) {
                    loggedRetired = true;
                    loggedRetiredJobTitle = retireMatch[1].trim();
                    loggedPeakJobTitle = loggedRetiredJobTitle;
                    loggedLastJobTitle = loggedRetiredJobTitle;
                    const penMatch = rawMsg.match(/pension of \$([\d,]+)/i);
                    if (penMatch) loggedPension = Math.max(loggedPension, parseMoneyInt(penMatch[1]));
                }

                if (txt.includes('retired from professional sports') || txt.includes('hung up your cleats')) {
                    loggedRetired = true;
                    loggedProAthlete = true;
                }

                if (txt.includes('annual pension of') || txt.includes('received your pension of')) {
                    loggedRetired = true;
                    const penMatch = rawMsg.match(/pension of \$([\d,]+)/i);
                    if (penMatch) loggedPension = Math.max(loggedPension, parseMoneyInt(penMatch[1]));
                }

                const mafiaPromoMatch = rawMsg.match(/^You've been promoted to (.+?) in the Syndicate!/i);
                if (mafiaPromoMatch) {
                    loggedMafia = true;
                    loggedPeakJobTitle = mafiaPromoMatch[1].trim();
                    loggedLastJobTitle = loggedPeakJobTitle;
                }

                const promoMatch = !mafiaPromoMatch && rawMsg.match(/^Promoted to (.+?)(?:!|\.)/i);
                if (promoMatch) {
                    loggedPeakJobTitle = promoMatch[1].trim();
                    loggedLastJobTitle = loggedPeakJobTitle;
                }

                const salaryMatch = rawMsg.match(/^Earned \$[\d,]+ as (?:an? )?(.+?)\./i);
                if (salaryMatch) {
                    const role = salaryMatch[1].trim();
                    loggedWorkYears++;
                    loggedLastJobTitle = role;
                    if (!loggedPeakJobTitle) loggedPeakJobTitle = role;
                }

                if (txt.includes('met your syndicate quota')) {
                    loggedMafia = true;
                    loggedWorkYears++;
                }

                if (txt.includes('completed the season with the') || txt.includes('team workout & season quota')) {
                    loggedProAthlete = true;
                    loggedWorkYears++;
                }

                const hiredCareerMatch = rawMsg.match(/^Hired as (.+?)(?:\s+in\s+.+?)?!/i);
                if (hiredCareerMatch) {
                    const role = hiredCareerMatch[1].trim();
                    loggedLastJobTitle = role;
                    if (!loggedPeakJobTitle) loggedPeakJobTitle = role;
                }

                const mafiaInitMatch = rawMsg.match(/initiated into .+? as (?:an? )?(.+?)\./i);
                if (mafiaInitMatch) {
                    loggedMafia = true;
                    loggedLastJobTitle = mafiaInitMatch[1].trim();
                    if (!loggedPeakJobTitle) loggedPeakJobTitle = loggedLastJobTitle;
                }

                const draftedMatch = rawMsg.match(/(?:drafted in the .+? of the .+? as|signed to the .+? roster as|contract extension!.*? as) (?:an? )?(.+?)!/i);
                if (draftedMatch) {
                    loggedProAthlete = true;
                    loggedLastJobTitle = draftedMatch[1].trim();
                    loggedPeakJobTitle = loggedLastJobTitle;
                }

                const resignedMatch = rawMsg.match(/^Resigned from position as (.+?)\./i);
                if (resignedMatch) {
                    const role = resignedMatch[1].trim();
                    loggedLastJobTitle = role;
                    if (!loggedPeakJobTitle) loggedPeakJobTitle = role;
                }

                const firedMatch = rawMsg.match(/^(?:Terminated from|Your employer let you go from) (.+?) due to/i);
                if (firedMatch) {
                    const role = firedMatch[1].trim();
                    loggedLastJobTitle = role;
                    if (!loggedPeakJobTitle) loggedPeakJobTitle = role;
                }
            }
        }
    }

    // Careers & Jobs (normalize empty strings or 'unemployed' to null, and honor historical career)
    const rawActiveJob = normalizeJobTitle(user.jobTitle);
    const rawOccupation = normalizeJobTitle(user.occupation);
    const activeJobTitle = rawActiveJob.title || rawOccupation.title;
    const isRetired = Boolean(
        user.isRetired ||
        rawActiveJob.fromRetiredOccupation ||
        rawOccupation.fromRetiredOccupation ||
        loggedRetired ||
        (Number(user.retirementPension) > 0)
    );
    const isActiveJob = Boolean(rawActiveJob.title) || (Boolean(rawOccupation.title) && !isRetired);

    const historicalJobTitle =
        normalizeJobTitle(user.retiredFromJobTitle).title ||
        normalizeJobTitle(user.peakJobTitle).title ||
        normalizeJobTitle(user.lastJobTitle).title ||
        loggedRetiredJobTitle ||
        loggedPeakJobTitle ||
        loggedLastJobTitle ||
        null;

    const jobTitle = activeJobTitle || historicalJobTitle || null;
    const formerJobTitle = !isActiveJob ? historicalJobTitle : null;

    const careerTrack = user.careerTrack || user.retiredCareerTrack || user.lastCareerTrack || null;
    const inPrison = Boolean(user.inPrison);
    const prisonYears = (user.prisonTotalSentence || 0);

    // Widowhood & Marriage History
    const deceasedSpouses = deceasedFamily.filter(d =>
        d && (['Wife', 'Husband', 'Spouse'].includes(d.type) || d.category === 'spouse')
    );
    const lateSpouseRecord = !spouse
        ? (deceasedSpouses[deceasedSpouses.length - 1] || user.lateSpouse || deadSpouseInRels || null)
        : null;

    let isWidowed = Boolean(lateSpouseRecord);
    let lateSpouseName = lateSpouseRecord?.name || null;

    // Fallback: if lifeLog recorded a marriage not ended by divorce and no living spouse remains
    const lastMarriageLog = marriageLogs.length > 0 ? marriageLogs[marriageLogs.length - 1] : null;
    if (!spouse && !isWidowed && loggedMarriagesCount > divorcesCount && lastMarriageLog?.name) {
        const isEx = exes.some(e => e && e.name === lastMarriageLog.name);
        if (!isEx) {
            isWidowed = true;
            lateSpouseName = lastMarriageLog.name;
        }
    }

    const knownMinimumMarriages = (spouse || isWidowed ? 1 : 0) + divorcesCount;
    const marriagesCount = Math.max(loggedMarriagesCount, knownMinimumMarriages);

    let yearsMarried = 0;
    if (spouse) {
        const marriedAtAge = typeof spouse.marriedAtAge === 'number'
            ? spouse.marriedAtAge
            : (typeof user.marriedAtAge === 'number'
                ? user.marriedAtAge
                : (marriageLogs.find(m => m.name === spouse.name)?.age ?? lastMarriageLog?.age ?? null));
        if (typeof marriedAtAge === 'number' && age > marriedAtAge) {
            yearsMarried = age - marriedAtAge;
        }
    } else if (isWidowed) {
        if (typeof lateSpouseRecord?.yearsMarried === 'number' && lateSpouseRecord.yearsMarried > 0) {
            yearsMarried = lateSpouseRecord.yearsMarried;
        } else {
            const firstLateName = lateSpouseName ? lateSpouseName.split(' ')[0].toLowerCase() : null;
            const matchedMarriage = (lateSpouseName && marriageLogs.find(m =>
                m.name.toLowerCase() === lateSpouseName.toLowerCase() ||
                (firstLateName && m.name.toLowerCase().startsWith(firstLateName + ' '))
            )) || lastMarriageLog;
            const marriedAtAge = typeof lateSpouseRecord?.marriedAtAge === 'number'
                ? lateSpouseRecord.marriedAtAge
                : (typeof user.marriedAtAge === 'number' ? user.marriedAtAge : matchedMarriage?.age ?? null);
            const endYear = typeof lateSpouseRecord?.yearDied === 'number' ? lateSpouseRecord.yearDied : age;
            if (typeof marriedAtAge === 'number' && endYear > marriedAtAge) {
                yearsMarried = endYear - marriedAtAge;
            }
        }
    }

    // Education Specifics
    const major = user.major ? String(user.major).trim() : null;
    const highSchoolGraduated = Boolean(user.highSchoolGraduated);
    const hasGED = Boolean(user.hasGED);
    const highSchoolRetained = Boolean(user.highSchoolRetained);
    const gradSchoolType = user.gradSchoolType || user.gradSchoolDegree || null;
    const gradSchoolDegreeTitle = (gradSchoolType && GRAD_SCHOOL_DEGREE_TITLES && GRAD_SCHOOL_DEGREE_TITLES[gradSchoolType])
        ? GRAD_SCHOOL_DEGREE_TITLES[gradSchoolType]
        : (user.gradSchoolDegree ? String(user.gradSchoolDegree) : null);
    const studentLoans = Number(user.studentLoans) || 0;

    // Career Specifics
    const careerLevel = user.careerLevel || user.retiredCareerLevel || 0;
    const yearsInCareer = Math.max(
        Number(user.yearsInCareer) || 0,
        Number(user.retiredYearsInCareer) || 0,
        Number(user.totalYearsWorked) || 0,
        loggedWorkYears
    );
    const yearsInRole = user.yearsInRole || 0;
    const retirementPension = Math.max(Number(user.retirementPension) || 0, loggedPension);
    const isMafia = careerTrack === 'mafia_syndicate' || loggedMafia;
    const isProAthlete = careerTrack === 'pro_athlete' ||
        loggedProAthlete ||
        Boolean(user.athleteSport && ((user.athleteRings || 0) > 0 || (user.athleteMvps || 0) > 0 || (user.athleteCareerEarnings || 0) > 0));
    const athleteSport = user.athleteSport || null;
    const athleteLeagueName = (athleteSport && PRO_SPORTS_LEAGUES && PRO_SPORTS_LEAGUES[athleteSport]?.leagueName) || null;
    const athleteRings = Number(user.athleteRings) || 0;
    const athleteMvps = Number(user.athleteMvps) || 0;
    const athleteCareerEarnings = Number(user.athleteCareerEarnings) || 0;

    // Business Specifics
    const businessName = user.companyName || user.business?.name || null;
    const hasBusiness = Boolean(user.hasBusiness || businessName);
    const industry = user.industry || null;
    const industryName = (industry && BUSINESS_INDUSTRIES && BUSINESS_INDUSTRIES[industry]?.name) || null;
    const hqTier = user.hqTier || null;
    const hqName = (hqTier && HQ_TIERS && HQ_TIERS.find(h => h.id === hqTier)?.name) || null;
    const employees = Number(user.employees) || 0;
    const isPublic = Boolean(user.isPublic);
    const compCash = Number(user.compCash) || 0;
    const companyValuation = Number(user.businessValuation) || 0;

    // Assets & Real Estate Specifics
    const rawAssets = Array.isArray(user.assets) ? user.assets : [];
    const propertyAssets = rawAssets.filter(a => a && a.category === 'property');
    const rentalPropertiesCount = propertyAssets.filter(p => p.isRented || p.tenant).length;
    const topProperty = propertyAssets.slice().sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
    const topPropertyName = topProperty ? topProperty.name : null;

    const vehicleAssets = rawAssets.filter(a => a && a.category === 'vehicle');
    const topVehicle = vehicleAssets.slice().sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
    const topVehicleName = topVehicle ? topVehicle.name : null;
    const brokenVehiclesCount = vehicleAssets.filter(v => typeof v.condition === 'number' && v.condition < 25).length;

    const jewelryAssets = rawAssets.filter(a => a && a.category === 'jewelry');
    const topJewelry = jewelryAssets.slice().sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))[0];
    const topJewelryName = topJewelry ? topJewelry.name : null;

    // Lineage & Relocation
    const pastLives = Array.isArray(user.pastLives) ? user.pastLives : [];
    const generation = Number(user.generation) || (pastLives.length > 0 ? pastLives.length + 1 : 1);
    const ancestorName = pastLives[0]?.name || null;
    const relocationsCount = Number(user.relocationsCount) || 0;

    // Named Social Circle
    const childrenNames = children.map(c => c.name).filter(Boolean);
    const sortedFriends = friends.slice().sort((a, b) => (b.status || 0) - (a.status || 0));
    const bestFriendName = sortedFriends[0]?.name || null;
    const archEnemyName = enemies[0]?.name || null;
    const exName = exes[0]?.name || null;

    // Skills & Instruments
    const certifiedSkills = [];
    const topInstruments = [];
    const topSkills = [];
    if (user.skills && typeof user.skills === 'object') {
        SKILL_TRACKS.forEach(trk => {
            const st = user.skills[trk.key];
            if (!st) return;
            const xp = Number(st.xp) || 0;
            const cert = Boolean(st.certified || (Array.isArray(st.tiersCompleted) && st.tiersCompleted.includes(3)));
            if (cert) {
                certifiedSkills.push({ key: trk.key, name: trk.shortName || trk.name, certificateTitle: trk.certificateTitle });
            }
            if (trk.category === 'instruments' && (xp >= 30 || cert)) {
                topInstruments.push({ key: trk.key, name: trk.shortName || trk.name, xp, certified: cert });
            } else if (trk.category !== 'instruments' && (xp >= 40 || cert)) {
                topSkills.push({ key: trk.key, name: trk.shortName || trk.name, xp, certified: cert });
            }
        });
    }

    // Prison & Underworld Detail
    const facilityName = user.facilityName || null;
    const prisonSecurity = user.prisonSecurity || null;
    const cellmateName = user.cellmate?.name || null;
    const prisonGang = user.prisonStats?.gang && user.prisonStats.gang !== 'None' ? user.prisonStats.gang : null;

    // Lifestyle & Diet
    const diet = user.diet || (user.hasBetterDiet ? 'balanced' : 'junk');
    const gymMembership = Boolean(user.gymMembership);

    return {
        name,
        age,
        gender,
        pronouns,
        city,
        country,
        deathCause,
        totalEstate,
        wealthTier,
        jobTitle,
        formerJobTitle,
        isActiveJob,
        careerTrack,
        hasBusiness,
        businessName,
        childrenCount: children.length,
        hasSpouse: Boolean(spouse),
        spouseName: spouse ? spouse.name : null,
        isWidowed,
        lateSpouseName,
        yearsMarried,
        partnerName: partner ? partner.name : null,
        partnerType: partner ? partner.type : null,
        friendsCount: friends.length,
        petsCount: pets.length,
        marriagesCount,
        divorcesCount,
        cheatedCount,
        inPrison,
        prisonYears,
        crimesCommitted: Math.max(crimesCommitted, Number(user.lifetimeCrimesCommitted) || 0),
        prisonEscapes,
        plasticSurgeries,
        lotteryWins,
        casinoWins,
        droppedOut,
        collegeDegree: collegeDegree || Boolean(user.universityGraduated),
        gradDegree: gradDegree || Boolean(user.gradSchoolDegree),
        looks: typeof user.looks === 'number' ? user.looks : 50,
        smarts: typeof user.smarts === 'number' ? user.smarts : 50,
        happiness: typeof user.happiness === 'number' ? user.happiness : 50,

        // Specific nuanced dimensions
        generation,
        ancestorName,
        relocationsCount,
        major,
        highSchoolGraduated,
        hasGED,
        highSchoolRetained,
        gradSchoolType,
        gradSchoolDegreeTitle,
        studentLoans,
        careerLevel,
        yearsInCareer,
        yearsInRole,
        isRetired,
        retirementPension,
        isMafia,
        isProAthlete,
        athleteSport,
        athleteLeagueName,
        athleteRings,
        athleteMvps,
        athleteCareerEarnings,
        industry,
        industryName,
        hqTier,
        hqName,
        employees,
        isPublic,
        compCash,
        companyValuation,
        propertiesCount: propertyAssets.length,
        rentalPropertiesCount,
        topPropertyName,
        vehiclesCount: vehicleAssets.length,
        topVehicleName,
        brokenVehiclesCount,
        jewelryCount: jewelryAssets.length,
        topJewelryName,
        stockPortfolioValue,
        ownedStockCount,
        savingsBalance,
        childrenNames,
        bestFriendName,
        archEnemyName,
        exName,
        livingParentsCount: livingParents.length,
        certifiedSkills,
        topInstruments,
        topSkills,
        bankHeists,
        murders,
        facilityName,
        prisonSecurity,
        cellmateName,
        prisonGang,
        diet,
        gymMembership,
        vacationsCount
    };
}

/**
 * Classify life archetype for thematic flavor
 */
export function classifyArchetype(p) {
    if (p.age < 18) return 'INNOCENT_YOUTH';
    if (p.inPrison || p.prisonYears >= 5 || p.crimesCommitted >= 3 || p.prisonEscapes > 0) return 'CAREER_CRIMINAL';
    if (p.wealthTier === 'tycoon' || p.wealthTier === 'multimillionaire' || (p.wealthTier === 'wealthy' && p.hasBusiness)) return 'CORPORATE_TYCOON';
    if (p.divorcesCount >= 2 || p.marriagesCount >= 3 || p.cheatedCount >= 2) return 'SERIAL_ROMANTIC';
    if (p.childrenCount >= 3 && p.marriagesCount >= 1 && p.divorcesCount === 0) return 'DEVOTED_FAMILY';
    if (p.looks >= 85 && p.plasticSurgeries >= 2) return 'VAIN_SOCIALITE';
    if (p.wealthTier === 'debt' || (p.wealthTier === 'broke' && (p.lotteryWins > 0 || p.casinoWins > 0))) return 'BROKE_DREAMER';
    if (!p.jobTitle && !p.formerJobTitle && !p.isRetired && !p.hasBusiness && !p.isProAthlete && !p.isMafia && p.age >= 20 && p.crimesCommitted === 0) return 'LOVABLE_SLACKER';
    if (p.gradDegree || ['Doctor', 'Surgeon', 'Lawyer', 'Judge', 'Professor', 'Scientist'].some(j => (p.jobTitle || '').includes(j))) return 'SCHOLAR_PROFESSIONAL';
    return 'ORDINARY_CITIZEN';
}
