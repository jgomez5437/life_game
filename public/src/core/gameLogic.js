/**
 * Master Game Logic Barrel
 *
 * Re-exports all domain logic modules from `./logic/` and assembles the
 * backward-compatible `GameLogic` namespace object.
 *
 * For AI agents & developers: prefer reading/editing the specific domain module
 * under `public/src/core/logic/` rather than this barrel. See `AGENTS.md`.
 */

import * as playerStats from './logic/playerStatsLogic.js';
import * as educationSkills from './logic/educationSkillsLogic.js';
import * as vehiclesJewelry from './logic/vehiclesJewelryLogic.js';
import * as healthMortality from './logic/healthMortalityLogic.js';
import * as diseases from './logic/diseasesLogic.js';
import * as casinoLottery from './logic/casinoLotteryLogic.js';
import * as relationshipsNpc from './logic/relationshipsNpcLogic.js';
import * as businessFinance from './logic/businessFinanceLogic.js';
import * as realEstateLandlord from './logic/realEstateLandlordLogic.js';
import * as investments from './logic/investmentsLogic.js';
import * as crimePrison from './logic/crimePrisonLogic.js';
import * as athleteCareer from './logic/athleteCareerLogic.js';

export {
    isAlive,
    calculateFightOutcome,
    calculatePeerPressureOutcome,
    calculateTripSatisfaction
} from './logic/playerStatsLogic.js';

export {
    getSchoolSportsDraftBonus,
    evaluateAthleteProspect,
    generateAthleteContract,
    attemptAthleteDraft,
    attemptAthleteTryout,
    processAthleteAction
} from './logic/athleteCareerLogic.js';

