/**
 * Procedural Eulogy Generator Engine (Zero-AI Architecture)
 * 
 * Crafts dynamic, humorous, context-aware 3-sentence life summaries
 * based on character stats, career, education, wealth, romance, crimes,
 * lifeLog events, and cause of death.
 */

// Simple 32-bit integer hash function
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

    // Pronouns
    let pronouns = {
        sub: 'he',
        subCap: 'He',
        obj: 'him',
        pos: 'his',
        posCap: 'His',
        ref: 'himself'
    };
    if (gender === 'female') {
        pronouns = {
            sub: 'she',
            subCap: 'She',
            obj: 'her',
            pos: 'her',
            posCap: 'Her',
            ref: 'herself'
        };
    } else if (gender === 'non-binary' || gender === 'other') {
        pronouns = {
            sub: 'they',
            subCap: 'They',
            obj: 'them',
            pos: 'their',
            posCap: 'Their',
            ref: 'themselves'
        };
    }

    // Estate calculation
    const assetValue = Array.isArray(user.assets) ? user.assets.reduce((sum, a) => sum + (a.value || 0), 0) : 0;
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
    const friends = relationships.filter(r => r.category === 'friend' || r.type === 'Friend' || r.type === 'Best Friend');
    const pets = relationships.filter(r => r.category === 'pet' || ['Dog', 'Cat', 'Bird', 'Horse'].includes(r.type));

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
                if (txt.includes('medical school') || txt.includes('law school') || txt.includes('business school') || txt.includes('ph.d')) gradDegree = true;
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
        hasBusiness: Boolean(user.hasBusiness),
        businessName: user.business?.name || null,
        childrenCount: children.length,
        hasSpouse: Boolean(spouse),
        spouseName: spouse ? spouse.name : null,
        friendsCount: friends.length,
        petsCount: pets.length,
        marriagesCount,
        divorcesCount,
        cheatedCount,
        inPrison,
        prisonYears,
        crimesCommitted,
        prisonEscapes,
        plasticSurgeries,
        lotteryWins,
        casinoWins,
        droppedOut,
        collegeDegree,
        gradDegree,
        looks: typeof user.looks === 'number' ? user.looks : 50,
        smarts: typeof user.smarts === 'number' ? user.smarts : 50,
        happiness: typeof user.happiness === 'number' ? user.happiness : 50
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
    // Remove "from " or "of " prefixes if existing
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
 * Main procedural generator
 */
