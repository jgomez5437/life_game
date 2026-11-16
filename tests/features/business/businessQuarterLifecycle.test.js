import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { migrateState } from '../../../public/src/core/saveSlotManager.js';

const mockSaveGame = jest.fn();
const mockAddLog = jest.fn();
const mockRenderLifeDashboard = jest.fn();
const mockShowModal = jest.fn();
const mockShowCustomModal = jest.fn();
const mockHideModal = jest.fn();
let modalOpenFlag = false;

jest.unstable_mockModule('../../../public/src/core/main.js', () => ({
    saveGame: mockSaveGame,
    resetGame: jest.fn(),
    loadAndRenderGame: jest.fn(),
    updateGameInfo: jest.fn()
}));

jest.unstable_mockModule('../../../public/src/features/player/mainScreen.js', () => ({
    addLog: mockAddLog,
    renderLifeDashboard: mockRenderLifeDashboard,
    renderDeathScreen: jest.fn(),
    showFullEulogy: jest.fn(),
    continueAsChild: jest.fn(),
    ageUp: jest.fn(),
    refreshClassmates: jest.fn()
}));

jest.unstable_mockModule('../../../public/src/ui/ui.js', () => ({
    UI: {
        renderScreen: (html) => {
            const container = document.getElementById('game-container');
            if (container) container.innerHTML = html;
        },
        updateHeader: jest.fn(),
        updateBottomNav: jest.fn(),
        scrollTabIntoView: jest.fn(),
        preserveTabScroll: jest.fn(),
        showModal: mockShowModal,
        showCustomModal: mockShowCustomModal,
        hideModal: mockHideModal,
        isModalOpen: () => modalOpenFlag
    }
}));

const businessDashboard = await import('../../../public/src/features/business/businessDashboard.js');
const createBusinessScreen = await import('../../../public/src/features/business/createBusinessScreen.js');
const { computeQuarterlyForecast } = await import('../../../public/src/features/business/businessTabsRenderer.js');

function createActiveBusinessUser(overrides = {}) {
    return {
        name: 'Founder Test',
        age: 27,
        health: 100,
        happiness: 80,
        smarts: 85,
        looks: 70,
        lifeStatus: 'Alive',
        money: 250000,
        hasBusiness: true,
        companyName: 'Apex Cloud Inc',
        industry: 'tech_saas',
        hqTier: 'garage',
        compCash: 500000,
        companyYear: 1,
        companyQuarter: 1,
        employees: 5,
        salaryOffer: 4000,
        ceoSalary: 3000,
        productionTarget: 200,
        sellingPrice: 120,
        supplierId: 'standard',
        businessReputation: 60,
        inventory: 0,
        marketingLevels: { social_ads: 0, seo_content: 0, influencers: 0, b2b_sales: 0 },
        teamRoles: { engineering: 2, sales: 1, operations: 1, marketing: 1 },
        equityOwned: 1.0,
        isPublic: false,
        investorShares: [],
        businessHistory: [],
        businessUpgrades: [],
        quartersProcessedThisAge: 0,
        lastBusinessAge: null,
        lastCompletedFiscalYearAge: null,
        ...overrides
    };
}

