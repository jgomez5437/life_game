/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import Stripe from 'stripe';
import verifyHandler from '../../api/verify-checkout-session.js';
import { clearRateLimits } from '../../api/lib/rateLimit.js';
import { setTestAuthVerifier } from '../../api/lib/verifyAuth.js';
import { Readable } from 'stream';

function createMockReqRes({ method = 'POST', body = null, headers = {}, ip = '127.0.0.1' } = {}) {
    const rawString = body !== null ? JSON.stringify(body) : '';
    const bodyBuffer = Buffer.from(rawString);

    const stream = Readable.from(bodyBuffer);
    const req = Object.assign(stream, {
        method,
        body: body || {},
        headers: {
            ...headers,
            'x-forwarded-for': ip
        },
        socket: { remoteAddress: ip }
    });

    const resHeaders = {};
    let statusCode = 200;
    let jsonBody = null;
    let sentText = null;

    const res = {
        setHeader: (k, v) => { resHeaders[k.toLowerCase()] = String(v); },
        getHeader: (k) => resHeaders[k.toLowerCase()],
        status: (code) => {
            statusCode = code;
            return res;
        },
        json: (data) => {
            jsonBody = data;
            return data;
        },
        send: (text) => {
            sentText = text;
            return text;
        },
        _getStatusCode: () => statusCode,
        _getJsonBody: () => jsonBody,
        _getSentText: () => sentText
    };

    return { req, res };
}