export function generateProceduralEulogy(user, lifeLog = [], cause = null) {
    const profile = harvestLifeProfile(user, lifeLog, cause);
    const archetype = classifyArchetype(profile);

    // Seeded determinism: consistent for the same character name, age, cause, and estate
    const seedString = `${profile.name}_${profile.age}_${profile.deathCause}_${profile.totalEstate}_${profile.city}`;
    const rng = createPRNG(hashString(seedString));

    const pick = (arr) => arr[Math.floor(rng() * arr.length)];

    const {
        name, age, gender, city, country, pronouns, totalEstate,
        wealthTier, jobTitle, careerTrack, hasBusiness, businessName,
        childrenCount, hasSpouse, spouseName, friendsCount, petsCount,
        marriagesCount, divorcesCount, cheatedCount, inPrison,
        prisonYears, crimesCommitted, prisonEscapes, plasticSurgeries,
        lotteryWins, casinoWins, droppedOut, collegeDegree, gradDegree,
        looks, smarts, happiness
    } = profile;

    const causePhrase = cleanCausePhrase(profile.deathCause);
    const jobWithArt = getJobWithArticle(jobTitle);
    const wealthStr = formatMoneyCompact(totalEstate);
    const debtStr = formatMoneyCompact(Math.abs(totalEstate));

    let sentence1 = '';
    let sentence2 = '';
    let sentence3 = '';

    // ==========================================
    // SENTENCE 1: Identity, Origin & Career Arc
    // ==========================================
    if (archetype === 'INNOCENT_YOUTH') {
        const youthOpeners = [
            `Though their time in ${city} was cut heartbreakingly short at age ${age}, ${name} brought boundless joy, pure curiosity, and a mischievous spark to everyone around ${pronouns.obj}.`,
            `Growing up in ${city}, ${name} was celebrated by family and school friends for a bright imagination and a world-class talent for playground adventures.`,
            `${name} lived a vibrant ${age} years in ${country}, distinguished by a love for discovery, boundless energy, and an uncanny ability to avoid bedtime.`
        ];
        sentence1 = pick(youthOpeners);
    } else if (archetype === 'CAREER_CRIMINAL') {
        const criminalOpeners = [
            `From an early age in ${city}, ${name} possessed a profound allergy to authority, embarking on a turbulent life of illicit schemes and high-stakes chaos.`,
            `Regarded by local police in ${city} as an incurable nuisance, ${name} spent most of ${pronouns.pos} adult years treating the penal code as a set of loose suggestions.`,
            `Born with a silver tongue and questionable morals in ${country}, ${name} carved out a notorious reputation as a master of ill-advised criminal enterprises.`
        ];
        sentence1 = pick(criminalOpeners);
    } else if (archetype === 'CORPORATE_TYCOON') {
        const tycoonRole = jobWithArt || 'a high-flying executive';
        const tycoonOpeners = [
            `Born in ${city} with boundless ambition and an unyielding ego, ${name} climbed from modest beginnings to become ${tycoonRole}, rarely letting ethics stand in the way of a profit.`,
            `Armed with fierce business acumen and a cutthroat work ethic, ${name} established ${pronouns.ref} as a dominant titan across the commercial landscape of ${country}.`,
            `From humble origins in ${city}, ${name} spent decades conquering boardrooms and building a formidable commercial empire as ${tycoonRole}.`
        ];
        sentence1 = pick(tycoonOpeners);
    } else if (archetype === 'SCHOLAR_PROFESSIONAL') {
        const scholarRole = jobWithArt || 'a dedicated scholar';
        const scholarOpeners = [
            `Educated in ${city} and armed with formidable intellect, ${name} dedicated ${pronouns.pos} life to a prestigious career as ${scholarRole}.`,
            `A consummate intellectual with a penchant for perfection, ${name} spent decades establishing an impeccable reputation throughout ${country} as ${scholarRole}.`,
            `Born with sharp wits and quiet resolve in ${city}, ${name} navigated a distinguished career as ${scholarRole}, earning widespread respect among peers.`
        ];
        sentence1 = pick(scholarOpeners);
    } else if (archetype === 'VAIN_SOCIALITE') {
        const vainOpeners = [
            `Blessed with devastating good looks and a credit card that never rested, ${name} spent ${age} years in ${city} perfecting the art of making an entrance.`,
            `A walking monument to cosmetic innovation in ${country}, ${name} dedicated ${pronouns.pos} ${age} years to proving that beauty is, in fact, purchasable.`,
            `Born in ${city} with acceptable looks and an unacceptable level of vanity, ${name} spent decades and a small fortune transforming ${pronouns.ref} into a local icon of self-improvement.`
        ];
        sentence1 = pick(vainOpeners);
    } else if (archetype === 'DEVOTED_FAMILY') {
        if (jobTitle) {
            const familyJobOpeners = [
                `A pillar of domestic stability in ${city}, ${name} balanced a career as ${jobWithArt} with the Herculean task of raising ${childrenCount} children and keeping the peace at home.`,
                `Born in ${country} with a gift for multitasking, ${name} spent ${age} years juggling ${pronouns.pos} duties as ${jobWithArt} with an ever-expanding household.`,
                `${name} lived ${age} devoted years in ${city}, splitting ${pronouns.pos} time between an honest career as ${jobWithArt} and the full-contact sport of family management.`
            ];
            sentence1 = pick(familyJobOpeners);
        } else {
            const familyNoJobOpeners = [
                `A pillar of domestic stability in ${city}, ${name} spent ${age} years as a full-time parent, managing ${childrenCount} children with the efficiency of a seasoned logistics coordinator.`,
                `Born in ${country} with boundless patience and a gift for conflict resolution, ${name} dedicated ${pronouns.pos} entire adult life to the noble and exhausting pursuit of raising a family.`,
                `${name} spent ${age} devoted years in ${city}, treating full-time parenthood as the most demanding unpaid job in ${country}.`
            ];
            sentence1 = pick(familyNoJobOpeners);
        }
    } else if (archetype === 'LOVABLE_SLACKER' || !jobTitle) {
        const slackerOpeners = [
            `${name} lived a remarkably unhurried ${age} years in ${city}, primarily distinguished by decades of successfully avoiding full-time employment and napping through major world events.`,
            `A certified master of energy conservation, ${name} dedicated ${pronouns.pos} adult life in ${country} to doing as little as humanly possible.`,
            `Born in ${city}, ${name} treated ambition with deep suspicion, gracefully evading the traditional workforce for the vast majority of ${pronouns.pos} days.`,
            `A lifelong fixture of ${city}, ${name} spent ${age} colorful years living entirely on ${pronouns.pos} own terms, largely unbothered by the concept of an alarm clock or an actual job.`
        ];
        sentence1 = pick(slackerOpeners);
    } else if (archetype === 'BROKE_DREAMER') {
        if (jobTitle) {
            const brokeJobOpeners = [
                `Born in ${city}, ${name} spent ${age} turbulent years pursuing get-rich-quick schemes while holding down a day job as ${jobWithArt}.`,
                `Armed with boundless financial optimism and questionable judgment, ${name} navigated life in ${country} as ${jobWithArt} with an eye always on the next big score.`,
                `From humble beginnings in ${city}, ${name} balanced a career as ${jobWithArt} with a relentless streak of catastrophic financial gambles.`
            ];
            sentence1 = pick(brokeJobOpeners);
        } else {
            const brokeNoJobOpeners = [
                `Born in ${city}, ${name} spent ${age} turbulent years pursuing get-rich-quick schemes and living on credit while successfully evading the traditional workforce.`,
                `A lifelong financial optimist in ${country}, ${name} navigated ${age} colorful years chasing elusive windfalls without ever holding down a steady job.`,
                `${name} spent an eventful ${age} years in ${city}, mastering the art of living beyond ${pronouns.pos} means and treating the traditional 9-to-5 with deep suspicion.`
            ];
            sentence1 = pick(brokeNoJobOpeners);
        }
    } else if (archetype === 'SERIAL_ROMANTIC') {
        if (jobTitle) {
            const romanticJobOpeners = [
                `Blessed with magnetic charm and an appetite for romantic chaos, ${name} navigated life in ${country} as ${jobWithArt} who could never quite stay single.`,
                `A hopeless romantic with a disastrous track record in ${city}, ${name} spent ${pronouns.pos} adult years as ${jobWithArt} in perpetual pursuit of matrimonial drama.`,
                `From ${pronouns.pos} youth in ${city}, ${name} balanced a career as ${jobWithArt} with whirlwind romances and swift domestic upheavals.`
            ];
            sentence1 = pick(romanticJobOpeners);
        } else {
            const romanticNoJobOpeners = [
                `Blessed with magnetic charm and an appetite for romantic chaos, ${name} spent ${age} years in ${country} treating whirlwind romance as ${pronouns.pos} primary full-time occupation.`,
                `A hopeless romantic with a disastrous track record in ${city}, ${name} dedicated ${pronouns.pos} adult life to the perpetual pursuit of true love, passion, and matrimonial drama.`,
                `From ${pronouns.pos} youth in ${city}, ${name} treated relationships like disposable cameras, gracefully bypassing the workforce to focus entirely on romantic upheaval.`
            ];
            sentence1 = pick(romanticNoJobOpeners);
        }
    } else {
        // ORDINARY_CITIZEN
        if (jobTitle) {
            const standardOpeners = [
                `Born in ${city}, ${name} carved out a hardworking, eventful life as ${jobWithArt}, navigating the ups and downs of ${country} with dry wit and resilience.`,
                `A lifelong fixture of ${city}, ${name} lived a full ${age} years defined by steady dedication to honest labor as ${jobWithArt}.`,
                `${name} spent ${age} colorful years in ${country}, balancing the daily grind as ${jobWithArt} with an unshakeable determination to do things ${pronouns.pos} own way.`
            ];
            sentence1 = pick(standardOpeners);
        } else {
            const noJobOpeners = [
                `Born in ${city}, ${name} carved out an eventful ${age} years in ${country}, living life entirely on ${pronouns.pos} own terms without the burden of a traditional 9-to-5.`,
                `A lifelong fixture of ${city}, ${name} lived a full ${age} years largely unbothered by the daily stresses of full-time employment.`,
                `${name} spent ${age} colorful years in ${country}, embracing a carefree lifestyle of personal leisure, casual hobbies, and an allergic reaction to alarm clocks.`
            ];
            sentence1 = pick(noJobOpeners);
        }
    }

    // ==========================================
    // SENTENCE 2: Relationships, Wealth & Vices
    // ==========================================
    if (archetype === 'INNOCENT_YOUTH') {
        const youthMiddles = [
            `Known for an uncanny ability to lose homework and a passionate dedication to snacks, ${pronouns.sub} filled the household with unforgettable laughter and warmth.`,
            `Whether organizing neighborhood games or championing playground justice, ${pronouns.sub} possessed a rare gift for turning ordinary days into joyful celebrations.`,
            `Surrounded by loving family and devoted friends, ${pronouns.pos} infectious smile and generous spirit left an indelible mark on everyone who crossed ${pronouns.pos} path.`
        ];
        sentence2 = pick(youthMiddles);
    } else if (archetype === 'CAREER_CRIMINAL') {
        const yearsText = prisonYears > 0 ? `${prisonYears} years` : 'substantial time';
        const criminalMiddles = [
            `Despite serving ${yearsText} behind bars, ${pronouns.sub} remained surprisingly popular in the cellblock for running an illicit canteen gambling ring and brewing passable prison wine.`,
            `Between multiple high-speed police chases and endless court appearances, ${pronouns.sub} managed to accumulate ${crimesCommitted > 0 ? crimesCommitted : 'numerous'} felony charges and the begrudging respect of local correctional officers.`,
            `When not plotting ill-advised heists or dodging parole officers, ${pronouns.sub} spent ${pronouns.pos} free time boasting about scores that were vastly exaggerated.`
        ];
        sentence2 = pick(criminalMiddles);
    } else if (archetype === 'SERIAL_ROMANTIC') {
        const divorcesText = divorcesCount > 1 ? `${divorcesCount} contentious divorces` : 'tumultuous breakups';
        const romanticMiddles = [
            `Between ${divorcesText} and an endless parade of whirlwind engagements, ${pronouns.sub} kept local family law attorneys gainfully employed while managing an estate of ${wealthStr}.`,
            `Never one to let past heartbreaks dampen ${pronouns.pos} optimism, ${pronouns.sub} cycled through ${marriagesCount > 1 ? marriagesCount : 'multiple'} marriages, leaving behind a trail of bewildered ex-spouses and heated dinner table arguments.`,
            `Armed with grand romantic gestures and questionable judgment, ${pronouns.sub} spent ${pronouns.pos} prime years bouncing between fiery courtships and dramatic custody hearings.`
        ];
        sentence2 = pick(romanticMiddles);
    } else if (archetype === 'DEVOTED_FAMILY' || childrenCount >= 3) {
        const familyMiddles = [
            `A devoted parent to ${childrenCount} children, ${pronouns.sub} managed household pandemonium with military discipline, copious amounts of coffee, and notoriously passive-aggressive holiday cards.`,
            `Surrounded by a bustling clan of ${childrenCount} children, ${pronouns.sub} took immense pride in family gatherings, freely dispensing unsolicited life advice and managing a tidy estate of ${wealthStr}.`,
            `Balancing domestic chaos with infinite patience, ${pronouns.sub} raised ${childrenCount} children while maintaining a spotless reputation and a pantry stocked for any crisis.`
        ];
        sentence2 = pick(familyMiddles);
    } else if (wealthTier === 'tycoon' || wealthTier === 'multimillionaire') {
        const tycoonMiddles = [
            `When not hoarding an impressive fortune of ${wealthStr}, ${pronouns.sub} spent ${pronouns.pos} leisure hours collecting luxury toys, alienating distant relatives, and aggressively evading tax inspectors.`,
            `Having accumulated an empire worth ${wealthStr} and a garage full of exotic sports cars, ${pronouns.sub} lived strictly by the principle that money can indeed buy happiness.`,
            `Between hostile corporate takeovers and lavish vacations to private islands, ${pronouns.sub} successfully amassed ${wealthStr} while rarely answering phone calls from extended family.`
        ];
        sentence2 = pick(tycoonMiddles);
    } else if (wealthTier === 'debt') {
        const debtMiddles = [
            `Having accumulated zero notable savings and an impressive ${debtStr} in unpaid credit debt, ${pronouns.pos} proudest financial milestone was winning a free coffee on a scratch-off ticket in 2035.`,
            `Despite an unbroken streak of disastrous financial gambles and aggressive letters from debt collectors, ${pronouns.sub} remained cheerfully convinced that economic triumph was just around the corner.`,
            `Living life on borrowed time and borrowed money, ${pronouns.sub} successfully outran collection agencies for decades while leaving behind ${debtStr} in unpaid balances.`
        ];
        sentence2 = pick(debtMiddles);
    } else if (plasticSurgeries >= 2) {
        const vainMiddles = [
            `Dedicated to freezing the aging process through ${plasticSurgeries} dubious cosmetic upgrades, ${pronouns.sub} remained recognizable from three blocks away and never met a mirror ${pronouns.sub} didn't like.`,
            `Spurred by vanity and generous disposable income, ${pronouns.sub} invested heavily in cosmetic enhancements, baffling neighbors with a complexion that grew younger by the year.`
        ];
        sentence2 = pick(vainMiddles);
    } else if (archetype === 'BROKE_DREAMER') {
        const dreamerMiddles = [
            `Fueled by an unshakeable belief in long-shot odds, ${pronouns.sub} invested ${pronouns.pos} limited resources into lottery tickets, casino tabs, and get-rich-quick schemes that enriched absolutely no one.`,
            `Despite decades of catastrophic financial experiments and motivational podcast binges, ${pronouns.sub} maintained a remarkably cheerful conviction that the big break was always just one scratch-off ticket away.`,
            `Between maxed-out credit cards and a rotating cast of dubious investment opportunities, ${pronouns.sub} managed to turn financial instability into an enduring lifestyle brand.`
        ];
        sentence2 = pick(dreamerMiddles);
    } else {
        // Standard life middle
        const standardMiddles = [
            `Known throughout ${city} as a passionate creature of habit, ${pronouns.sub} harbored stubborn opinions on local traffic, a beloved pet, and an estate worth ${wealthStr}.`,
            `A dependable figure who cherished simple weekend routines, ${pronouns.sub} quietly built a life of modest comfort and an estate of ${wealthStr}.`,
            `Whether complaining about municipal taxes or hosting lively backyard barbecues, ${pronouns.sub} managed ${pronouns.pos} affairs with steady hands and a stubborn refusal to read instruction manuals.`
        ];
        sentence2 = pick(standardMiddles);
    }

    // ==========================================
    // SENTENCE 3: Fatal Demise & Parting Legacy
    // ==========================================
    const isOldAge = causePhrase.toLowerCase().includes('old age') || causePhrase.toLowerCase().includes('natural causes');
    const isAbsurdOrAccident = causePhrase.toLowerCase().includes('accident') || 
                               causePhrase.toLowerCase().includes('struck') || 
                               causePhrase.toLowerCase().includes('attack') || 
                               causePhrase.toLowerCase().includes('choked') || 
                               causePhrase.toLowerCase().includes('crash') || 
                               causePhrase.toLowerCase().includes('fall') || 
                               causePhrase.toLowerCase().includes('mishap') || 
                               causePhrase.toLowerCase().includes('explosion');

    if (archetype === 'INNOCENT_YOUTH') {
        const youthClosers = [
            `${pronouns.posCap} journey ended far too soon following ${causePhrase}, leaving behind heartbroken family and friends who will forever treasure every precious memory.`,
            `Surviving family members and classmates will forever remember ${pronouns.pos} bright light, gentle spirit, and unforgettable smile.`,
            `Departing this world at age ${age} due to ${causePhrase}, ${pronouns.sub} leaves behind a legacy of pure joy and unconditional love in the hearts of all who knew ${pronouns.obj}.`
        ];
        sentence3 = pick(youthClosers);
    } else if (isAbsurdOrAccident) {
        const accidentClosers = [
            `${pronouns.posCap} wild journey finally came to an abrupt end at age ${age} after ${causePhrase}, proving once and for all that supreme confidence is no substitute for basic survival instincts.`,
            `${pronouns.subCap} met an untimely demise at age ${age} from ${causePhrase}, providing local first responders with an incident report they will be quoting for the rest of their careers.`,
            `${pronouns.posCap} colorful life concluded at age ${age} after ${causePhrase}, a bizarre turn of events that coroner reports dryly classified as 'entirely preventable'.`
        ];
        sentence3 = pick(accidentClosers);
    } else if (isOldAge) {
        const oldAgeClosers = [
            `After outliving ${pronouns.pos} doctors, personal rivals, and several household appliance warranties, ${pronouns.sub} peacefully succumbed to old age at ${age}, taking several juicy family secrets to the grave.`,
            `${pronouns.subCap} passed away peacefully at the ripe age of ${age}, having successfully outlasted every single person who ever doubted ${pronouns.obj}.`,
            `Concluding a long and storied run at age ${age} from natural causes, ${pronouns.sub} leaves behind a memorable legacy and heirs who will spend months squabbling over the will.`
        ];
        sentence3 = pick(oldAgeClosers);
    } else if (wealthTier === 'debt') {
        const debtClosers = [
            `${pronouns.subCap} departed this world at age ${age} from ${causePhrase}, successfully bequeathing zero dollars and a mountain of unpaid bills for the banks to absorb.`,
            `${pronouns.subCap} passed away at age ${age} after ${causePhrase}, leaving surviving relatives with warm memories and a sternly worded final notice from the tax authorities.`
        ];
        sentence3 = pick(debtClosers);
    } else if (wealthTier === 'tycoon' || wealthTier === 'multimillionaire') {
        const tycoonClosers = [
            `${pronouns.posCap} high-powered reign came to an end at age ${age} following ${causePhrase}, leaving behind a fortune of ${wealthStr} and heirs who are already dialing their probate attorneys.`,
            `${pronouns.subCap} met ${pronouns.pos} end at age ${age} from ${causePhrase}, ensuring that surviving family members will never have to work an honest day in their lives.`
        ];
        sentence3 = pick(tycoonClosers);
    } else if (inPrison) {
        const prisonClosers = [
            `${pronouns.subCap} met ${pronouns.pos} demise at age ${age} from ${causePhrase}, finally securing the permanent release that state parole boards had repeatedly denied.`,
            `${pronouns.posCap} sentence officially concluded at age ${age} after ${causePhrase}, closing the book on one of the prison's most notoriously stubborn residents.`
        ];
        sentence3 = pick(prisonClosers);
    } else {
        // Standard medical or illness
        const standardClosers = [
            `Despite putting up a stubborn fight against ${causePhrase}, ${pronouns.sub} finally passed away at age ${age}, strictly instructing surviving relatives not to touch the thermostat.`,
            `${pronouns.subCap} passed away at age ${age} following complications from ${causePhrase}, remembered by close friends as a resilient soul with a razor-sharp sense of humor.`,
            `${pronouns.posCap} chapter closed at age ${age} after ${causePhrase}, leaving behind fond memories, a tidy home, and a legacy that will be warmly recounted for generations.`
        ];
        sentence3 = pick(standardClosers);
    }

    // Assemble exactly 3 complete sentences
    const cleanS1 = sentence1.trim();
    const cleanS2 = sentence2.trim();
    const cleanS3 = sentence3.trim();

    return `${cleanS1} ${cleanS2} ${cleanS3}`;
}

export const EulogyGenerator = {
    generate: generateProceduralEulogy,
    harvestLifeProfile,
    classifyArchetype
};