describe('Business Quarter Lifecycle, Q5 Prevention & UI Redesign', () => {
    beforeEach(() => {
        document.body.innerHTML = `<main id="game-container"></main>`;
        modalOpenFlag = false;
        jest.clearAllMocks();
        state.gameState = {
            user: createActiveBusinessUser(),
            lifeLog: []
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('completes Q1-Q4 at age 27 (even with Q4 decision event), never hits Q5, and runs Y2 Q1-Q4 cleanly at age 28', () => {
        const user = state.gameState.user;

        // Suppress random decision event for Q1-Q3
        jest.spyOn(Math, 'random').mockReturnValue(0.9);

        businessDashboard.processQuarter(); // Y1 Q1
        expect(user.companyYear).toBe(1);
        expect(user.companyQuarter).toBe(2);
        expect(user.quartersProcessedThisAge).toBe(1);
        expect(user.businessHistory[0]).toMatchObject({ year: 1, quarter: 1 });

        businessDashboard.processQuarter(); // Y1 Q2
        expect(user.companyYear).toBe(1);
        expect(user.companyQuarter).toBe(3);

        businessDashboard.processQuarter(); // Y1 Q3
        expect(user.companyYear).toBe(1);
        expect(user.companyQuarter).toBe(4);
        expect(user.lastCompletedFiscalYearAge).toBeNull();

        // Force a Q4 decision event (< 0.25) so chooseEventChoice calls saveGame() before finishQuarterTurnProcessing
        Math.random.mockReturnValue(0.1);
        let savedQuarterDuringEvent = null;
        mockSaveGame.mockImplementationOnce(() => {
            savedQuarterDuringEvent = user.companyQuarter;
        });

        businessDashboard.processQuarter(); // Y1 Q4 with activeEvent

        // Quarter must ALREADY have rolled cleanly to Y2 Q1 before modal/saveGame (never Q5!)
        expect(user.companyQuarter).toBe(1);
        expect(user.companyYear).toBe(2);
        expect(user.lastCompletedFiscalYearAge).toBe(27);
        expect(user.businessHistory[3]).toMatchObject({ year: 1, quarter: 4 });

        // Complete the decision event modal choice
        businessDashboard.chooseEventChoice('0');
        expect(savedQuarterDuringEvent).toBe(1);
        expect(mockShowCustomModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Annual Fiscal Report (Year 1)',
                confirmText: 'Back to Life Log',
                cancelText: 'Stay in Office'
            })
        );

        // Attempting a 5th quarter at age 27 must be blocked
        businessDashboard.processQuarter();
        expect(user.businessHistory.length).toBe(4);
        expect(mockShowModal).toHaveBeenCalledWith(
            'Fiscal Year Limit',
            expect.stringMatching(/age up/i)
        );

        // Render dashboard after fiscal close: CTA should switch to Age Up
        businessDashboard.renderBusinessDashboard();
        const ageUpBtn = document.querySelector('#btn-age-up-business');
        expect(ageUpBtn).not.toBeNull();
        expect(ageUpBtn.dataset.action).toBe('ageUp');
        expect(ageUpBtn.textContent).toContain('Age Up to 28');

        // Simulate aging up from 27 -> 28
        user.age = 28;
        businessDashboard.autoProcessBusinessQuarter(user);
        expect(user.businessHistory.length).toBe(4); // 0 extra auto quarters because age 27 already finished
        expect(user.companyYear).toBe(2);
        expect(user.companyQuarter).toBe(1);

        // Age 28: should allow all 4 quarters (Q1-Q4), without closing early on Q1 or blocking Q4
        Math.random.mockReturnValue(0.9);
        mockShowCustomModal.mockClear();

        expect(GameLogic.canProcessBusinessQuarter(user).allowed).toBe(true);
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(4);

        businessDashboard.processQuarter(); // Y2 Q1
        expect(user.companyYear).toBe(2);
        expect(user.companyQuarter).toBe(2);
        expect(mockShowCustomModal).not.toHaveBeenCalled();

        businessDashboard.processQuarter(); // Y2 Q2
        businessDashboard.processQuarter(); // Y2 Q3
        expect(user.companyYear).toBe(2);
        expect(user.companyQuarter).toBe(4);
        expect(GameLogic.canProcessBusinessQuarter(user).allowed).toBe(true);

        businessDashboard.processQuarter(); // Y2 Q4 -> closes Fiscal Year 2
        expect(user.companyYear).toBe(3);
        expect(user.companyQuarter).toBe(1);
        expect(user.lastCompletedFiscalYearAge).toBe(28);
        expect(mockShowCustomModal).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Annual Fiscal Report (Year 2)'
            })
        );
    });

    test('partial year (Q1-Q2 at age 27) + ageUp finishes Q3-Q4 cleanly and unlocks Q1-Q4 at age 28', () => {
        const user = state.gameState.user;
        jest.spyOn(Math, 'random').mockReturnValue(0.9);

        businessDashboard.processQuarter(); // Y1 Q1
        businessDashboard.processQuarter(); // Y1 Q2
        expect(user.companyYear).toBe(1);
        expect(user.companyQuarter).toBe(3);

        // Age up to 28 mid-year
        user.age = 28;
        businessDashboard.autoProcessBusinessQuarter(user);

        expect(user.businessHistory.map(h => `Y${h.year}Q${h.quarter}`)).toEqual(['Y1Q1', 'Y1Q2', 'Y1Q3', 'Y1Q4']);
        expect(user.companyYear).toBe(2);
        expect(user.companyQuarter).toBe(1);
        expect(user.lastCompletedFiscalYearAge).toBe(27);
        expect(GameLogic.getRemainingQuartersForAge(user)).toBe(4);
    });

    test('processQuarter ignores calls while a modal is already open', () => {
        const user = state.gameState.user;
        modalOpenFlag = true;
        businessDashboard.processQuarter();
        expect(user.businessHistory.length).toBe(0);
        expect(user.companyQuarter).toBe(1);
    });

    test('normalizeBusinessQuarterState and migrateState recover corrupted Q5 and stale Q4 saves', () => {
        const q5User = createActiveBusinessUser({
            age: 28,
            companyYear: 1,
            companyQuarter: 5,
            lastBusinessAge: 27,
            quartersProcessedThisAge: 4,
            lastCompletedFiscalYearAge: 27
        });
        GameLogic.normalizeBusinessQuarterState(q5User);
        expect(q5User.companyYear).toBe(2);
        expect(q5User.companyQuarter).toBe(1);

        const migratedQ5 = migrateState({
            user: createActiveBusinessUser({
                companyYear: 2,
                companyQuarter: 5
            }),
            lifeLog: []
        });
        expect(migratedQ5.user.companyYear).toBe(3);
        expect(migratedQ5.user.companyQuarter).toBe(1);

        const staleQ4 = migrateState({
            user: createActiveBusinessUser({
                companyYear: 1,
                companyQuarter: 4,
                businessHistory: [
                    { year: 1, quarter: 1, revenue: 1000, profit: 500 },
                    { year: 1, quarter: 2, revenue: 1000, profit: 500 },
                    { year: 1, quarter: 3, revenue: 1000, profit: 500 },
                    { year: 1, quarter: 4, revenue: 1000, profit: 500 }
                ]
            }),
            lifeLog: []
        });
        expect(staleQ4.user.companyYear).toBe(2);
        expect(staleQ4.user.companyQuarter).toBe(1);
    });

    test('qa_automation and rd_lab upgrades modify forecast & turn execution and render in Operations tab', () => {
        const user = state.gameState.user;
        const baseForecast = computeQuarterlyForecast(user);

        businessDashboard.purchaseUpgrade('qa_automation');
        businessDashboard.purchaseUpgrade('rd_lab');
        expect(user.businessUpgrades).toContain('qa_automation');
        expect(user.businessUpgrades).toContain('rd_lab');

        const upgradedForecast = computeQuarterlyForecast(user);
        expect(upgradedForecast.prodCost).toBeCloseTo(baseForecast.prodCost * 0.80, 2);
        expect(upgradedForecast.estDemand).toBeGreaterThan(baseForecast.estDemand);

        businessDashboard.setBusinessTab('operations');
        expect(document.body.innerHTML).toContain('Corporate Upgrades');
        expect(document.body.innerHTML).toContain('QA &amp; AI Automation');
        expect(document.getElementById('business-exec-bar')).not.toBeNull();
    });

    test('createBusinessScreen shows affordability badges and initializes clean business state', () => {
        state.gameState.user = {
            name: 'New Founder',
            age: 25,
            health: 100,
            happiness: 60,
            money: 150000,
            hasBusiness: false
        };

        createBusinessScreen.renderBusinessSetup();
        const html = document.getElementById('game-container').innerHTML;
        expect(html).toContain('Affordable');
        expect(html).toContain('Need ');

        document.getElementById('inp-comp-name').value = '  Nebula Works  ';
        createBusinessScreen.selectIndustry('tech_saas');
        createBusinessScreen.selectSupplier('standard');
        createBusinessScreen.initBusiness();

        expect(state.gameState.user.hasBusiness).toBe(true);
        expect(state.gameState.user.companyName).toBe('Nebula Works');
        expect(state.gameState.user.companyYear).toBe(1);
        expect(state.gameState.user.companyQuarter).toBe(1);
        expect(mockAddLog).toHaveBeenCalledWith(
            expect.stringContaining('Founded Nebula Works'),
            'good'
        );
    });

    test('hr_perks lowers layoff severance by 50% in both HR UI and layoffEmployee()', () => {
        const user = state.gameState.user;
        user.compCash = 500000;
        user.employees = 5;

        businessDashboard.purchaseUpgrade('hr_perks');
        const cashAfterUpgrade = user.compCash;
        businessDashboard.setBusinessTab('hr');
        // tech_saas baseSalary = 6500 -> 0.75 * 6500 = 4875 severance
        expect(document.getElementById('game-container').innerHTML).toContain('Layoff ($4,875)');

        businessDashboard.layoffEmployee();
        expect(user.employees).toBe(4);
        expect(user.compCash).toBe(cashAfterUpgrade - 4875);
    });

    test('end-to-end UI renders all 5 tabs with live forecast updates and IPO milestone bar', () => {
        const user = state.gameState.user;
        user.businessHistory = [
            { year: 1, quarter: 1, revenue: 1500000, profit: 600000 },
            { year: 1, quarter: 2, revenue: 1500000, profit: 600000 },
            { year: 1, quarter: 3, revenue: 1500000, profit: 600000 },
            { year: 1, quarter: 4, revenue: 1500000, profit: 600000 }
        ];

        // Overview tab
        businessDashboard.setBusinessTab('overview');
        expect(document.getElementById('business-exec-bar')).not.toBeNull();
        expect(document.getElementById('btn-process-quarter')?.textContent).toContain('Run Q1');

        // Operations tab + live slider sync
        businessDashboard.setBusinessTab('operations');
        const prodSlider = document.getElementById('rng-prod');
        expect(prodSlider).not.toBeNull();
        const revBefore = document.getElementById('exec-proj-rev').innerText;
        prodSlider.value = '10';
        prodSlider.dispatchEvent(new Event('input'));
        expect(user.productionTarget).toBe(10);
        expect(document.getElementById('ops-util-label').innerText).toContain('10 units');
        expect(document.getElementById('exec-proj-rev').innerText).not.toBe(revBefore);

        // Marketing tab + live demand update
        businessDashboard.setBusinessTab('marketing');
        const priceSlider = document.getElementById('rng-price');
        expect(priceSlider).not.toBeNull();
        const demandBefore = document.getElementById('mkt-est-demand').innerText;
        priceSlider.value = '80';
        priceSlider.dispatchEvent(new Event('input'));
        expect(user.sellingPrice).toBe(80);
        expect(document.getElementById('mkt-est-demand').innerText).not.toBe(demandBefore);

        // Finance tab + IPO milestone + Pitch Room contract
        businessDashboard.setBusinessTab('finance');
        const financeHtml = document.getElementById('game-container').innerHTML;
        expect(financeHtml).toContain('IPO Valuation Progress');
        expect(financeHtml).toContain('Venture Capital Pitch Room');
    });
});
