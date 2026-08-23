import { jest } from '@jest/globals';
import { getAuthToken } from '../../../public/src/auth/auth.js';
import { state } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import { buyPack } from '../../../public/src/features/store/storeScreen.js';

describe('Auth0 Token Lifecycle & Checkout Authentication Resilience', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        state.gameState = {
            user: {
                username: 'TestPlayer',
                purchases: []
            }
        };
        state.userAuthId = 'auth0|test_player_id';
        state.auth0Client = null;
        global.fetch = jest.fn();
    });

    describe('getAuthToken Expiration & Silent Refresh', () => {
        test('returns empty string when auth0Client is not initialized', async () => {
            state.auth0Client = null;
            const token = await getAuthToken();
            expect(token).toBe('');
        });

        test('returns active cached ID token when expiration is in the future', async () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
            state.auth0Client = {
                getIdTokenClaims: jest.fn().mockResolvedValue({
                    __raw: 'valid.active.jwt.token',
                    exp: futureExp,
                    sub: 'auth0|12345'
                }),
                getTokenSilently: jest.fn()
            };

            const token = await getAuthToken();
            expect(token).toBe('valid.active.jwt.token');
            expect(state.auth0Client.getIdTokenClaims).toHaveBeenCalled();
            expect(state.auth0Client.getTokenSilently).not.toHaveBeenCalled();
        });

        test('triggers silent refresh when cached ID token is expired', async () => {
            const pastExp = Math.floor(Date.now() / 1000) - 300; // 5 minutes in past
            state.auth0Client = {
                getIdTokenClaims: jest.fn().mockResolvedValue({
                    __raw: 'expired.old.jwt.token',
                    exp: pastExp,
                    sub: 'auth0|12345'
                }),
                getTokenSilently: jest.fn().mockResolvedValue({
                    id_token: 'freshly.refreshed.jwt.token',
                    access_token: 'access_token_123'
                })
            };

            const token = await getAuthToken();
            expect(state.auth0Client.getTokenSilently).toHaveBeenCalledWith({ detailedResponse: true });
            expect(token).toBe('freshly.refreshed.jwt.token');
        });

        test('triggers silent refresh when cached ID token is expiring within 60s safety buffer', async () => {
            const nearExp = Math.floor(Date.now() / 1000) + 20; // 20s left (< 60s buffer)
            state.auth0Client = {
                getIdTokenClaims: jest.fn().mockResolvedValue({
                    __raw: 'almost.expired.jwt.token',
                    exp: nearExp,
                    sub: 'auth0|12345'
                }),
                getTokenSilently: jest.fn().mockResolvedValue({
                    id_token: 'new.fresh.jwt.token'
                })
            };

            const token = await getAuthToken();
            expect(state.auth0Client.getTokenSilently).toHaveBeenCalled();
            expect(token).toBe('new.fresh.jwt.token');
        });

        test('falls back gracefully to claims if silent refresh throws error', async () => {
            state.auth0Client = {
                getIdTokenClaims: jest.fn().mockResolvedValue({
                    __raw: 'fallback.jwt.token',
                    exp: Math.floor(Date.now() / 1000) - 100
                }),
                getTokenSilently: jest.fn().mockRejectedValue(new Error('Network error or cookies blocked'))
            };

            const token = await getAuthToken();
            expect(token).toBe('fallback.jwt.token');
        });
    });

    describe('buyPack 401 Session Expiration UX', () => {
        test('shows session refresh modal with "Sign In / Refresh Session" button when API returns 401', async () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            state.auth0Client = {
                getIdTokenClaims: jest.fn().mockResolvedValue({
                    __raw: 'jwt.token.string',
                    exp: futureExp
                }),
                getTokenSilently: jest.fn()
            };

            // Simulate backend returning 401 Unauthorized
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({ error: 'Authentication required to start checkout session' })
            });

            const customModalSpy = jest.spyOn(UI, 'showCustomModal').mockImplementation(() => {});

            await buyPack('mafia_syndicate');

            expect(customModalSpy).toHaveBeenCalled();
            const modalArg = customModalSpy.mock.calls[0][0];
            expect(modalArg.title).toBe('Authentication Required');
            expect(modalArg.confirmText).toBe('Sign In / Refresh Session');
            expect(modalArg.content).toContain('Mafia Crime Syndicate Career');
            expect(modalArg.content).toContain('Login Session Refresh Needed');

            customModalSpy.mockRestore();
        });

        test('initiates Stripe checkout session with valid token on 200 response', async () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600;
            state.auth0Client = {
                getIdTokenClaims: jest.fn().mockResolvedValue({
                    __raw: 'valid.token',
                    exp: futureExp
                }),
                getTokenSilently: jest.fn()
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_mock_url' })
            });

            // Suppress jsdom navigation error in test environment
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            await buyPack('mafia_syndicate');

            expect(global.fetch).toHaveBeenCalledWith('/api/create-checkout-session', expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer valid.token'
                }),
                body: JSON.stringify({ packId: 'mafia_syndicate' })
            }));

            consoleErrorSpy.mockRestore();
        });
    });
});
