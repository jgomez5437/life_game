import { jest } from '@jest/globals';
import { state } from '../../../public/src/core/state.js';
import { UI } from '../../../public/src/ui/ui.js';
import { submitCharacter } from '../../../public/src/features/player/charCreationScreen.js';

describe('Character Creation Screen Suite', () => {
    let originalFetch;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="game-container"></div>
            <input id="inp-name" value="Test Hero" />
            <select id="inp-country"><option value="United States" selected>United States</option></select>
            <select id="inp-city"><option value="New York" selected>New York</option></select>
        `;

        originalFetch = global.fetch;
        state.gameState = null;
        state.auth0Client = null;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    test('submitCharacter sends Authorization header with Bearer token when user is authenticated', async () => {
        const mockUser = {
            sub: 'auth0|123456789',
            email: 'test@example.com',
            nickname: 'Hero'
        };

        state.auth0Client = {
            getUser: jest.fn().mockResolvedValue(mockUser),
            getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: 'mock_jwt_token_abc123' })
        };

        const mockApiResponse = {
            auth0_id: 'auth0|123456789',
            email: 'test@example.com',
            game_data: {
                user: {
                    username: 'Test Hero',
                    gender: 'male',
                    city: 'New York',
                    age: 0,
                    stats: { health: 100, happiness: 100, smarts: 50, looks: 50 }
                }
            }
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(mockApiResponse)
        });
        global.fetch = fetchSpy;

        await submitCharacter();

        expect(fetchSpy).toHaveBeenCalledWith('/api/login', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mock_jwt_token_abc123'
            })
        }));
    });

    test('submitCharacter handles API 401 failure gracefully and shows error modal', async () => {
        const mockUser = {
            sub: 'auth0|123456789',
            email: 'test@example.com',
            nickname: 'Hero'
        };

        state.auth0Client = {
            getUser: jest.fn().mockResolvedValue(mockUser),
            getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: 'mock_jwt_token_abc123' })
        };

        const fetchSpy = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            json: jest.fn().mockResolvedValue({ error: 'Authentication required' })
        });
        global.fetch = fetchSpy;

        const showModalSpy = jest.spyOn(UI, 'showModal').mockImplementation(() => {});

        await submitCharacter();

        expect(showModalSpy).toHaveBeenCalledWith("Error", "Failed to create character.");
    });
});
