/**
 * Procedural Eulogy Generator Engine (Zero-AI Architecture)
 * 
 * Crafts intricate, nuanced, context-aware 4–6 sentence life summaries
 * based on character lineage, education degrees, career & special tracks
 * (Pro Athlete rings/MVPs, Mafia Syndicate ranks), business ventures & IPOs,
 * named relationships (spouse, partners, children, best friends, rivals),
 * skills & instruments, real estate & investment assets, underworld crimes,
 * prison time, and cause of death.
 */

import { GRAD_SCHOOL_DEGREE_TITLES, PRO_SPORTS_LEAGUES, SKILL_TRACKS, CAREER_TRACKS, SPECIAL_CAREER_TRACKS } from './constants.js';
import { BUSINESS_INDUSTRIES, HQ_TIERS } from '../features/business/businessTypes.js';

// Simple 32-bit integer hash function (FNV-1a)
function hashString(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

// Seeded pseudo-random number generator (Mulberry32)
function createPRNG(seedNumber) {
    let state = seedNumber | 0;
    return function() {
        state |= 0;
        state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Format currency numbers for eulogy strings
 */
function formatMoneyCompact(num) {
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

    // Estate calculation
    const assetValue = Array.isArray(user.assets) ? user.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0) : 0;
    const companyCash = (user.hasBusiness && typeof user.compCash === 'number') ? user.compCash : 0;
    const money = typeof user.money === 'number' ? user.money : 0;
    const computedEstate = money + assetValue + companyCash;
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
    const children = relationships.filter(r => r.type === 'Son' || r.type === 'Daughter' || r.category === 'child');
    const spouse = relationships.find(r => r.category === 'spouse' || ['Wife', 'Husband', 'Spouse'].includes(r.type));
    const partner = relationships.find(r => r.category === 'partner');
    const friends = relationships.filter(r => r.category === 'friend' || r.type === 'Friend' || r.type === 'Best Friend');
    const enemies = relationships.filter(r => r.category === 'enemy' || r.type === 'Enemy');
    const exes = relationships.filter(r => r.category === 'ex' || ['Ex-Spouse', 'Ex-Partner'].includes(r.type));
    const pets = relationships.filter(r => r.category === 'pet' || ['Dog', 'Cat', 'Bird', 'Horse'].includes(r.type));
    const livingParents = relationships.filter(r => (r.type === 'Mother' || r.type === 'Father' || r.category === 'parent') && !r.isDead && !r.deathCause);

    // Life log scan
    let divorcesCount = 0;
    let marriagesCount = spouse ? 1 : 0;
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

    if (Array.isArray(lifeLog)) {
        for (const logItem of lifeLog) {
            if (!logItem || !Array.isArray(logItem.events)) continue;
            for (const ev of logItem.events) {
                const txt = (ev.msg || '').toLowerCase();
                if (txt.includes('divorce')) divorcesCount++;
                if (txt.includes('married') || txt.includes('wedding')) marriagesCount++;
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
            }
        }
    }

    // Careers & Jobs (normalize empty strings or 'unemployed' to null)
    let jobTitle = user.jobTitle || user.occupation || null;
    if (jobTitle && typeof jobTitle === 'string' && (jobTitle.trim().toLowerCase() === 'unemployed' || jobTitle.trim() === '')) {
        jobTitle = null;
    }
    const careerTrack = user.careerTrack || null;
    const inPrison = Boolean(user.inPrison);
    const prisonYears = (user.prisonTotalSentence || 0);

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
    const careerLevel = user.careerLevel || 0;
    const yearsInCareer = user.yearsInCareer || 0;
    const yearsInRole = user.yearsInRole || 0;
    const isRetired = Boolean(user.isRetired);
    const retirementPension = Number(user.retirementPension) || 0;
    const isMafia = user.careerTrack === 'mafia_syndicate';
    const isProAthlete = user.careerTrack === 'pro_athlete';
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
        careerTrack,
        hasBusiness,
        businessName,
        childrenCount: children.length,
        hasSpouse: Boolean(spouse),
        spouseName: spouse ? spouse.name : null,
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
    if (!p.jobTitle && p.age >= 20 && p.crimesCommitted === 0) return 'LOVABLE_SLACKER';
    if (p.gradDegree || ['Doctor', 'Surgeon', 'Lawyer', 'Judge', 'Professor', 'Scientist'].some(j => (p.jobTitle || '').includes(j))) return 'SCHOLAR_PROFESSIONAL';
    return 'ORDINARY_CITIZEN';
}

/**
 * Clean cause of death for smooth grammatical phrasing
 */
function cleanCausePhrase(cause) {
    if (!cause) return 'natural causes';
    let c = cause.trim();
    c = c.replace(/^(from|of|due to)\s+/i, '');
    c = c.replace(/\.+$/, '');
    return c;
}

/**
 * Clean job title with indefinite article ("a CEO", "an Architect")
 */
function getJobWithArticle(jobTitle) {
    if (!jobTitle) return null;
    const trimmed = jobTitle.trim();
    const firstLetter = trimmed.charAt(0).toLowerCase();
    const article = ['a', 'e', 'i', 'o', 'u'].includes(firstLetter) ? 'an' : 'a';
    return `${article} ${trimmed}`;
}

/**
 * Main procedural generator: 4–6 sentence compositional narrative
 */
export function generateProceduralEulogy(user, lifeLog = [], cause = null) {
    const profile = harvestLifeProfile(user, lifeLog, cause);
    const archetype = classifyArchetype(profile);

    // Seeded determinism: consistent for the same identity and life choices
    const seedString = `${profile.name}_${profile.age}_${profile.deathCause}_${profile.totalEstate}_${profile.city}_${profile.jobTitle || 'none'}_${profile.businessName || 'none'}_${profile.generation}_${profile.crimesCommitted}`;
    const rng = createPRNG(hashString(seedString));
    const pick = (arr) => arr[Math.floor(rng() * arr.length)];

    const {
        name, age, pronouns, city, country, totalEstate, wealthTier,
        jobTitle, careerTrack, hasBusiness, businessName, childrenCount,
        hasSpouse, spouseName, partnerName, partnerType, childrenNames,
        bestFriendName, archEnemyName, divorcesCount, marriagesCount,
        inPrison, prisonYears, crimesCommitted, prisonEscapes,
        plasticSurgeries, lotteryWins, casinoWins, major, hasGED,
        droppedOut, gradSchoolDegreeTitle, isRetired, retirementPension,
        isMafia, isProAthlete, athleteSport, athleteLeagueName, athleteRings,
        athleteMvps, athleteCareerEarnings, industryName, hqName, employees,
        isPublic, propertiesCount, rentalPropertiesCount, topPropertyName,
        topVehicleName, stockPortfolioValue, generation, ancestorName,
        relocationsCount, certifiedSkills, topInstruments, topSkills,
        facilityName, cellmateName, bankHeists
    } = profile;

    const causePhrase = cleanCausePhrase(profile.deathCause);
    const jobWithArt = getJobWithArticle(jobTitle);
    const wealthStr = formatMoneyCompact(totalEstate);
    const debtStr = formatMoneyCompact(Math.abs(totalEstate));

    // ==========================================
    // SPECIAL GUARDRAIL: INNOCENT YOUTH (< 18)
    // ==========================================
    if (age < 18 || archetype === 'INNOCENT_YOUTH') {
        const youthS1 = pick([
            `Though ${pronouns.pos} time in ${city} was cut heartbreakingly short at age ${age}, ${name} filled every single day with radiant laughter, boundless curiosity, and a mischievous spark.`,
            `Growing up in ${city}, ${name} lived a vibrant ${age} years celebrated by family and schoolmates for a bright imagination and an undeniable talent for playground adventures.`,
            `Departing far too soon at age ${age}, ${name} was cherished across ${city} as an affectionate, bright spirit whose boundless enthusiasm turned ordinary days into celebrations.`
        ]);

        const instrumentMention = topInstruments.length > 0 ? ` eagerly practicing the ${topInstruments[0].name.toLowerCase()}` : '';
        const friendMention = bestFriendName ? ` alongside best friend ${bestFriendName}` : '';
        const youthS2 = pick([
            `Known for an uncanny ability to misplace homework and an insatiable appetite for sweet snacks, ${pronouns.sub} filled the entire household with unforgettable joy and giggles.`,
            `Whether organizing playground games${friendMention}${instrumentMention ? ` or${instrumentMention}` : ''}, ${pronouns.sub} possessed a rare gift for making everyone around ${pronouns.obj} feel included.`,
            `At school and at home, ${pronouns.pos} infectious smile and gentle nature left an indelible impression on classmates, teachers, and neighbors alike.`
        ]);

        const famText = childrenNames.length > 0 ? `beloved siblings` : `loving family members`;
        const youthS3 = pick([
            `Surrounded by devoted parents, ${famText}, and neighborhood friends, ${pronouns.sub} was a beacon of innocence who taught everyone around ${pronouns.obj} the true meaning of unconditional love.`,
            `Every memory of ${pronouns.pos} quick wit, warm hugs, and generous heart will remain forever etched into the souls of the family who loved ${pronouns.obj} beyond measure.`,
            `Classmates and neighborhood playmates will always remember ${pronouns.pos} boundless energy and loyal companionship through every childhood game.`
        ]);

        const youthS4 = pick([
            `${pronouns.posCap} gentle journey ended following ${causePhrase}, leaving behind heartbroken loved ones who will forever treasure every precious second they shared together.`,
            `Taken from this world at age ${age} due to ${causePhrase}, ${pronouns.sub} leaves behind an eternal legacy of pure light, innocence, and tender memories.`,
            `Though ${pronouns.pos} years were few, ${pronouns.pos} love was boundless, and following ${pronouns.pos} sudden passing from ${causePhrase}, ${pronouns.sub} will remain forever young in the hearts of all who knew ${pronouns.obj}.`
        ]);

        return `${youthS1} ${youthS2} ${youthS3} ${youthS4}`;
    }

    // =========================================================================
    // MOVEMENT 1: ORIGINS, LINEAGE & FORMATIVE EDUCATION (Adults)
    // =========================================================================
    let sentence1 = '';

    // Lineage or international background prefix
    const genOrdinal = generation === 2 ? '2nd' : generation === 3 ? '3rd' : `${generation}th`;
    let originPrefix = `Born in ${city}`;
    if (generation >= 2 && ancestorName) {
        originPrefix = pick([
            `Continuing the generational lineage of ${ancestorName} as a proud ${genOrdinal}-generation descendant in ${city}`,
            `Carrying forward the family mantle in ${city} as the proud ${genOrdinal}-generation successor to ${ancestorName}`,
            `Rooted in the storied family lineage of ${ancestorName} as a ${genOrdinal}-generation pillar of ${city}`
        ]);
    } else if (relocationsCount >= 2) {
        originPrefix = pick([
            `Having lived across ${relocationsCount} different countries before making a mark on ${city}`,
            `A worldly citizen who traversed multiple continents before settling down in ${city}`
        ]);
    }

    // Academic / Formative Trajectory
    if (gradSchoolDegreeTitle) {
        sentence1 = pick([
            `${originPrefix}, ${name} laid the foundation for an exceptional life by earning a prestigious ${gradSchoolDegreeTitle}.`,
            `${originPrefix}, ${name} was celebrated from an early age as a sharp intellect, culminating in a distinguished ${gradSchoolDegreeTitle}.`,
            `${originPrefix}, ${name} channeled formidable academic ambition into securing a ${gradSchoolDegreeTitle}.`
        ]);
    } else if (major) {
        sentence1 = pick([
            `${originPrefix}, ${name} earned a university degree in ${major}, setting the stage for a colorful and ambitious life.`,
            `${originPrefix}, ${name} tackled ${pronouns.pos} university studies in ${major} before diving headfirst into the real world.`,
            `${originPrefix}, ${name} paired a formal education in ${major} with an unshakeable determination to forge ${pronouns.pos} own destiny.`
        ]);
    } else if (hasGED) {
        sentence1 = pick([
            `${originPrefix}, ${name} sidestepped traditional academic molds, proudly earning a high school equivalency diploma (GED) before pursuing life on ${pronouns.pos} own terms.`,
            `${originPrefix}, ${name} overcame early classroom stumbles with a hard-won GED and a stubborn refusal to be boxed into expectations.`
        ]);
    } else if (droppedOut) {
        sentence1 = pick([
            `${originPrefix}, ${name} walked away from the classroom early, betting entirely on ${pronouns.pos} own instincts, raw grit, and street smarts.`,
            `${originPrefix}, ${name} concluded that lecture halls were far too small for ${pronouns.pos} ambitions, leaving school behind to chase practical experience.`
        ]);
    } else if (profile.smarts >= 85) {
        sentence1 = pick([
            `${originPrefix}, ${name} was distinguished from youth by an incisive, razor-sharp intellect and an analytical mind that never seemed to rest.`,
            `${originPrefix}, ${name} navigated life with an enviable intellect, regularly out-thinking peers and approaching every challenge like a master chess game.`
        ]);
    } else {
        sentence1 = pick([
            `${originPrefix}, ${name} navigated the ups and downs of life in ${country} with dry wit, colorful stubbornness, and personal resilience.`,
            `${originPrefix}, ${name} spent ${age} eventful years greeting life with dry humor and an unshakeable refusal to take things too seriously.`,
            `${originPrefix}, ${name} lived a colorful ${age} years defined by a steadfast determination to live life strictly on ${pronouns.pos} own terms.`
        ]);
    }

    // =========================================================================
    // MOVEMENT 2: CAREER, PRO SPORTS, MAFIA & BUSINESS EMPIRE
    // =========================================================================
    let sentence2 = '';

    if (isProAthlete) {
        const sportName = athleteSport || 'pro';
        const leagueName = athleteLeagueName || 'the league';
        if (athleteRings > 0 || athleteMvps > 0) {
            const ringsText = athleteRings > 0 ? `${athleteRings} championship ring${athleteRings > 1 ? 's' : ''}` : '';
            const mvpText = athleteMvps > 0 ? `${athleteMvps} MVP award${athleteMvps > 1 ? 's' : ''}` : '';
            const awardsJoined = [ringsText, mvpText].filter(Boolean).join(' and ');
            sentence2 = pick([
                `On the grand stage of ${leagueName}, ${pronouns.sub} achieved sports immortality, claiming ${awardsJoined} while amassing ${formatMoneyCompact(athleteCareerEarnings || totalEstate)} in hard-fought professional earnings.`,
                `A true titan of ${sportName}, ${name} dominated ${leagueName} competition to capture ${awardsJoined}, forever etching ${pronouns.pos} name into local athletic lore.`,
                `Revered across stadium arenas in ${country}, ${pronouns.sub} led ${pronouns.pos} franchise to victory with ${awardsJoined}, finishing an elite sports career with legendary status.`
            ]);
        } else {
            sentence2 = pick([
                `Dedicating ${pronouns.pos} prime athletic years to ${leagueName}, ${pronouns.sub} battled through grueling physical seasons as a relentless professional competitor.`,
                `Competing in ${leagueName}, ${name} experienced the roar of packed stadiums and the thrill of professional athletics, earning the respect of teammates and rivals alike.`,
                `As a dedicated pro athlete in ${leagueName}, ${pronouns.sub} poured heart, sweat, and stamina into every single match on the field.`
            ]);
        }
    } else if (isMafia) {
        if (profile.careerLevel >= 4 || jobTitle === 'The Don') {
            sentence2 = pick([
                `Operating deep within the underworld of La Cosa Nostra, ${pronouns.sub} ruthlessly ascended through syndicate ranks to reign supreme as The Don, demanding total respect and ruling ${city} from the shadows.`,
                `A legendary underworld figure, ${name} cemented ${pronouns.pos} authority as the undisputed Don of the Crime Syndicate, enforcing omertà with an iron fist.`,
                `From the back alleys to private banquet halls, ${pronouns.sub} commanded the mafia syndicate as The Don, turning underworld allegiance into an unstoppable criminal enterprise.`
            ]);
        } else {
            const mafiaRank = jobTitle || 'Made Man';
            sentence2 = pick([
                `Deeply entrenched in the syndicate hierarchy as ${getJobWithArticle(mafiaRank)}, ${pronouns.sub} strictly honored the family code while handling street collections across ${city}.`,
                `Operating as ${getJobWithArticle(mafiaRank)} in La Cosa Nostra, ${name} navigated high-stakes shakedowns and underworld tensions with quiet resolve.`,
                `Within the secretive ranks of the syndicate, ${pronouns.sub} earned a notorious reputation as ${getJobWithArticle(mafiaRank)} who never failed to deliver results.`
            ]);
        }
    } else if (hasBusiness && businessName) {
        const indPhrase = industryName ? `in the ${industryName} sector` : 'in the commercial sector';
        if (isPublic) {
            sentence2 = pick([
                `In the business arena, ${name} founded ${businessName} ${indPhrase}, overcoming cutthroat competition to steer the enterprise all the way to a historic public IPO on Wall Street.`,
                `A visionary entrepreneur, ${pronouns.sub} created ${businessName} from scratch, ultimately celebrating the ringing of the opening bell in a triumphant public IPO.`,
                `Riding bold instincts and fierce ambition, ${pronouns.sub} turned ${businessName} into a household name ${indPhrase}, culminating in a high-profile public IPO.`
            ]);
        } else if (employees >= 20 || hqName) {
            sentence2 = pick([
                `Demonstrating exceptional commercial acumen, ${name} founded and scaled ${businessName} ${indPhrase}, expanding all the way into ${hqName || 'corporate headquarters'} with a loyal workforce of ${employees} employees.`,
                `As the founder and CEO of ${businessName}, ${pronouns.sub} built a formidable enterprise from the ground up, providing livelihoods for ${employees} team members.`,
                `Channeling relentless drive, ${pronouns.sub} guided ${businessName} through volatile quarterly markets to establish a flourishing commercial presence in ${city}.`
            ]);
        } else {
            sentence2 = pick([
                `Possessing a fierce entrepreneurial spirit, ${name} poured heart and savings into bootstrapping ${businessName} ${indPhrase}, taking deep pride in steering ${pronouns.pos} own venture.`,
                `Refusing to labor under corporate bosses, ${pronouns.sub} launched ${businessName}, savoring the independence of founder ownership.`,
                `As the driving force behind ${businessName}, ${pronouns.sub} navigated the challenges of running an independent business with stubborn optimism.`
            ]);
        }
    } else if (jobTitle) {
        if (isRetired) {
            sentence2 = pick([
                `Following a celebrated ${yearsInCareer > 1 ? `${yearsInCareer}-year ` : ''}career as ${jobWithArt}, ${pronouns.sub} transitioned gracefully into retirement, enjoying a pension of ${formatMoneyCompact(retirementPension)} per year.`,
                `After decades of faithful service as ${jobWithArt}, ${name} hung up ${pronouns.pos} boots, collecting an annual retirement pension of ${formatMoneyCompact(retirementPension)} and leaving behind an admired professional legacy.`,
                `A fixture of ${pronouns.pos} workplace for many years, ${pronouns.sub} concluded a dedicated career as ${jobWithArt} to savor well-earned golden years of leisure.`
            ]);
        } else {
            sentence2 = pick([
                `In the workforce, ${name} carved out a dedicated career as ${jobWithArt}, known among colleagues for steadfast reliability and a signature dry wit.`,
                `Spending decades as ${jobWithArt}, ${pronouns.sub} navigated professional duties with steady competence and a stubborn refusal to suffer workplace nonsense.`,
                `Holding down a respected role as ${jobWithArt}, ${name} proved that consistent dedication and honest labor can weather any economic storm.`
            ]);
        }
    } else {
        // STRICT GUARDRAIL FOR UNEMPLOYED: No fake job titles, no "honest labor"
        sentence2 = pick([
            `Holding a deep philosophical conviction that life was far too brief to spend inside an office cubicle, ${name} artfully evaded traditional employment for the vast majority of ${pronouns.pos} adult years.`,
            `A certified master of energy conservation, ${pronouns.sub} lived life entirely on ${pronouns.pos} own clock, treating corporate ladders and 9-to-5 alarms with profound suspicion.`,
            `Unbothered by resumes or workplace dress codes, ${pronouns.sub} spent ${age} colorful years living strictly on ${pronouns.pos} own terms, proving that a schedule-free existence is its own reward.`,
            `Blessed with a carefree disposition, ${name} gracefully sidestepped the workforce, prioritizing afternoon naps, personal leisure, and freedom from supervisors.`
        ]);
    }

    // =========================================================================
    // MOVEMENT 3: FAMILY, ROMANCE, CHILDREN & RIVALS (Named Specifics)
    // =========================================================================
    let sentence3 = '';

    // Dynamic social sub-clause
    let socialExtra = '';
    if (bestFriendName && archEnemyName) {
        socialExtra = `, while always sharing close counsel with best friend ${bestFriendName} and fiercely warding off ${pronouns.pos} sworn rival, ${archEnemyName}`;
    } else if (bestFriendName) {
        socialExtra = `, while sharing life's closest confidences with best friend ${bestFriendName}`;
    } else if (archEnemyName) {
        socialExtra = `, while keeping a watchful eye on bitter adversary ${archEnemyName}`;
    }

    if (divorcesCount >= 2 || marriagesCount >= 3) {
        sentence3 = pick([
            `Romantically, ${pronouns.pos} life resembled a high-stakes melodrama, weathering ${divorcesCount} tempestuous divorces while keeping local family attorneys gainfully employed for decades${socialExtra}.`,
            `A hopeless romantic who never learned from past heartbreaks, ${pronouns.sub} marched down the aisle ${marriagesCount} separate times, leaving behind bewildered ex-spouses and unforgettable holiday dinners${socialExtra}.`,
            `Navigating love with grand romantic gestures and questionable judgment, ${name} cycled through ${divorcesCount} turbulent divorces and whirlwind courtships${socialExtra}.`
        ]);
    } else if (hasSpouse && spouseName && childrenCount >= 1) {
        const namedKids = childrenNames.slice(0, 2).join(' and ');
        const kidsSuffix = childrenCount > 2 ? ` and their siblings` : '';
        sentence3 = pick([
            `At home, ${pronouns.sub} shared life's journey with ${pronouns.pos} devoted spouse, ${spouseName}, together guiding ${childrenCount} children (${namedKids}${kidsSuffix}) through life's triumphs and kitchen chaos${socialExtra}.`,
            `Anchored by a lasting marriage to ${spouseName}, ${name} took immense pride in raising ${childrenCount} children (${namedKids}${kidsSuffix})${socialExtra}.`,
            `Domestic life with ${spouseName} remained ${pronouns.pos} emotional bedrock, as they navigated the joyful pandemonium of raising ${childrenCount} children together${socialExtra}.`
        ]);
    } else if (hasSpouse && spouseName) {
        sentence3 = pick([
            `At home, ${name} found enduring partnership alongside ${pronouns.pos} spouse, ${spouseName}${socialExtra}.`,
            `Blessed with lasting marital harmony, ${pronouns.sub} and ${spouseName} stood by each other through every chapter of life with humor and devotion${socialExtra}.`,
            `${pronouns.posCap} marriage to ${spouseName} remained a steadfast sanctuary, weathering life's storms with quiet trust and shared affection${socialExtra}.`
        ]);
    } else if (partnerName && childrenCount >= 1) {
        const namedKids = childrenNames.slice(0, 2).join(' and ');
        sentence3 = pick([
            `Alongside ${partnerName}, ${pronouns.sub} nurtured a loving household, raising ${childrenCount} children (${namedKids}) with unwavering care and affection${socialExtra}.`,
            `Sharing life with ${partnerName}, ${name} found true happiness in the full-contact sport of raising ${childrenCount} children (${namedKids})${socialExtra}.`
        ]);
    } else if (partnerName) {
        sentence3 = pick([
            `Outside of daily obligations, ${pronouns.pos} heart belonged to ${partnerName}, sharing an affectionate partnership filled with spontaneous adventures${socialExtra}.`,
            `In ${partnerName}, ${name} found a kindred spirit, enjoying companionship and warmth that brightened ${pronouns.pos} later years${socialExtra}.`
        ]);
    } else if (childrenCount >= 1) {
        const namedKids = childrenNames.slice(0, 2).join(' and ');
        const kidsSuffix = childrenCount > 2 ? ` and their siblings` : '';
        sentence3 = pick([
            `A fiercely devoted single parent, ${pronouns.sub} poured every ounce of energy into raising ${childrenCount} children (${namedKids}${kidsSuffix}), managing domestic chaos with endless patience and strong coffee${socialExtra}.`,
            `Family was ${pronouns.pos} true calling, dedicating decades to supporting ${childrenCount} children (${namedKids}${kidsSuffix}) with unconditional devotion${socialExtra}.`,
            `Surrounded by a bustling household of ${childrenCount} children (${namedKids}${kidsSuffix}), ${name} embraced the exhaustion of parenthood as life's greatest privilege${socialExtra}.`
        ]);
    } else if (bestFriendName && archEnemyName) {
        sentence3 = pick([
            `In social circles, ${pronouns.sub} leaned heavily on ${pronouns.pos} lifelong confidant, ${bestFriendName}, while fiercely trading insults and cold stares with ${pronouns.pos} sworn rival, ${archEnemyName}.`,
            `Never lacking in social drama, ${name} shared unforgettable escapades with best friend ${bestFriendName}, even while engaged in a petty, long-running feud with ${archEnemyName}.`,
            `While keeping ${bestFriendName} close as a trusted companion, ${pronouns.sub} kept ${pronouns.pos} bitter nemesis, ${archEnemyName}, permanently on ${pronouns.pos} radar.`
        ]);
    } else if (bestFriendName) {
        sentence3 = pick([
            `Valuing loyal camaraderie above all, ${name} shared life's most unforgettable adventures and weekend debriefs with lifelong best friend, ${bestFriendName}.`,
            `Through thick and thin, ${pronouns.sub} could always be found bantering with ${bestFriendName}, whose friendship remained an anchor across the years.`
        ]);
    } else {
        sentence3 = pick([
            `Fiercely protective of ${pronouns.pos} personal freedom, ${pronouns.sub} navigated adult life entirely unencumbered by domestic entanglements or marital negotiations.`,
            `Cherishing solitary quiet and independent routines, ${name} lived strictly by ${pronouns.pos} own rules, largely unbothered by societal pressure to settle down.`,
            `An unapologetic lone wolf, ${pronouns.sub} preferred the peaceful sanctuary of ${pronouns.pos} own company over the endless compromises of romantic life.`
        ]);
    }

    // =========================================================================
    // MOVEMENT 4: PASSIONS, ASSETS, INVESTMENTS, UNDERWORLD & VICES
    // =========================================================================
    let sentence4 = '';

    const hasInstruments = topInstruments.length > 0;
    const hasRealEstate = rentalPropertiesCount >= 2 || propertiesCount >= 3;

    if (inPrison) {
        const placeName = facilityName || 'the penitentiary';
        const matePhrase = cellmateName ? ` alongside cellmate ${cellmateName}` : '';
        sentence4 = pick([
            `Even behind the imposing razor wire of ${placeName}${matePhrase}, ${pronouns.sub} maintained a commanding presence across the yard, running cellblock chess matches and refusing to be intimidated.`,
            `Locked away in ${placeName} for ${prisonYears > 0 ? `${prisonYears} years` : 'a lengthy sentence'}, ${pronouns.sub} earned the grudging respect of correctional officers and fellow inmates alike.`,
            `Serving hard time in ${placeName}${matePhrase}, ${name} treated incarceration as an endurance test, preserving ${pronouns.pos} dignity against overwhelming odds.`
        ]);
    } else if (crimesCommitted >= 3 || bankHeists > 0 || profile.murders > 0) {
        const heistPhrase = bankHeists > 0 ? `including ${bankHeists} audacious bank heist${bankHeists > 1 ? 's' : ''}` : 'including high-stakes illicit enterprises';
        sentence4 = pick([
            `Between daring underworld heists (${heistPhrase}) and narrow getaways from local detectives, ${pronouns.pos} criminal escapades provided precinct officers with stories they will recount for the rest of their careers.`,
            `Treating the penal code as a polite list of recommendations, ${pronouns.sub} racked up ${crimesCommitted} felony escapades, living life with the swagger of a vintage outlaw.`,
            `When not plotting high-risk scores or evading squad cars through ${city}, ${name} boasted about criminal capers that grew more legendary with every telling.`
        ]);
    } else if (hasInstruments && hasRealEstate) {
        const inst = topInstruments[0];
        const topPropText = topPropertyName ? `, including the prized ${topPropertyName},` : '';
        sentence4 = pick([
            `Away from the daily grind, ${name} was an impassioned musician who mastered the ${inst.name.toLowerCase()}, while also building a formidable portfolio of ${propertiesCount} real estate properties${topPropText} collecting rent with clockwork precision.`,
            `Pairing artistic soul with sharp financial acumen, ${pronouns.sub} spent peaceful hours at the ${inst.name.toLowerCase()} while quietly acquiring ${propertiesCount} real estate properties${topPropText} across the region.`,
            `When not practicing the ${inst.name.toLowerCase()}, ${name} commanded an impressive property portfolio of ${propertiesCount} real estate holdings${topPropText} managed with meticulous care.`
        ]);
    } else if (hasInstruments) {
        const inst = topInstruments[0];
        sentence4 = pick([
            `Away from the daily grind, ${name} was an impassioned musician, spending countless hours mastering the ${inst.name.toLowerCase()} and enchanting friends with soulful performances.`,
            `When words fell short, ${pronouns.sub} poured heart and soul into the ${inst.name.toLowerCase()}, demonstrating an artistic dedication that brought profound peace to ${pronouns.pos} life.`,
            `Music remained ${pronouns.pos} true creative sanctuary, as ${pronouns.pos} dedication to the ${inst.name.toLowerCase()} proved that discipline and passion can create pure magic.`
        ]);
    } else if (certifiedSkills.length > 0) {
        const cert = certifiedSkills[0];
        sentence4 = pick([
            `A lifelong believer in self-discipline, ${name} achieved distinguished recognition by earning certification as a ${cert.certificateTitle}.`,
            `Demonstrating relentless dedication to self-improvement, ${pronouns.sub} mastered rigorous coursework to qualify as a certified ${cert.name} specialist.`,
            `Driven by personal excellence, ${pronouns.sub} poured disciplined hours into becoming a ${cert.certificateTitle}, wearing the credential with quiet pride.`
        ]);
    } else if (hasRealEstate) {
        const topPropText = topPropertyName ? `, including the prized ${topPropertyName},` : '';
        sentence4 = pick([
            `A shrewd operator in the property market, ${name} built a formidable portfolio of ${propertiesCount} real estate holdings${topPropText} collecting rent with clockwork precision.`,
            `With a sharp eye for land and equity, ${pronouns.sub} amassed ${propertiesCount} residential properties across the region, establishing ${pronouns.ref} as a bonafide real estate baron.`,
            `Channeling surplus capital into bricks and mortar, ${pronouns.sub} commanded an enviable property empire${topPropText} treating property management as a fine art.`
        ]);
    } else if (stockPortfolioValue >= 500000) {
        sentence4 = pick([
            `Armed with nerves of steel and diamond hands, ${name} navigated the financial markets with aplomb, amassing a ${formatMoneyCompact(stockPortfolioValue)} stock portfolio across volatile trading cycles.`,
            `Glued to candlestick charts and financial market tickers, ${pronouns.sub} parlayed shrewd investments into a market portfolio worth ${formatMoneyCompact(stockPortfolioValue)}.`,
            `Recognized by friends as a market wizard, ${pronouns.sub} out-maneuvered index fluctuations to accumulate a ${formatMoneyCompact(stockPortfolioValue)} nest egg on the exchanges.`
        ]);
    } else if (plasticSurgeries >= 2) {
        sentence4 = pick([
            `Dedicated to outsmarting Father Time through ${plasticSurgeries} discreet cosmetic enhancements, ${name} possessed an impossibly smooth complexion that remained recognizable from three blocks away.`,
            `Treating cosmetic innovation as an essential lifestyle accessory, ${pronouns.sub} invested heavily in ${plasticSurgeries} aesthetic procedures, never once encountering a mirror ${pronouns.sub} didn't admire.`,
            `A living monument to aesthetic science, ${pronouns.sub} baffled neighbors by greeting each passing decade looking mysteriously younger than the last.`
        ]);
    } else if (lotteryWins > 0 || casinoWins > 0) {
        sentence4 = pick([
            `Possessing an unshakeable belief that lightning could indeed strike twice, ${name} frequented the high-roller tables and lottery counters, savoring the adrenaline of unforgettable jackpot wins.`,
            `A true gambler at heart, ${pronouns.sub} lived for the intoxicating thrill of casino green felt and lottery jackpots, forever convinced that the next big score was one bet away.`,
            `Armed with perpetual optimism and lucky lottery tickets, ${pronouns.sub} celebrated memorable casino triumphs that enriched ${pronouns.pos} colorful reputation.`
        ]);
    } else if (wealthTier === 'debt') {
        sentence4 = pick([
            `Despite an unbroken streak of catastrophic financial gambles and aggressive letters from debt collectors, ${name} remained cheerfully convinced that economic triumph was just around the corner.`,
            `Living life on borrowed funds and borrowed time, ${pronouns.sub} successfully outran collection agencies for decades, treating maximum credit balances as a badge of honor.`,
            `Having accumulated zero notable savings and an impressive ${debtStr} in unpaid credit, ${pronouns.pos} proudest financial achievement was securing free refills at the local diner.`
        ]);
    } else if (topVehicleName) {
        sentence4 = pick([
            `${pronouns.posCap} prized pride and joy remained ${pronouns.pos} beloved ${topVehicleName}, maintained with obsessive detail and driven with unmistakable swagger through the avenues of ${city}.`,
            `Few sights in ${city} were more iconic than ${name} cruising the boulevards behind the wheel of ${pronouns.pos} cherished ${topVehicleName}.`,
            `When leisure called, ${pronouns.sub} was happiest tuning the engine and polishing the chrome of ${pronouns.pos} ${topVehicleName}.`
        ]);
    } else {
        sentence4 = pick([
            `A creature of comfort who savored life's simpler pleasures, ${name} found genuine contentment in quiet weekend routines, neighborhood coffee, and a cozy nest egg of ${wealthStr}.`,
            `Dependable, unpretentious, and stubbornly opinionated on municipal traffic, ${pronouns.sub} quietly built a life of modest comfort and an estate of ${wealthStr}.`,
            `Known throughout ${city} as a steadfast creature of habit, ${pronouns.sub} managed ${pronouns.pos} personal affairs with steady hands, a warm hearth, and an estate worth ${wealthStr}.`
        ]);
    }

    // =========================================================================
    // MOVEMENT 5: FATAL DEMISE & ESTATE LEGACY (1 sentence)
    // =========================================================================
    const isOldAge = causePhrase.toLowerCase().includes('old age') || causePhrase.toLowerCase().includes('natural causes');
    const isAbsurdOrAccident = causePhrase.toLowerCase().includes('accident') || 
                               causePhrase.toLowerCase().includes('struck') || 
                               causePhrase.toLowerCase().includes('attack') || 
                               causePhrase.toLowerCase().includes('choked') || 
                               causePhrase.toLowerCase().includes('crash') || 
                               causePhrase.toLowerCase().includes('fall') || 
                               causePhrase.toLowerCase().includes('mishap') || 
                               causePhrase.toLowerCase().includes('explosion');

    let sentence5 = '';

    if (wealthTier === 'debt') {
        sentence5 = pick([
            `${pronouns.posCap} journey officially concluded at age ${age} from ${causePhrase}, successfully bequeathing zero dollars and leaving a mountain of unpaid bills for the banks to absorb.`,
            `${pronouns.subCap} passed away at age ${age} following ${causePhrase}, leaving behind fond memories, an empty safe, and a sternly worded final notice from credit card companies.`
        ]);
    } else if (isOldAge) {
        sentence5 = pick([
            `After outliving doctors, personal adversaries, and multiple appliance warranties, ${pronouns.sub} passed away peacefully at age ${age} from natural causes, leaving an estate of ${wealthStr} and taking several juicy family secrets to the grave.`,
            `Concluding an eventful run of ${age} years, ${pronouns.sub} departed peacefully from natural causes, leaving an estate of ${wealthStr} and surviving family members who will fondly retell ${pronouns.pos} legend for generations.`,
            `Passing away peacefully at the ripe age of ${age}, ${pronouns.sub} concluded a long, storied life, bequeathing a ${wealthStr} estate to heirs who are already consulting their accountants.`
        ]);
    } else if (isAbsurdOrAccident) {
        sentence5 = pick([
            `${pronouns.posCap} wild adventure came to an abrupt close at age ${age} following ${causePhrase}, a bizarre turn of events that coroner reports dryly classified as 'entirely preventable'.`,
            `${pronouns.subCap} met an untimely demise at age ${age} after ${causePhrase}, bequeathing a ${wealthStr} estate and leaving first responders with an incident report they will quote for the rest of their careers.`,
            `${pronouns.posCap} colorful life concluded at age ${age} from ${causePhrase}, proving once and for all that supreme self-confidence is no substitute for basic survival instincts.`
        ]);
    } else if (wealthTier === 'tycoon' || wealthTier === 'multimillionaire') {
        sentence5 = pick([
            `${pronouns.posCap} high-powered reign ended at age ${age} following ${causePhrase}, leaving behind an immense fortune of ${wealthStr} and heirs who will never have to work an honest day in their lives.`,
            `${pronouns.subCap} departed this world at age ${age} from ${causePhrase}, leaving a towering ${wealthStr} estate and a corporate legacy that will dominate boardroom discussions for decades.`
        ]);
    } else {
        sentence5 = pick([
            `Despite putting up a stubborn fight against ${causePhrase}, ${name} passed away at age ${age}, leaving behind an estate of ${wealthStr}, warm memories, and strict instructions forbidding anyone from touching the thermostat.`,
            `${pronouns.subCap} departed this life at age ${age} following complications from ${causePhrase}, lovingly remembered by friends and heirs as an unforgettable original who left behind ${wealthStr}.`,
            `${pronouns.posCap} chapter closed at age ${age} after ${causePhrase}, leaving behind a tidy estate of ${wealthStr}, enduring affection, and stories that will be retold with smiles for years to come.`
        ]);
    }

    // Assemble exactly 4 to 6 complete sentences (typically 5)
    const sentences = [sentence1, sentence2, sentence3, sentence4, sentence5]
        .map(s => (s || '').trim())
        .filter(s => s.length > 0);

    return sentences.join(' ');
}

export const EulogyGenerator = {
    generate: generateProceduralEulogy,
    harvestLifeProfile,
    classifyArchetype
};
