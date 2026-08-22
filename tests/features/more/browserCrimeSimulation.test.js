import { state } from '../../../public/src/core/state.js';
import { GameLogic } from '../../../public/src/core/gameLogic.js';
import { UI } from '../../../public/src/ui/ui.js';
import {
    renderCrimeDashboard,
    openCrimeModal,
    commitCrimeAction
} from '../../../public/src/features/more/crimeScreen.js';

describe('Browser Simulation: Crime Hub End-to-End User Journeys', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <header>
                <div id="header-brand"></div>
                <div id="header-user-info">
                    <span id="header-name">Player</span>
                    <span id="header-age">25</span>
                </div>
                <div id="header-bank">$5,000</div>
                <div id="ui-health">100%</div>
                <div id="ui-happiness">100%</div>
                <div id="ui-smarts">80%</div>
                <div id="ui-looks">75%</div>
            </header>

            <main id="game-container"></main>

            <nav id="bottom-nav">
                <div id="bottom-nav-container">
                    <button id="nav-btn-assets"></button>
                    <button id="nav-btn-work"></button>
                    <button id="nav-btn-center" data-action="ageUp"></button>
                    <button id="nav-btn-social"></button>
                    <button id="nav-btn-more"></button>
                </div>
            </nav>

            <div id="modal-overlay" class="hidden">
                <div id="modal-container">
                    <h2 id="modal-title"></h2>
                    <div id="modal-content"></div>
                    <div id="modal-actions"></div>
                    <button id="modal-close-btn"></button>
                </div>
            </div>
        `;

        state.gameState = {
            user: {
                username: "Vincent Moretti",
                name: "Vincent Moretti",
                age: 25,
                money: 5000,
                health: 100,
                happiness: 90,
                smarts: 80,
                looks: 75,
                lifeStatus: "Alive",
                isDead: false,
                deathCause: null,
                deathAge: null,
                criminalRecord: [],
                lifetimeCrimesCommitted: 0,
                relationships: [
                    { id: "rel_rival_99", name: "Don Falcone", type: "Enemy", category: "enemy", status: 10 },
                    { id: "rel_friend_1", name: "Jimmy Two-Times", type: "Friend", category: "friend", status: 85 }
                ]
            },
            lifeLog: []
        };
    });

    test('Scenario 1: Loaded living character (deathCause: null) renders full Crime Hub without error', () => {
        expect(GameLogic.isAlive(state.gameState.user)).toBe(true);

        renderCrimeDashboard();

        const gameContainer = document.getElementById('game-container');
        expect(gameContainer.innerHTML).toMatch(/Underworld &amp; Crime|Underworld & Crime/);
        expect(gameContainer.innerHTML).toContain('Mischief');
        expect(gameContainer.innerHTML).toMatch(/Street &amp; Petty Crimes|Street & Petty Crimes/);
        expect(gameContainer.innerHTML).toContain('Violent Crimes');
        expect(gameContainer.innerHTML).toContain('High-Stakes Heists');
    });

    test('Scenario 2: Living character successfully executes Pickpocket without "Action Blocked" dead error', () => {
        openCrimeModal('pickpocket');

        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        expect(modalTitle.textContent).toBe('Attempt Pickpocket');
        expect(modalContent.innerHTML).toContain('Execute Pickpocket');
        expect(modalTitle.textContent).not.toBe('Action Blocked');

        commitCrimeAction('pickpocket');

        expect(modalTitle.textContent).not.toBe('Action Blocked');
        expect(['Crime Successful', 'Police Arrest']).toContain(modalTitle.textContent);
    });

    test('Scenario 3: Living character attempts High-Stakes Heist (Bank Robbery) cleanly', () => {
        openCrimeModal('bank_robbery');

        const modalTitle = document.getElementById('modal-title');
        expect(modalTitle.textContent).toBe('Attempt Bank Robbery');

        commitCrimeAction('bank_robbery');
        expect(modalTitle.textContent).not.toBe('Action Blocked');
        expect(['Crime Successful', 'Police Arrest']).toContain(modalTitle.textContent);
    });

    test('Scenario 4: Violent Crime targeting specific relationship contact (Assault on Rival)', () => {
        openCrimeModal('assault');

        const modalContent = document.getElementById('modal-content');
        const modalTitle = document.getElementById('modal-title');

        expect(modalContent.innerHTML).toContain('crime-target-select');
        expect(modalContent.innerHTML).toContain('Don Falcone');

        const targetSelect = document.getElementById('crime-target-select');
        if (targetSelect) targetSelect.value = 'rel_rival_99';

        commitCrimeAction('assault');
        expect(modalTitle.textContent).not.toBe('Action Blocked');
    });

    test('Scenario 5: Teen character (Age 15) engages in juvenile mischief', () => {
        state.gameState.user.age = 15;

        renderCrimeDashboard();

        const gameContainer = document.getElementById('game-container');
        expect(gameContainer.innerHTML).toContain('Adult Underworld Locked');
        expect(gameContainer.innerHTML).toContain('Egg a House');

        openCrimeModal('egging_house');
        const modalTitle = document.getElementById('modal-title');
        expect(modalTitle.textContent).toBe('Attempt Egg a House');

        commitCrimeAction('egging_house');
        expect(modalTitle.textContent).not.toBe('Action Blocked');
        expect(['Crime Successful', 'Caught in the Act!']).toContain(modalTitle.textContent);
    });

    test('Scenario 6: Truly deceased character is immediately blocked with "Action Blocked" notice', () => {
        state.gameState.user.health = 0;
        state.gameState.user.lifeStatus = 'Deceased';
        state.gameState.user.isDead = true;
        state.gameState.user.deathCause = 'Heart Attack';

        expect(GameLogic.isAlive(state.gameState.user)).toBe(false);

        openCrimeModal('pickpocket');

        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');

        expect(modalTitle.textContent).toBe('Action Blocked');
        expect(modalContent.innerHTML).toContain('Cannot commit crimes while dead or at 0 HP');
    });
});
