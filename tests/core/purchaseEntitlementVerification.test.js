import { jest } from '@jest/globals';
import { state, hasPurchasedPack, setVerifiedPurchases } from '../../public/src/core/state.js';
import { initGame } from '../../public/src/core/main.js';
import { logout } from '../../public/src/auth/auth.js';
import { UI } from '../../public/src/ui/ui.js';

describe('Purchase Entitlement Verification & URL Parameter Security', () => {
    let originalFetch;
    let mockAuth0Client;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <div id="avatar-container"></div>
            <div id="header-name"></div>
            <div id="header-age"></div>
            <div id="header-bank"></div>
            <div id="modal-overlay" class="hidden">
                <div id="modal-title"></div>
                <div id="modal-content"></div>
                <div id="modal-actions"></div>
                <button id="modal-close-btn" class="hidden"></button>
            </div>
        `;

        originalFetch = global.fetch;
        state.gameState = null;
        state.userAuthId = null;
        state.userEmail = null;
        state.verifiedPurchases = null;
        localStorage.clear();
        jest.restoreAllMocks();

        mockAuth0Client = {
            isAuthenticated: jest.fn().mockResolvedValue(true),
            getUser: jest.fn().mockResolvedValue({
                sub: 'auth0|test_security_user',
                email: 'security@example.com',
                nickname: 'SecTester'
            }),
            getIdTokenClaims: jest.fn().mockResolvedValue({
                __raw: 'valid_test_token',
                exp: Math.floor(Date.now() / 1000) + 3600
            }),
            getTokenSilently: jest.fn().mockResolvedValue({
                id_token: 'valid_test_token'
            }),
            logout: jest.fn().mockResolvedValue()
        };
        state.auth0Client = mockAuth0Client;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        localStorage.clear();
        window.history.replaceState({}, '', '/');
        jest.restoreAllMocks();
    });

    test('Spoofed URL parameter without session_id NEVER unlocks entitlements or writes to localStorage', async () => {
        window.history.pushState({}, '', '/?purchase_success=true&pack_id=god_mode');

        const showModalSpy = jest.spyOn(UI, 'showModal');

        global.fetch = jest.fn((url) => {
            if (typeof url === 'string' && url.startsWith('/api/load')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        game_data: {
                            user: { username: 'SecTester', age: 20, purchases: [] },
                            stats: { age: 20 }
                        }
                    })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/getPurchases')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({ purchases: [] })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        await initGame();

        // 1. Must NOT be granted in hasPurchasedPack
        expect(hasPurchasedPack('god_mode')).toBe(false);

        // 2. Must NOT be written to life_game_purchases in localStorage
        const localStored = localStorage.getItem('life_game_purchases');
        const parsed = localStored ? JSON.parse(localStored) : [];
        expect(parsed).not.toContain('god_mode');

        // 3. Must NOT be in gameState.user.purchases
        expect(state.gameState?.user?.purchases || []).not.toContain('god_mode');

        // 4. URL parameters must be sanitized
        expect(window.location.search).toBe('');

        // 5. Must display "Purchase Unverified" notification
        expect(showModalSpy).toHaveBeenCalledWith(
            'Purchase Unverified',
            expect.stringContaining('could not verify your payment session')
        );
    });

    test('Spoofed URL with invalid session_id rejected by backend does NOT grant entitlements', async () => {
        window.history.pushState({}, '', '/?purchase_success=true&pack_id=god_mode&session_id=cs_fake_exploit_session');

        const showModalSpy = jest.spyOn(UI, 'showModal');

        global.fetch = jest.fn((url) => {
            if (typeof url === 'string' && url.startsWith('/api/verify-checkout-session')) {
                return Promise.resolve({
                    ok: false,
                    status: 400,
                    json: async () => ({ verified: false, error: 'Invalid checkout session' })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/load')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        game_data: {
                            user: { username: 'SecTester', age: 20, purchases: [] },
                            stats: { age: 20 }
                        }
                    })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/getPurchases')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({ purchases: [] })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        await initGame();

        expect(hasPurchasedPack('god_mode')).toBe(false);
        const localStored = localStorage.getItem('life_game_purchases');
        const parsed = localStored ? JSON.parse(localStored) : [];
        expect(parsed).not.toContain('god_mode');
        expect(showModalSpy).toHaveBeenCalledWith(
            'Purchase Unverified',
            expect.stringContaining('could not verify your payment session')
        );
    });

    test('Legitimate session verified by backend properly unlocks pack and updates local cache', async () => {
        window.history.pushState({}, '', '/?purchase_success=true&pack_id=god_mode&session_id=cs_real_verified_session');

        global.fetch = jest.fn((url) => {
            if (typeof url === 'string' && url.startsWith('/api/verify-checkout-session')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({ verified: true, packId: 'god_mode' })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/load')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        game_data: {
                            user: { username: 'SecTester', age: 20, purchases: ['god_mode'] },
                            stats: { age: 20 }
                        }
                    })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/getPurchases')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({ purchases: ['god_mode'] })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/save')) {
                return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true }) });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        await initGame();

        expect(hasPurchasedPack('god_mode')).toBe(true);
        const localStored = localStorage.getItem('life_game_purchases');
        const parsed = localStored ? JSON.parse(localStored) : [];
        expect(parsed).toContain('god_mode');
        expect(state.gameState?.user?.purchases).toContain('god_mode');
    });

    test('Guest user visiting spoofed URL does not gain entitlements and has URL cleaned', async () => {
        mockAuth0Client.isAuthenticated.mockResolvedValue(false);
        window.history.pushState({}, '', '/?purchase_success=true&pack_id=god_mode');

        await initGame();

        expect(hasPurchasedPack('god_mode')).toBe(false);
        const localStored = localStorage.getItem('life_game_purchases');
        const parsed = localStored ? JSON.parse(localStored) : [];
        expect(parsed).not.toContain('god_mode');
        expect(window.location.search).toBe('');
    });

    test('Authoritative syncPurchasesFromCloud purges forged items from localStorage', async () => {
        // Pre-pollute localStorage with forged purchases
        localStorage.setItem('life_game_purchases', JSON.stringify(['god_mode', 'vip_supporter']));

        global.fetch = jest.fn((url) => {
            if (typeof url === 'string' && url.startsWith('/api/load')) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        game_data: {
                            user: { username: 'SecTester', age: 20, purchases: ['instant_diplomas'] },
                            stats: { age: 20 }
                        }
                    })
                });
            }
            if (typeof url === 'string' && url.startsWith('/api/getPurchases')) {
                // Server authoritatively returns only instant_diplomas
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({ purchases: ['instant_diplomas'] })
                });
            }
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        });

        await initGame();
        // Give background syncPurchasesFromCloud a moment to settle
        await new Promise(r => setTimeout(r, 50));

        // Local storage cache must be reconciled with server truth
        const localStored = localStorage.getItem('life_game_purchases');
        const parsed = localStored ? JSON.parse(localStored) : [];
        expect(parsed).toEqual(['instant_diplomas']);
        expect(parsed).not.toContain('god_mode');
        expect(parsed).not.toContain('vip_supporter');

        expect(hasPurchasedPack('god_mode')).toBe(false);
        expect(hasPurchasedPack('vip_supporter')).toBe(false);
        expect(hasPurchasedPack('instant_diplomas')).toBe(true);
    });

    test('Logout clears life_game_purchases cache and resets verifiedPurchases', async () => {
        localStorage.setItem('life_game_purchases', JSON.stringify(['god_mode']));
        setVerifiedPurchases(['god_mode']);
        state.userAuthId = 'auth0|test_user';

        expect(hasPurchasedPack('god_mode')).toBe(true);

        await logout();

        expect(localStorage.getItem('life_game_purchases')).toBeNull();
        expect(state.verifiedPurchases).toBeNull();
        expect(hasPurchasedPack('god_mode')).toBe(false);
    });
});