describe('Stripe verify-checkout-session Security & Anti-Hijacking', () => {
    const originalSecret = process.env.STRIPE_SECRET_KEY;
    let mockRetrieve = null;
    let originalRetrieve = null;

    beforeAll(() => {
        const tempStripe = new Stripe('sk_test_mock');
        const sessionsProto = Object.getPrototypeOf(tempStripe.checkout.sessions);
        originalRetrieve = sessionsProto.retrieve;
        sessionsProto.retrieve = async function (...args) {
            if (mockRetrieve) {
                return mockRetrieve.apply(this, args);
            }
            return originalRetrieve.apply(this, args);
        };
    });

    afterAll(() => {
        const tempStripe = new Stripe('sk_test_mock');
        const sessionsProto = Object.getPrototypeOf(tempStripe.checkout.sessions);
        sessionsProto.retrieve = originalRetrieve;
    });

    beforeEach(() => {
        clearRateLimits();
        process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key';
        setTestAuthVerifier((req) => {
            const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Missing or invalid Authorization header');
            }
            const token = authHeader.split(' ')[1];
            if (token === 'token_alice') return 'auth0|alice';
            if (token === 'token_attacker') return 'auth0|attacker';
            return 'auth0|default_user';
        });
    });

    afterEach(() => {
        process.env.STRIPE_SECRET_KEY = originalSecret;
        setTestAuthVerifier(null);
        mockRetrieve = null;
    });

    test('rejects non-POST HTTP methods with 405', async () => {
        const { req, res } = createMockReqRes({ method: 'GET' });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(405);
        expect(res._getJsonBody()).toEqual({ error: 'Method Not Allowed' });
    });

    test('rejects missing or empty sessionId with 400', async () => {
        const { req, res } = createMockReqRes({
            method: 'POST',
            body: {}
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJsonBody().error).toContain('Missing or invalid sessionId');
    });

    test('rejects non-string sessionId with 400', async () => {
        const { req, res } = createMockReqRes({
            method: 'POST',
            body: { sessionId: 12345 }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJsonBody().error).toContain('Missing or invalid sessionId');
    });

    test('returns 500 when STRIPE_SECRET_KEY is not configured', async () => {
        delete process.env.STRIPE_SECRET_KEY;
        const { req, res } = createMockReqRes({
            method: 'POST',
            body: { sessionId: 'cs_test_123' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(500);
        expect(res._getJsonBody().error).toContain('Stripe secret key not configured');
    });

    test('rejects unpaid checkout session with 400', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_unpaid',
            payment_status: 'unpaid',
            amount_total: 299,
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_alice' },
            body: { sessionId: 'cs_test_unpaid' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJsonBody().verified).toBe(false);
        expect(res._getJsonBody().error).toContain('Payment not completed');
    });

    test('PREVENTS HIJACKING: rejects attacker with different Auth0 token with 403', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_alice_session',
            payment_status: 'paid',
            amount_total: 299,
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        // Attacker sends Alice's sessionId with Attacker's bearer token
        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_attacker' },
            body: { sessionId: 'cs_test_alice_session' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(403);
        expect(res._getJsonBody().verified).toBe(false);
        expect(res._getJsonBody().error).toBe('Session belongs to a different authenticated user.');
    });

    test('PREVENTS UNAUTHENTICATED BYPASS: rejects request without token with 401 when session belongs to authenticated user', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_alice_session',
            payment_status: 'paid',
            amount_total: 299,
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        // Attacker sends Alice's sessionId with NO Authorization header
        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: {},
            body: { sessionId: 'cs_test_alice_session' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(401);
        expect(res._getJsonBody().verified).toBe(false);
        expect(res._getJsonBody().error).toBe('Authentication required to verify this checkout session.');
    });

    test('SUCCESSFUL VERIFICATION: accepts request when caller is the legitimate session owner', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_alice_session',
            payment_status: 'paid',
            amount_total: 299,
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_alice' },
            body: { sessionId: 'cs_test_alice_session' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(200);
        expect(res._getJsonBody().verified).toBe(true);
        expect(res._getJsonBody().success).toBe(true);
        expect(res._getJsonBody().packId).toBe('god_mode');
        expect(res._getJsonBody().amountPaid).toBe(299);
    });

    test('GUEST SESSION HANDLING: handles session with user_auth_id = guest without requiring auth or DB insert', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_guest_session',
            payment_status: 'paid',
            amount_total: 299,
            metadata: { pack_id: 'god_mode', user_auth_id: 'guest' }
        });

        const { req, res } = createMockReqRes({
            method: 'POST',
            body: { sessionId: 'cs_test_guest_session' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(200);
        expect(res._getJsonBody().verified).toBe(true);
        expect(res._getJsonBody().packId).toBe('god_mode');
    });

    test('REJECTS INVALID PACK: rejects unknown pack_id in session metadata', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_fake_pack',
            payment_status: 'paid',
            amount_total: 299,
            metadata: { pack_id: 'cheat_pack_999', user_auth_id: 'auth0|alice' }
        });

        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_alice' },
            body: { sessionId: 'cs_test_fake_pack' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJsonBody().verified).toBe(false);
        expect(res._getJsonBody().error).toContain('Invalid or unknown pack_id');
    });

    test('PRICE TAMPER GUARD: rejects underpaid session amount', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_underpaid',
            payment_status: 'paid',
            amount_total: 99, // Expected 299 for god_mode
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_alice' },
            body: { sessionId: 'cs_test_underpaid' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
        expect(res._getJsonBody().verified).toBe(false);
        expect(res._getJsonBody().error).toContain('Price mismatch detected');
    });

    test('PRICE TAMPER GUARD: accepts session with legitimate promo discount', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_discounted',
            payment_status: 'paid',
            amount_total: 199,
            total_details: { amount_discount: 100 }, // 199 + 100 = 299
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_alice' },
            body: { sessionId: 'cs_test_discounted' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(200);
        expect(res._getJsonBody().verified).toBe(true);
        expect(res._getJsonBody().amountPaid).toBe(199);
    });

    test('RATE LIMITING: enforces rate limit and returns 429 when threshold exceeded', async () => {
        mockRetrieve = async () => ({
            id: 'cs_test_session',
            payment_status: 'paid',
            amount_total: 299,
            metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|alice' }
        });

        // RATE_LIMIT_CONFIGS.checkout is 10 requests / min
        for (let i = 0; i < 10; i++) {
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'Authorization': 'Bearer token_alice' },
                body: { sessionId: 'cs_test_session' }
            });
            await verifyHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
        }

        // 11th request should exceed rate limit
        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { 'Authorization': 'Bearer token_alice' },
            body: { sessionId: 'cs_test_session' }
        });
        await verifyHandler(req, res);
        expect(res._getStatusCode()).toBe(429);
        expect(res._getJsonBody().error).toBe('Too Many Requests');
    });
});
