import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    renderCrimeDashboard,
    openCrimeModal,
    commitCrimeAction,
    showMurderCoverUpModal,
    showArrestModal,
    openBribeModal,
    submitBribeAction,
    handleArrestChoice,
    showCourtArraignmentModal,
    selectLegalCounsel,
    finishCourtSentencing,
    returnFromCrimeOrArrest
} from '../../../public/src/features/more/crimeScreen.js';

describe('Crime Hub UI & Interaction Flow (crimeScreen.js)', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-user-info">
                <span id="header-name">Player</span>
                <span id="header-age">25</span>
            </div>
            <div id="header-bank"></div>
            <div id="ui-health">100%</div>
            <div id="ui-happiness">100%</div>
            <div id="ui-smarts">50%</div>
            <div id="ui-looks">50%</div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
            </div>
        `;

        state.gameState = {
            user: {
                username: "Arthur Morgan",
                age: 25,
                city: "New York",
                money: 10000,
                health: 100,
                happiness: 100,
                smarts: 75,
                looks: 70,
                careerTrack: null,
                careerLevel: 0,
                jobTitle: null,
                criminalRecord: [],
                lifetimeCrimesCommitted: 0,
                relationships: [
                    { id: "rel_victim_1", name: "Rival Enemy", category: "enemy", type: "Enemy", status: 0 }
                ]
            },
            lifeLog: []
        };
    });

    describe('renderCrimeDashboard', () => {
        test('blocks characters under age 12 with modal notice', () => {
            state.gameState.user.age = 10;
            const modalSpy = jest.spyOn(UI, 'showModal');

            renderCrimeDashboard();

            expect(modalSpy).toHaveBeenCalledWith("Too Young", expect.stringContaining("at least 12 years old"));
            modalSpy.mockRestore();
        });

        test('renders only mischief category for teens (12-17)', () => {
            state.gameState.user.age = 15;

            renderCrimeDashboard();

            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('Mischief');
            expect(container.innerHTML).toContain('Adult Underworld Locked');
            expect(container.innerHTML).toContain('Prank Call');
        });

        test('renders all 4 underworld tiers for adults (18+)', () => {
            state.gameState.user.age = 25;

            renderCrimeDashboard();

            const container = document.getElementById('game-container');
            expect(container.innerHTML).toContain('Mischief');
            expect(container.innerHTML).toContain('Street &amp; Petty Crimes');
            expect(container.innerHTML).toContain('Violent Crimes');
            expect(container.innerHTML).toContain('High-Stakes Heists');
            expect(container.innerHTML).toContain('Bank Robbery');
        });
    });

    describe('openCrimeModal', () => {
        test('shows attempt modal with crime details', () => {
            openCrimeModal('pickpocket');

            const overlay = document.getElementById('modal-overlay');
            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(title.textContent).toBe('Attempt Pickpocket');
            expect(content.innerHTML).toContain('Execute Pickpocket');
            expect(content.innerHTML).toContain('LOW RISK');
        });

        test('includes victim dropdown when crime targets relationships', () => {
            openCrimeModal('assault');

            const content = document.getElementById('modal-content');
            expect(content.innerHTML).toContain('crime-target-select');
            expect(content.innerHTML).toContain('Rival Enemy');
        });

        test('shows error modal if invalid crime requested', () => {
            const modalSpy = jest.spyOn(UI, 'showModal');

            openCrimeModal('non_existent_crime');

            expect(modalSpy).toHaveBeenCalledWith("Invalid Crime", expect.any(String));
            modalSpy.mockRestore();
        });
    });

    describe('commitCrimeAction', () => {
        test('renders success outcome modal on successful crime and awards loot', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

            commitCrimeAction('bank_robbery');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');
            const overlay = document.getElementById('modal-overlay');

            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(title.textContent).toBe('Crime Successful');
            expect(content.innerHTML).toContain('Bank Robbery');
            expect(content.innerHTML).toContain('Loot Acquired: +$');
            expect(content.innerHTML).toContain('Commit Again');
            expect(state.gameState.user.money).toBeGreaterThan(10000);

            spy.mockRestore();
        });

        test('renders caught in the act modal on failed juvenile mischief', () => {
            state.gameState.user.age = 15;
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

            commitCrimeAction('egging_house');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');
            const overlay = document.getElementById('modal-overlay');

            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(title.textContent).toBe('Caught in the Act!');
            expect(content.innerHTML).toContain('Egg a House Failed');
            expect(content.innerHTML).toContain('Try Again');

            spy.mockRestore();
        });

        test('transitions to police arrest modal on failed adult crime', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

            commitCrimeAction('gta');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(title.textContent).toBe('Police Arrest');
            expect(content.innerHTML).toContain('You Are Under Arrest!');
            expect(content.innerHTML).toContain('Grand Theft Auto');
            expect(state.gameState.user.pendingTrial).toBeDefined();

            spy.mockRestore();
        });

        test('handles murder cover-up outcome screen', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

            commitCrimeAction('murder');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(title.textContent).toBe('Homicide Outcome');
            expect(content.innerHTML).toContain('Cold Case Established');
            expect(content.innerHTML).toContain('Leave Crime Scene');

            spy.mockRestore();
        });

        test('shows Action Blocked when player is dead', () => {
            state.gameState.user.health = 0;
            state.gameState.user.lifeStatus = 'Deceased';
            const modalSpy = jest.spyOn(UI, 'showModal');

            commitCrimeAction('pickpocket');

            expect(modalSpy).toHaveBeenCalledWith("Action Blocked", expect.stringContaining("Cannot commit crimes while dead"));
            modalSpy.mockRestore();
        });
    });

    describe('Arrest & Court Proceedings', () => {
        beforeEach(() => {
            state.gameState.user.pendingTrial = {
                crime: GameLogic.CRIMES.gta,
                evidenceRating: 60,
                extraCharges: []
            };
        });

        test('handleArrestChoice comply transitions to court trial arraignment', () => {
            handleArrestChoice('comply');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(title.textContent).toBe('Court Trial Arraignment');
            expect(content.innerHTML).toContain('Pending Charge: Grand Theft Auto');
            expect(content.innerHTML).toContain('Public Defender');
            expect(content.innerHTML).toContain('Criminal Defense Attorney');
            expect(content.innerHTML).toContain('High-Powered Law Firm');
        });

        test('openBribeModal renders cash offer slider and submit button', () => {
            openBribeModal();

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(title.textContent).toBe('Bribe Officer');
            expect(content.innerHTML).toContain('bribe-amount-input');
            expect(content.innerHTML).toContain('Offer Cash Bribe');
        });

        test('submitBribeAction handles accepted bribe', () => {
            document.body.innerHTML += `<input id="bribe-amount-input" value="5000" />`;
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);
            const modalSpy = jest.spyOn(UI, 'showModal');

            submitBribeAction();

            expect(modalSpy).toHaveBeenCalledWith("Escaped Custody!", expect.any(String), expect.any(Function));
            expect(state.gameState.user.pendingTrial).toBeNull();
            expect(state.gameState.user.money).toBe(5000);

            modalSpy.mockRestore();
            spy.mockRestore();
        });

        test('selectLegalCounsel acquits player on not guilty verdict', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.01);

            selectLegalCounsel('public_defender');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(title.textContent).toBe('Acquitted!');
            expect(content.innerHTML).toContain('NOT GUILTY');
            expect(content.innerHTML).toContain('Leave Courtroom');
            expect(state.gameState.user.pendingTrial).toBeNull();

            spy.mockRestore();
        });

        test('selectLegalCounsel sentences player on guilty verdict', () => {
            const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

            selectLegalCounsel('public_defender');

            const title = document.getElementById('modal-title');
            const content = document.getElementById('modal-content');

            expect(title.textContent).toBe('Convicted & Sentenced');
            expect(content.innerHTML).toContain('GUILTY VERDICT');
            expect(content.innerHTML).toContain('finishCourtSentencing');

            spy.mockRestore();
        });

        test('finishCourtSentencing and returnFromCrimeOrArrest cleanly close modals', () => {
            const closeSpy = jest.spyOn(UI, 'closeAllModals');

            returnFromCrimeOrArrest(state.gameState.user);
            expect(closeSpy).toHaveBeenCalled();

            finishCourtSentencing();
            expect(closeSpy).toHaveBeenCalledTimes(2);

            closeSpy.mockRestore();
        });
    });
});
