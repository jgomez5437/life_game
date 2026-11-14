import { jest } from '@jest/globals';
import { GameLogic } from '../../public/src/core/gameLogic.js';
import { migrateState } from '../../public/src/core/saveSlotManager.js';
import { buildRecommendations } from '../../public/src/core/recommendations.js';
import { state } from '../../public/src/core/state.js';
import { UI } from '../../public/src/ui/ui.js';
import { ageUp, renderLifeDashboard } from '../../public/src/features/player/mainScreen.js';

describe('Diseases, Sicknesses, STDs & Doctor Treatment', () => {
    test('infectUser applies initial stat penalties and syncs flags', () => {
        const user = { age: 25, health: 100, happiness: 100, looks: 80, diseases: [] };
        const res = GameLogic.infectUser(user, 'seasonal_flu', 0.0);

        expect(res.infected).toBe(true);
        expect(user.diseases).toHaveLength(1);
        expect(user.diseases[0].id).toBe('seasonal_flu');
        expect(user.diseases[0].selfResolving).toBe(true);
        expect(user.diseases[0].yearsRemaining).toBe(1);
        expect(user.health).toBe(94);
        expect(user.happiness).toBe(95);
        expect(user.isSick).toBe(true);
        expect(user.hasFlu).toBe(true);
    });

    test('self-resolving sickness applies annual penalties and clears automatically', () => {
        const user = { age: 25, health: 100, happiness: 100, looks: 80, diseases: [] };
        GameLogic.infectUser(user, 'common_cold', 0.0);
        // Initial hit: -3 health (97), -3 happiness (97)
        const outcome = GameLogic.processAnnualDiseases(user, { contractionRoll: 0.99 });

        expect(user.health).toBe(94);
        expect(user.happiness).toBe(94);
        expect(user.diseases).toHaveLength(0);
        expect(user.isSick).toBe(false);
        expect(outcome.recovered).toContain('Common Cold');
    });

    test('persistent curable illness does not self-resolve over multiple years', () => {
        const user = { age: 30, health: 100, happiness: 100, looks: 80, diseases: [] };
        GameLogic.infectUser(user, 'pneumonia');

        GameLogic.processAnnualDiseases(user, { contractionRoll: 0.99 });
        GameLogic.processAnnualDiseases(user, { contractionRoll: 0.99 });

        expect(user.diseases).toHaveLength(1);
        expect(user.diseases[0].id).toBe('pneumonia');
        expect(user.health).toBeLessThan(80);
    });

    test('treatDiseaseAtDoctor cures curable disease on successful roll and fails on high roll', () => {
        const user = { age: 28, money: 5000, health: 80, happiness: 80, diseases: [] };
        GameLogic.infectUser(user, 'pneumonia');

        // Failed cure attempt (roll >= 0.65)
        const failRes = GameLogic.treatDiseaseAtDoctor(user, 'pneumonia', 0.90);
        expect(failRes.success).toBe(true);
        expect(failRes.cured).toBe(false);
        expect(user.money).toBe(4000);
        expect(user.diseases).toHaveLength(1);
        expect(user.diseases[0].treatedThisYear).toBe(true);

        // Cannot treat same condition twice in the same year
        const repeatRes = GameLogic.treatDiseaseAtDoctor(user, 'pneumonia', 0.10);
        expect(repeatRes.success).toBe(false);
        expect(repeatRes.alreadyTreated).toBe(true);

        // Next year resets treatedThisYear and successful roll (< 0.65) cures it
        GameLogic.processAnnualDiseases(user, { contractionRoll: 0.99 });
        expect(user.diseases[0].treatedThisYear).toBe(false);

        const cureRes = GameLogic.treatDiseaseAtDoctor(user, 'pneumonia', 0.10);
        expect(cureRes.success).toBe(true);
        expect(cureRes.cured).toBe(true);
        expect(user.money).toBe(3000);
        expect(user.diseases).toHaveLength(0);
        expect(user.isSick).toBe(false);
    });

    test('doctor treatment is free for minors under 18 and enforces cost for adults', () => {
        const minor = { age: 12, money: 0, health: 90, happiness: 90, diseases: [] };
        GameLogic.infectUser(minor, 'common_cold');
        const minorRes = GameLogic.treatDiseaseAtDoctor(minor, 'common_cold', 0.1);
        expect(minorRes.success).toBe(true);
        expect(minorRes.cost).toBe(0);
        expect(minorRes.cured).toBe(true);

        const brokeAdult = { age: 25, money: 200, health: 90, happiness: 90, diseases: [] };
        GameLogic.infectUser(brokeAdult, 'common_cold');
        const brokeRes = GameLogic.treatDiseaseAtDoctor(brokeAdult, 'common_cold', 0.1);
        expect(brokeRes.success).toBe(false);
        expect(brokeRes.insufficientFunds).toBe(true);
        expect(brokeAdult.money).toBe(200);
    });

    test('chronic/lifelong conditions persist after doctor visit but reduce annual penalty', () => {
        const userUntreated = { age: 50, money: 5000, health: 90, happiness: 90, diseases: [] };
        const userTreated = { age: 50, money: 5000, health: 90, happiness: 90, diseases: [] };

        GameLogic.infectUser(userUntreated, 'heart_disease');
        GameLogic.infectUser(userTreated, 'heart_disease');

        const docRes = GameLogic.treatDiseaseAtDoctor(userTreated, 'heart_disease');
        expect(docRes.success).toBe(true);
        expect(docRes.cured).toBe(false);
        expect(docRes.managed).toBe(true);
        expect(userTreated.diseases).toHaveLength(1);

        const healthBeforeUntreated = userUntreated.health;
        const healthBeforeTreated = userTreated.health;

        GameLogic.processAnnualDiseases(userUntreated, { contractionRoll: 0.99 });
        GameLogic.processAnnualDiseases(userTreated, { contractionRoll: 0.99 });

        const lossUntreated = healthBeforeUntreated - userUntreated.health;
        const lossTreated = healthBeforeTreated - userTreated.health;

        expect(lossUntreated).toBe(12);
        expect(lossTreated).toBe(4);
        expect(userTreated.diseases).toHaveLength(1);
    });

    test('rollHookupSTD respects protection vs no-protection probabilities and affects stats', () => {
        const userNoProt = { age: 25, health: 100, happiness: 100, looks: 80, diseases: [] };
        // Unprotected threshold is 0.20, so triggerRoll 0.15 contracts an STD
        const stdRes = GameLogic.rollHookupSTD(userNoProt, false, { triggerRoll: 0.15, pickRoll: 0.1 });
        expect(stdRes.contracted).toBe(true);
        expect(stdRes.disease.category).toBe('std');
        expect(userNoProt.health).toBeLessThan(100);
        expect(userNoProt.happiness).toBeLessThan(100);
        expect(userNoProt.looks).toBeLessThan(80);

        const userProt = { age: 25, health: 100, happiness: 100, looks: 80, diseases: [] };
        // Protected threshold is 0.025, so triggerRoll 0.10 does NOT contract an STD
        const safeRes = GameLogic.rollHookupSTD(userProt, true, { triggerRoll: 0.10 });
        expect(safeRes.contracted).toBe(false);
        expect(userProt.diseases).toHaveLength(0);
    });

    test('migrateState preserves and sanitizes active diseases across saves', () => {
        const user = { username: 'Test Player', age: 26, health: 85, happiness: 80, looks: 75, diseases: [] };
        GameLogic.infectUser(user, 'chlamydia');

        const migrated = migrateState({ user });
        expect(migrated.user.diseases).toHaveLength(1);
        expect(migrated.user.diseases[0].id).toBe('chlamydia');
        expect(migrated.user.diseases[0].name).toBe('Chlamydia');
        expect(migrated.user.isSick).toBe(true);
    });

    test('buildRecommendations surfaces illness alert for untreated conditions', () => {
        const user = { age: 25, money: 2000, diseases: [{ id: 'chlamydia', name: 'Chlamydia', treatedThisYear: false }] };
        const recs = buildRecommendations(user);
        expect(recs.some(r => r.id === 'alert-illness' && r.action === 'visitDoctor')).toBe(true);

        user.diseases[0].treatedThisYear = true;
        const recsAfter = buildRecommendations(user);
        expect(recsAfter.some(r => r.id === 'alert-illness')).toBe(false);
    });

    test('checkMortality attributes fatal outcome at low health to severe active disease', () => {
        const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0.001);
        const res = GameLogic.checkMortality(40, 20, [{ id: 'pneumonia', name: 'Pneumonia', treatedThisYear: false }]);
        expect(res.isDead).toBe(true);
        expect(res.cause).toBe('complications from Pneumonia.');
        randSpy.mockRestore();
    });

    test('ageUp() processes annual diseases, logs contracted illness to Life History, and triggers notification modal on dashboard render', async () => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">25</span>
            </div>
            <div id="header-bank">$1,000</div>
            <div id="ui-health">100%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: 'SickHero',
                age: 25,
                health: 100,
                happiness: 100,
                smarts: 80,
                looks: 80,
                money: 2000,
                lifeStatus: 'Alive',
                relationships: [],
                diseases: []
            },
            lifeLog: [{ age: 25, events: [{ msg: 'Started at 25.', color: 'text-slate-400' }] }],
            assets: []
        };

        // Force processAnnualDiseases to deterministically contract an illness during ageUp()
        const origProcess = GameLogic.processAnnualDiseases;
        const processSpy = jest.spyOn(GameLogic, 'processAnnualDiseases').mockImplementation((u) =>
            origProcess(u, { contractionRoll: 0.01, pickRoll: 0.0, durationRoll: 0.5 })
        );
        const modalSpy = jest.spyOn(UI, 'showCustomModal');

        await ageUp();

        expect(processSpy).toHaveBeenCalledTimes(1);
        expect(state.gameState.user.age).toBe(26);
        expect(state.gameState.user.diseases).toHaveLength(1);
        const contractedName = state.gameState.user.diseases[0].name;

        const age26Log = state.gameState.lifeLog.find(l => l.age === 26);
        expect(age26Log).toBeDefined();
        expect(age26Log.events.some(e => e.msg.includes(contractedName))).toBe(true);

        // Clear any random life event queued during ageUp so renderLifeDashboard renders immediately
        state.gameState.pendingEvents = [];

        // Render dashboard and verify medical banner + diagnosis notification modal
        renderLifeDashboard(state.gameState);
        const banner = document.getElementById('dashboard-medical-banner');
        expect(banner).not.toBeNull();
        expect(banner.textContent).toContain(contractedName);
        const bannerDoctorBtn = banner.querySelector('button[data-action="visitDoctor"]');
        expect(bannerDoctorBtn).not.toBeNull();

        expect(modalSpy).toHaveBeenCalledWith(expect.objectContaining({
            confirmText: 'Visit Doctor ($1,000)',
            content: expect.stringContaining(contractedName)
        }));

        // Confirming the diagnosis popup should invoke more.visitDoctor() and open Medical Clinic
        const confirmBtn = document.getElementById('custom-modal-confirm');
        expect(confirmBtn).not.toBeNull();
        confirmBtn.click();

        for (let i = 0; i < 40; i++) {
            if (document.getElementById('modal-title')?.textContent === 'Medical Clinic') break;
            await new Promise(resolve => setTimeout(resolve, 25));
        }

        expect(document.getElementById('modal-title')?.textContent).toBe('Medical Clinic');
        expect(document.getElementById('modal-content')?.innerHTML).toContain(contractedName);
        expect(document.getElementById('modal-content')?.querySelector('button[data-action="treatDisease"]')).not.toBeNull();

        UI.closeAllModals();
        processSpy.mockRestore();
        modalSpy.mockRestore();
    });
});

