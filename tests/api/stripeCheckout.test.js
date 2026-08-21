/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import Stripe from 'stripe';
import { PACK_CATALOG, PRICE_TO_PACK, getPackById, getPackByPriceId, resolvePack, VALID_PACK_IDS } from '../../api/lib/validation.js';
import checkoutHandler from '../../api/create-checkout-session.js';
import webhookHandler from '../../api/stripe-webhook.js';
import { clearRateLimits } from '../../api/lib/rateLimit.js';
import { setTestAuthVerifier } from '../../api/lib/verifyAuth.js';

import { Readable } from 'stream';

function createMockReqRes({ method = 'POST', body = null, rawPayload = null, headers = {}, ip = '127.0.0.1' } = {}) {
    const rawString = rawPayload !== null ? rawPayload : (body !== null ? JSON.stringify(body) : '');
    const bodyBuffer = Buffer.from(rawString);
    let parsedBody = body;
    if (parsedBody === null && rawString) {
        try {
            parsedBody = JSON.parse(rawString);
        } catch (_) {}
    }

    const stream = Readable.from(bodyBuffer);
    const req = Object.assign(stream, {
        method,
        body: parsedBody || {},
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

describe('C-6 Stripe Checkout & Webhook Security Hardening', () => {

    beforeEach(() => {
        clearRateLimits();
    });

    describe('Server-Authoritative PACK_CATALOG and Lookups', () => {
        test('PACK_CATALOG has all required fields for each pack', () => {
            for (const [key, pack] of Object.entries(PACK_CATALOG)) {
                expect(pack.id).toBe(key);
                expect(typeof pack.name).toBe('string');
                expect(typeof pack.amount).toBe('number');
                expect(pack.amount).toBeGreaterThan(0);
                expect(pack.currency).toBe('usd');
                expect(typeof pack.available).toBe('boolean');
            }
        });

        test('VALID_PACK_IDS reflects all packs in PACK_CATALOG', () => {
            expect(VALID_PACK_IDS.has('god_mode')).toBe(true);
            expect(VALID_PACK_IDS.has('instant_diplomas')).toBe(true);
            expect(VALID_PACK_IDS.has('time_machine')).toBe(true);
            expect(VALID_PACK_IDS.has('vip_supporter')).toBe(true);
            expect(VALID_PACK_IDS.has('mafia_syndicate')).toBe(true);
            expect(VALID_PACK_IDS.has('artist_pack')).toBe(true);
            expect(VALID_PACK_IDS.size).toBe(Object.keys(PACK_CATALOG).length);
        });

        test('getPackById returns pack for valid IDs and null for invalid', () => {
            expect(getPackById('god_mode')).not.toBeNull();
            expect(getPackById('god_mode').amount).toBe(299);
            expect(getPackById('invalid_pack_id')).toBeNull();
            expect(getPackById(null)).toBeNull();
            expect(getPackById(123)).toBeNull();
        });

        test('getPackByPriceId returns pack for mapped price IDs and null for unknown', () => {
            expect(getPackByPriceId('price_god_mode')).not.toBeNull();
            expect(getPackByPriceId('price_god_mode').id).toBe('god_mode');
            expect(getPackByPriceId('price_unknown_12345')).toBeNull();
            expect(getPackByPriceId(null)).toBeNull();
        });
    });

    describe('resolvePack Cross-Parameter Resolution', () => {
        test('resolves pack when only packId is provided', () => {
            const result = resolvePack('god_mode');
            expect(result.pack).toBeDefined();
            expect(result.pack.id).toBe('god_mode');
            expect(result.pack.amount).toBe(299);
            expect(result.error).toBeUndefined();
        });

        test('resolves pack when only priceId is provided', () => {
            const result = resolvePack(null, 'price_time_machine');
            expect(result.pack).toBeDefined();
            expect(result.pack.id).toBe('time_machine');
            expect(result.pack.amount).toBe(199);
        });

        test('resolves pack when matching packId and priceId are provided', () => {
            const result = resolvePack('god_mode', 'price_god_mode');
            expect(result.pack).toBeDefined();
            expect(result.pack.id).toBe('god_mode');
            expect(result.error).toBeUndefined();
        });

        test('rejects mismatched packId and priceId (Price Tampering Prevention)', () => {
            // Attacker sends cheap price with expensive pack
            const result = resolvePack('god_mode', 'price_time_machine');
            expect(result.error).toBe('Price ID does not match pack ID');
            expect(result.status).toBe(400);
            expect(result.pack).toBeUndefined();
        });

        test('rejects missing both packId and priceId', () => {
            const result = resolvePack(null, null);
            expect(result.error).toBe('Missing packId or priceId');
            expect(result.status).toBe(400);
        });

        test('rejects invalid packId', () => {
            const result = resolvePack('nonexistent_pack');
            expect(result.error).toContain('pack not found');
            expect(result.status).toBe(400);
        });

        test('rejects invalid priceId', () => {
            const result = resolvePack(null, 'price_fake_999');
            expect(result.error).toContain('price not found');
            expect(result.status).toBe(400);
        });

        test('rejects unreleased/coming_soon packs', () => {
            const result = resolvePack('artist_pack');
            expect(result.error).toContain('not currently available');
            expect(result.status).toBe(400);
        });
    });

    describe('create-checkout-session Endpoint', () => {
        const originalEnv = process.env.STRIPE_SECRET_KEY;

        beforeEach(() => {
            setTestAuthVerifier((req) => {
                const authHeader = req.headers?.['authorization'] || req.headers?.['Authorization'];
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    throw new Error('Missing or invalid Authorization header');
                }
                return 'auth0|test_user_123';
            });
        });

        afterEach(() => {
            process.env.STRIPE_SECRET_KEY = originalEnv;
            setTestAuthVerifier(null);
        });

        test('rejects non-POST HTTP methods', async () => {
            const { req, res } = createMockReqRes({ method: 'GET' });
            await checkoutHandler(req, res);
            expect(res._getStatusCode()).toBe(405);
            expect(res._getJsonBody()).toEqual({ error: 'Method Not Allowed' });
        });

        test('rejects unauthenticated requests with 401 (Authentication Required)', async () => {
            // No Authorization header provided
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: {},
                body: { packId: 'god_mode' }
            });
            await checkoutHandler(req, res);
            expect(res._getStatusCode()).toBe(401);
            expect(res._getJsonBody().error).toBe('Authentication required to start checkout session');
        });

        test('rejects requests with missing packId/priceId for authenticated users', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'authorization': 'Bearer mock_valid_token' },
                body: {}
            });
            await checkoutHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJsonBody().error).toBe('Missing packId or priceId');
        });

        test('rejects requests with mismatched priceId and packId for authenticated users', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'authorization': 'Bearer mock_valid_token' },
                body: { packId: 'god_mode', priceId: 'price_time_machine' }
            });
            await checkoutHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJsonBody().error).toBe('Price ID does not match pack ID');
        });

        test('rejects requests for coming soon packs for authenticated users', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'authorization': 'Bearer mock_valid_token' },
                body: { packId: 'artist_pack' }
            });
            await checkoutHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJsonBody().error).toContain('not currently available');
        });

        test('returns sandbox response gracefully if STRIPE_SECRET_KEY is missing for authenticated users', async () => {
            delete process.env.STRIPE_SECRET_KEY;
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'authorization': 'Bearer mock_valid_token' },
                body: { packId: 'god_mode' }
            });
            await checkoutHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody().sandbox).toBe(true);
        });

        test('creates Stripe checkout session with server-defined price amount and authenticated user metadata', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_123';
            let createdSessionArgs = null;

            const tempStripe = new Stripe('sk_test_123');
            const sessionsProto = Object.getPrototypeOf(tempStripe.checkout.sessions);
            const originalCreate = sessionsProto.create;

            sessionsProto.create = async function (args) {
                createdSessionArgs = args;
                return { url: 'https://checkout.stripe.com/c/pay/cs_test_mock' };
            };

            try {
                const { req, res } = createMockReqRes({
                    method: 'POST',
                    headers: { 'authorization': 'Bearer mock_valid_token' },
                    body: { packId: 'god_mode' }
                });
                await checkoutHandler(req, res);

                expect(res._getStatusCode()).toBe(200);
                expect(res._getJsonBody().url).toBe('https://checkout.stripe.com/c/pay/cs_test_mock');
                expect(createdSessionArgs).not.toBeNull();
                // Verify server-authoritative amount ($2.99 = 299 cents) is enforced
                expect(createdSessionArgs.line_items[0].price_data.unit_amount).toBe(299);
                expect(createdSessionArgs.line_items[0].price_data.product_data.name).toBe('God Mode & Stat Editor');
                expect(createdSessionArgs.metadata.pack_id).toBe('god_mode');
                expect(createdSessionArgs.metadata.user_auth_id).toBe('auth0|test_user_123');
                expect(createdSessionArgs.success_url).toContain('session_id={CHECKOUT_SESSION_ID}');
            } finally {
                sessionsProto.create = originalCreate;
            }
        });
    });

    describe('stripe-webhook Endpoint Price & Tampering Verification', () => {
        const webhookSecret = 'whsec_test_mock_secret_key_123';
        const originalSecret = process.env.STRIPE_SECRET_KEY;
        const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        beforeEach(() => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
            process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
        });

        afterEach(() => {
            process.env.STRIPE_SECRET_KEY = originalSecret;
            process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
        });

        test('rejects non-POST HTTP methods', async () => {
            const { req, res } = createMockReqRes({ method: 'GET' });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(405);
        });

        test('returns 400 if Stripe Webhook Secret is not configured', async () => {
            delete process.env.STRIPE_WEBHOOK_SECRET;
            const { req, res } = createMockReqRes({ method: 'POST', body: {} });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getJsonBody().error).toContain('not configured');
        });

        test('returns 400 if webhook signature verification fails', async () => {
            const rawPayload = JSON.stringify({ type: 'checkout.session.completed' });
            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'stripe-signature': 't=12345,v1=invalidsig' },
                rawPayload
            });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
            expect(res._getSentText()).toContain('Webhook Error:');
        });

        test('ignores checkout session when payment_status is not paid', async () => {
            const rawPayload = JSON.stringify({
                id: 'evt_unpaid_1',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_unpaid',
                        payment_status: 'unpaid',
                        amount_total: 299,
                        metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|123' }
                    }
                }
            });
            const sig = Stripe.webhooks.generateTestHeaderString({ payload: rawPayload, secret: webhookSecret });

            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'stripe-signature': sig },
                rawPayload
            });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody().ignored).toBe('unpaid');
        });

        test('rejects underpaid session (Price Tampering Prevention)', async () => {
            const rawPayload = JSON.stringify({
                id: 'evt_underpaid_1',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_underpaid',
                        payment_status: 'paid',
                        amount_total: 99, // Paid $0.99 for a $2.99 pack
                        metadata: { pack_id: 'god_mode', user_auth_id: 'auth0|123' }
                    }
                }
            });
            const sig = Stripe.webhooks.generateTestHeaderString({ payload: rawPayload, secret: webhookSecret });

            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'stripe-signature': sig },
                rawPayload
            });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody().error).toBe('Price mismatch detected');
        });

        test('rejects tampered or invalid pack_id in metadata', async () => {
            const rawPayload = JSON.stringify({
                id: 'evt_fake_pack_1',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_fake_pack',
                        payment_status: 'paid',
                        amount_total: 299,
                        metadata: { pack_id: 'nonexistent_pack_cheat', user_auth_id: 'auth0|123' }
                    }
                }
            });
            const sig = Stripe.webhooks.generateTestHeaderString({ payload: rawPayload, secret: webhookSecret });

            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'stripe-signature': sig },
                rawPayload
            });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody().error).toBe('Invalid pack_id in metadata');
        });

        test('handles guest checkout session without database error or invalid DB insert', async () => {
            const rawPayload = JSON.stringify({
                id: 'evt_guest_1',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_guest',
                        payment_status: 'paid',
                        amount_total: 299,
                        metadata: { pack_id: 'god_mode', user_auth_id: 'guest' }
                    }
                }
            });
            const sig = Stripe.webhooks.generateTestHeaderString({ payload: rawPayload, secret: webhookSecret });

            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'stripe-signature': sig },
                rawPayload
            });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody().guest).toBe(true);
        });

        test('accepts paid session with legitimate discount', async () => {
            const rawPayload = JSON.stringify({
                id: 'evt_discounted_1',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_discounted',
                        payment_status: 'paid',
                        amount_total: 199,
                        total_details: { amount_discount: 100 }, // 199 + 100 = 299
                        metadata: { pack_id: 'god_mode', user_auth_id: 'guest' }
                    }
                }
            });
            const sig = Stripe.webhooks.generateTestHeaderString({ payload: rawPayload, secret: webhookSecret });

            const { req, res } = createMockReqRes({
                method: 'POST',
                headers: { 'stripe-signature': sig },
                rawPayload
            });
            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody().received).toBe(true);
        });
    });
});