export const GameLogic = {
    // Player Stats, Sanitization, City CoL & Suggestions
    calculateFightOutcome: playerStats.calculateFightOutcome,
    calculatePeerPressureOutcome: playerStats.calculatePeerPressureOutcome,
    calculateTripSatisfaction: playerStats.calculateTripSatisfaction,
    adjustStat: playerStats.adjustStat,
    setStat: playerStats.setStat,
    generateRandomStats: playerStats.generateRandomStats,
    calculateSmartsDelta: playerStats.calculateSmartsDelta,
    calculateLooksDelta: playerStats.calculateLooksDelta,
    sanitizeName: playerStats.sanitizeName,
    sanitizeBusinessName: playerStats.sanitizeBusinessName,
    addLivingExpenses: playerStats.addLivingExpenses,
    calculateBirthdayMoney: playerStats.calculateBirthdayMoney,
    CITY_COST_OF_LIVING: playerStats.CITY_COST_OF_LIVING,
    getCityCostMultiplier: playerStats.getCityCostMultiplier,
    calculateScaledSalary: playerStats.calculateScaledSalary,
    generateLifeSuggestions: playerStats.generateLifeSuggestions,
    isAlive: playerStats.isAlive,
    clampStat: playerStats.clampStat,

    // Education, Degrees & Skills
    addStudentLoanPayment: educationSkills.addStudentLoanPayment,
    checkSchoolGraduated: educationSkills.checkSchoolGraduated,
    checkLifeStatus: educationSkills.checkLifeStatus,
    getEducationMilestones: educationSkills.getEducationMilestones,
    formatEducationMilestones: educationSkills.formatEducationMilestones,
    getCurrentEducationStatus: educationSkills.getCurrentEducationStatus,
    ensureUserSkills: educationSkills.ensureUserSkills,
    getSkillState: educationSkills.getSkillState,
    getSkillXp: educationSkills.getSkillXp,
    hasCareerSkillCertification: educationSkills.hasCareerSkillCertification,
    getCareerUnlockingSkills: educationSkills.getCareerUnlockingSkills,
    getCareerSkillBonuses: educationSkills.getCareerSkillBonuses,
    executePracticeSkill: educationSkills.executePracticeSkill,
    executeEnrollSkillCourse: educationSkills.executeEnrollSkillCourse,
    getLivingParents: educationSkills.getLivingParents,
    calculateParentInstrumentApprovalOdds: educationSkills.calculateParentInstrumentApprovalOdds,
    executeAskParentInstrumentPermission: educationSkills.executeAskParentInstrumentPermission,
    getInstrumentPracticeXpGain: educationSkills.getInstrumentPracticeXpGain,
    getInstrumentLessonXpGain: educationSkills.getInstrumentLessonXpGain,
    executeInstrumentLesson: educationSkills.executeInstrumentLesson,
    getArtistInstrumentReadiness: educationSkills.getArtistInstrumentReadiness,

    // Vehicles, Auto Loans & Jewelry
    getVehicleIcon: vehiclesJewelry.getVehicleIcon,
    simulateVehicleMarket: vehiclesJewelry.simulateVehicleMarket,
    updateOwnedVehicles: vehiclesJewelry.updateOwnedVehicles,
    VEHICLES_FOR_SALE: vehiclesJewelry.VEHICLES_FOR_SALE,
    calculateAutoLoan: vehiclesJewelry.calculateAutoLoan,
    calculateTotalAutoLoanMonthlyOutflow: vehiclesJewelry.calculateTotalAutoLoanMonthlyOutflow,
    calculateTradeInValue: vehiclesJewelry.calculateTradeInValue,
    getJewelryIcon: vehiclesJewelry.getJewelryIcon,
    JEWELRY_FOR_SALE: vehiclesJewelry.JEWELRY_FOR_SALE,
    updateOwnedJewelry: vehiclesJewelry.updateOwnedJewelry,

    // Health, Mortality & Diets
    checkMortality: healthMortality.checkMortality,
    calculateHealthDecay: healthMortality.calculateHealthDecay,
    calculateHealthBenefits: healthMortality.calculateHealthBenefits,
    calculateActiveHealthCosts: healthMortality.calculateActiveHealthCosts,
    calculateChildMonthlyOutflow: healthMortality.calculateChildMonthlyOutflow,
    calculateMedicalVisit: healthMortality.calculateMedicalVisit,
    calculateOneTimeGymVisit: healthMortality.calculateOneTimeGymVisit,
    DIET_PLANS: healthMortality.DIET_PLANS,
    getDietPlan: healthMortality.getDietPlan,

    // Diseases & Medical Clinic
    DISEASES_CATALOG: diseases.DISEASES_CATALOG,
    getDiseaseDefinition: diseases.getDiseaseDefinition,
    ensureUserDiseases: diseases.ensureUserDiseases,
    syncDiseaseFlags: diseases.syncDiseaseFlags,
    infectUser: diseases.infectUser,
    processAnnualDiseases: diseases.processAnnualDiseases,
    rollHookupSTD: diseases.rollHookupSTD,
    treatDiseaseAtDoctor: diseases.treatDiseaseAtDoctor,

    // Casino, Lottery & Travel
    getDeck: casinoLottery.getDeck,
    calculateBlackjackHand: casinoLottery.calculateBlackjackHand,
    determineBlackjackOutcome: casinoLottery.determineBlackjackOutcome,
    calculateTripOutcome: casinoLottery.calculateTripOutcome,
    LOTTERY_TYPES: casinoLottery.LOTTERY_TYPES,
    playLotteryTicket: casinoLottery.playLotteryTicket,
    getMegaJackpotAmount: casinoLottery.getMegaJackpotAmount,
    rollOverMegaJackpot: casinoLottery.rollOverMegaJackpot,
    playRoulette: casinoLottery.playRoulette,
    spinSlotMachine: casinoLottery.spinSlotMachine,
    ROULETTE_RED_NUMBERS: casinoLottery.ROULETTE_RED_NUMBERS,
    SLOT_SYMBOLS: casinoLottery.SLOT_SYMBOLS,

    // Relationships, NPCs, Dating, Marriage, Inheritance & Relocation
    generateNPCOccupation: relationshipsNpc.generateNPCOccupation,
    progressNPCOccupation: relationshipsNpc.progressNPCOccupation,
    calculateSpousalIncomeContribution: relationshipsNpc.calculateSpousalIncomeContribution,
    calculateRelationshipDecay: relationshipsNpc.calculateRelationshipDecay,
    checkRelationshipCategoryShift: relationshipsNpc.checkRelationshipCategoryShift,
    isHostile: relationshipsNpc.isHostile,
    getAvailableInteractions: relationshipsNpc.getAvailableInteractions,
    isInteractionBlocked: relationshipsNpc.isInteractionBlocked,
    calculateInheritance: relationshipsNpc.calculateInheritance,
    calculateSpousalLifeInsurance: relationshipsNpc.calculateSpousalLifeInsurance,
    calculateEstateDistribution: relationshipsNpc.calculateEstateDistribution,
    generateSchoolCohort: relationshipsNpc.generateSchoolCohort,
    generateReplacementTeacher: relationshipsNpc.generateReplacementTeacher,
    generateStranger: relationshipsNpc.generateStranger,
    determineNPCGender: relationshipsNpc.determineNPCGender,
    generateTargetedStranger: relationshipsNpc.generateTargetedStranger,
    generateDatingProfiles: relationshipsNpc.generateDatingProfiles,
    generateLuxuryMatch: relationshipsNpc.generateLuxuryMatch,
    LUXURY_AGE_PRESETS: relationshipsNpc.LUXURY_AGE_PRESETS,
    LUXURY_CAREERS: relationshipsNpc.LUXURY_CAREERS,
    getRandomHookupScenario: relationshipsNpc.getRandomHookupScenario,
    calculateMakeAMoveSuccess: relationshipsNpc.calculateMakeAMoveSuccess,
    checkAgeUpInfidelityDiscovery: relationshipsNpc.checkAgeUpInfidelityDiscovery,
    backfillRelationshipGender: relationshipsNpc.backfillRelationshipGender,
    attemptBefriend: relationshipsNpc.attemptBefriend,
    calculateProposalAcceptance: relationshipsNpc.calculateProposalAcceptance,
    calculatePregnancyChance: relationshipsNpc.calculatePregnancyChance,
    getRandomFirstName: relationshipsNpc.getRandomFirstName,
    getRandomLastName: relationshipsNpc.getRandomLastName,
    getLastName: relationshipsNpc.getLastName,
    getFirstName: relationshipsNpc.getFirstName,
    calculateNameChangeAcceptance: relationshipsNpc.calculateNameChangeAcceptance,
    inheritFamilyRelationships: relationshipsNpc.inheritFamilyRelationships,
    RELOCATION_COST: relationshipsNpc.RELOCATION_COST,
    canMoveCountry: relationshipsNpc.canMoveCountry,
    moveCountry: relationshipsNpc.moveCountry,
    getPartner: relationshipsNpc.getPartner,
    calculatePartnerRelocateAcceptance: relationshipsNpc.calculatePartnerRelocateAcceptance,
    breakUpWithPartner: relationshipsNpc.breakUpWithPartner,

    // Business, Startups, Cashflow & Taxes
    calculatePromotionChance: businessFinance.calculatePromotionChance,
    canProcessBusinessQuarter: businessFinance.canProcessBusinessQuarter,
    recordBusinessQuarterProcessed: businessFinance.recordBusinessQuarterProcessed,
    getRemainingQuartersForAge: businessFinance.getRemainingQuartersForAge,
    calculateAutoQuarterCount: businessFinance.calculateAutoQuarterCount,
    resetBusinessQuarterTracking: businessFinance.resetBusinessQuarterTracking,
    ensureBusinessState: businessFinance.ensureBusinessState,
    calculateCompanyValuation: businessFinance.calculateCompanyValuation,
    MAX_COMPANY_VALUATION: businessFinance.MAX_COMPANY_VALUATION,
    MAX_COMPANY_CASH: businessFinance.MAX_COMPANY_CASH,
    MAX_PLAYER_MONEY: businessFinance.MAX_PLAYER_MONEY,
    calculateBusinessOverhead: businessFinance.calculateBusinessOverhead,
    calculateVCInvestorOffers: businessFinance.calculateVCInvestorOffers,
    acceptVCOffer: businessFinance.acceptVCOffer,
    launchIPO: businessFinance.launchIPO,
    calculateUserMonthlyIncome: businessFinance.calculateUserMonthlyIncome,
    calculateUserMonthlyOutflow: businessFinance.calculateUserMonthlyOutflow,
    calculateFinancialBreakdown: businessFinance.calculateFinancialBreakdown,
    getMinRetireYears: businessFinance.getMinRetireYears,

    // Real Estate, Mortgages, Landlord & Property Manager
    PROPERTIES_FOR_SALE: realEstateLandlord.PROPERTIES_FOR_SALE,
    getPropertyIcon: realEstateLandlord.getPropertyIcon,
    calculateMonthlyMortgage: realEstateLandlord.calculateMonthlyMortgage,
    calculateTotalMonthlyMortgages: realEstateLandlord.calculateTotalMonthlyMortgages,
    canAffordMortgage: realEstateLandlord.canAffordMortgage,
    processMortgagePayments: realEstateLandlord.processMortgagePayments,
    calculatePropertyMonthlyOutflow: realEstateLandlord.calculatePropertyMonthlyOutflow,
    updateOwnedProperties: realEstateLandlord.updateOwnedProperties,
    calculateMaintenanceCost: realEstateLandlord.calculateMaintenanceCost,
    performPropertyMaintenance: realEstateLandlord.performPropertyMaintenance,
    calculateRenovationOptions: realEstateLandlord.calculateRenovationOptions,
    renovateProperty: realEstateLandlord.renovateProperty,
    calculateTotalRentalIncome: realEstateLandlord.calculateTotalRentalIncome,
    generateTenantApplicants: realEstateLandlord.generateTenantApplicants,
    acceptTenantLease: realEstateLandlord.acceptTenantLease,
    processRentalIncome: realEstateLandlord.processRentalIncome,
    processTenantEvents: realEstateLandlord.processTenantEvents,
    evictTenant: realEstateLandlord.evictTenant,
    PROPERTY_MANAGER_FEE_RATE: realEstateLandlord.PROPERTY_MANAGER_FEE_RATE,
    isPropertyManagerHired: realEstateLandlord.isPropertyManagerHired,
    isPropertyManaged: realEstateLandlord.isPropertyManaged,
    generatePropertyManagerCandidate: realEstateLandlord.generatePropertyManagerCandidate,
    hirePropertyManager: realEstateLandlord.hirePropertyManager,
    firePropertyManager: realEstateLandlord.firePropertyManager,
    getPropertyManagerSummary: realEstateLandlord.getPropertyManagerSummary,
    resolveManagerRepair: realEstateLandlord.resolveManagerRepair,
    getPendingManagerRepairs: realEstateLandlord.getPendingManagerRepairs,
    calculatePropertySaleTiers: realEstateLandlord.calculatePropertySaleTiers,
    generatePropertyBuyerOffer: realEstateLandlord.generatePropertyBuyerOffer,
    completePropertySale: realEstateLandlord.completePropertySale,

    // Investments, Stocks & Savings
    INITIAL_STOCKS: investments.INITIAL_STOCKS,
    ensureInvestmentState: investments.ensureInvestmentState,
    generateInvestmentBlogPosts: investments.generateInvestmentBlogPosts,
    processInvestmentsAgeUp: investments.processInvestmentsAgeUp,
    buyStock: investments.buyStock,
    sellStock: investments.sellStock,
    depositSavings: investments.depositSavings,
    withdrawSavings: investments.withdrawSavings,

    // Crime, Trials, Mafia & Prison
    CRIMES: crimePrison.CRIMES,
    attemptCrime: crimePrison.attemptCrime,
    handleArrestAction: crimePrison.handleArrestAction,
    calculateTrialVerdict: crimePrison.calculateTrialVerdict,
    applySentencing: crimePrison.applySentencing,
    processMafiaCrime: crimePrison.processMafiaCrime,
    calculatePrisonSecurity: crimePrison.calculatePrisonSecurity,
    generateCellmate: crimePrison.generateCellmate,
    generateYardInmates: crimePrison.generateYardInmates,
    initPrisonState: crimePrison.initPrisonState,
    processPrisonAgeUp: crimePrison.processPrisonAgeUp,
    interactCellmate: crimePrison.interactCellmate,
    workoutPrisonYard: crimePrison.workoutPrisonYard,
    interactYardInmate: crimePrison.interactYardInmate,
    doPrisonJob: crimePrison.doPrisonJob,
    buyCanteenItem: crimePrison.buyCanteenItem,
    studyPrisonLaw: crimePrison.studyPrisonLaw,
    attemptSentenceAppeal: crimePrison.attemptSentenceAppeal,
    attemptParoleBoard: crimePrison.attemptParoleBoard,
    attemptPrisonEscape: crimePrison.attemptPrisonEscape,
    sendPrisonLetter: crimePrison.sendPrisonLetter,
    requestConjugalVisit: crimePrison.requestConjugalVisit,
    useContrabandPhone: crimePrison.useContrabandPhone,
    sellContrabandItem: crimePrison.sellContrabandItem,
    doSolitaryActivity: crimePrison.doSolitaryActivity,
    attackPrisonInmate: crimePrison.attackPrisonInmate,

    // Pro Athlete Career
    getSchoolSportsDraftBonus: athleteCareer.getSchoolSportsDraftBonus,
    evaluateAthleteProspect: athleteCareer.evaluateAthleteProspect,
    generateAthleteContract: athleteCareer.generateAthleteContract,
    attemptAthleteDraft: athleteCareer.attemptAthleteDraft,
    attemptAthleteTryout: athleteCareer.attemptAthleteTryout,
    processAthleteAction: athleteCareer.processAthleteAction
};
