/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import { Readable } from 'stream';
import Stripe from 'stripe';

import {
    hasDangerousKeys,
    checkPayloadSize,
    validateInitialUserPayload,
    MAX_FEEDBACK_PAYLOAD_BYTES
} from '../../api/lib/validation.js';
import {
    checkRateLimit,
    clearRateLimits,
    getClientIp,
    getRateLimitStoreSize,
    MAX_STORE_KEYS
} from '../../api/lib/rateLimit.js';
import { setTestAuthVerifier } from '../../api/lib/verifyAuth.js';
import feedbackHandler from '../../api/feedback.js';
import loginHandler from '../../api/login.js';
import saveGameHandler from '../../api/saveGame.js';
import getPurchasesHandler from '../../api/getPurchases.js';
import webhookHandler from '../../api/stripe-webhook.js';
import { resolveOrigin } from '../../api/create-checkout-session.js';
import { deepClone, sanitizeGameState, migrateState } from '../../public/src/core/saveSlotManager.js';

function createMockReqRes({ method = 'POST', body = {}, headers = {}, ip = '127.0.0.1', rawPayload = null } = {}) {
    const req = rawPayload !== null
        ? Object.assign(Readable.from(Buffer.from(rawPayload)), {
            method,
            body,
            headers: { ...headers },
            socket: { remoteAddress: ip }
        })
        : {
            method,
            body,
            headers: { ...headers },
            socket: { remoteAddress: ip }
        };

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
        _getSentText: () => sentText,
        _getHeaders: () => resHeaders
    };

    return { req, res };
}

describe('Security Hardening & Production Readiness', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        clearRateLimits();
        setTestAuthVerifier(async () => 'auth0|security_test_user');
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        setTestAuthVerifier(null);
        jest.restoreAllMocks();
    });

    describe('Recursion Depth & Payload Size Bounds (DoS Prevention)', () => {
        test('hasDangerousKeys rejects nesting deeper than 32 without throwing RangeError', () => {
            let deep = { ok: true };
            for (let i = 0; i < 60; i++) {
                deep = { nested: deep };
            }
            expect(() => hasDangerousKeys(deep)).not.toThrow();
            expect(hasDangerousKeys(deep)).toBe(true);
        });

        test('hasDangerousKeys rejects payloads with excessive object node counts (> 10000)', () => {
            const hugeArray = Array.from({ length: 10500 }, () => ({ a: 1 }));
            expect(hasDangerousKeys({ items: hugeArray })).toBe(true);
        });

        test('checkPayloadSize enforces actual body size even if content-length header is spoofed', () => {
            const oversizedMessage = 'a'.repeat(MAX_FEEDBACK_PAYLOAD_BYTES + 200);
            const { req } = createMockReqRes({
                body: { category: 'bug', message: oversizedMessage },
                headers: { 'content-length': '10' }
            });
            const check = checkPayloadSize(req, MAX_FEEDBACK_PAYLOAD_BYTES);
            expect(check.ok).toBe(false);
            expect(check.size).toBeGreaterThan(MAX_FEEDBACK_PAYLOAD_BYTES);
        });

        test('feedback endpoint returns 413 when body exceeds limit despite spoofed content-length', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                body: { category: 'general', message: 'x'.repeat(MAX_FEEDBACK_PAYLOAD_BYTES + 500) },
                headers: { 'content-length': '20' }
            });
            await feedbackHandler(req, res);
            expect(res._getStatusCode()).toBe(413);
        });
    });

    describe('Rate Limiter IP Spoofing & Memory Cap', () => {
        test('getClientIp trusts x-vercel-forwarded-for and x-real-ip ahead of x-forwarded-for', () => {
            const vercelReq = {
                headers: {
                    'x-vercel-forwarded-for': '198.51.100.10',
                    'x-real-ip': '198.51.100.11',
                    'x-forwarded-for': '203.0.113.99'
                }
            };
            expect(getClientIp(vercelReq)).toBe('198.51.100.10');

            const realIpReq = {
                headers: {
                    'x-real-ip': '198.51.100.11',
                    'x-forwarded-for': '203.0.113.99'
                }
            };
            expect(getClientIp(realIpReq)).toBe('198.51.100.11');
        });

        test('rateLimitStore bounds memory to MAX_STORE_KEYS via eviction', () => {
            const config = { maxRequests: 5, windowMs: 60_000 };
            for (let i = 0; i < MAX_STORE_KEYS + 100; i++) {
                const { req, res } = createMockReqRes({
                    headers: { 'x-real-ip': `10.${Math.floor(i / 65536)}.${Math.floor(i / 256) % 256}.${i % 256}` }
                });
                checkRateLimit(req, res, 'testEndpoint', config);
            }
            expect(getRateLimitStoreSize()).toBeLessThanOrEqual(MAX_STORE_KEYS);
        });
    });

    describe('Origin Allowlist Enforcement (Open Redirect / CSRF Defense)', () => {
        test('rejects arbitrary *.vercel.app and localhost origins in production', () => {
            process.env.VERCEL_ENV = 'production';
            delete process.env.ALLOWED_ORIGIN;
            delete process.env.VERCEL_URL;
            delete process.env.VERCEL_BRANCH_URL;

            expect(resolveOrigin({ headers: { origin: 'https://evil-phish.vercel.app' } })).toBe('https://startalife.app');
            expect(resolveOrigin({ headers: { origin: 'http://localhost:5173' } })).toBe('https://startalife.app');
            expect(resolveOrigin({ headers: { origin: 'https://startalife.app' } })).toBe('https://startalife.app');
            expect(resolveOrigin({ headers: { origin: 'https://life-game-git-main-jgomez5437.vercel.app' } })).toBe('https://life-game-git-main-jgomez5437.vercel.app');
        });
    });

    describe('Login Endpoint Input Validation', () => {
        test('rejects malformed JSON string body with 400', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                body: '{invalid-json'
            });
            await loginHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
        });

        test('rejects oversized login payload with 413', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                body: { username: 'a'.repeat(70 * 1024) }
            });
            await loginHandler(req, res);
            expect(res._getStatusCode()).toBe(413);
        });

        test('rejects prototype pollution keys in validateInitialUserPayload', () => {
            const malicious = JSON.parse('{"username":"Alice","__proto__":{"isAdmin":true}}');
            const result = validateInitialUserPayload(malicious);
            expect(result.ok).toBe(false);
        });

        test('rejects non-array relationships in /api/login with 400', async () => {
            const { req, res } = createMockReqRes({
                method: 'POST',
                body: { username: 'Alice', relationships: 'not-an-array' }
            });
            await loginHandler(req, res);
            expect(res._getStatusCode()).toBe(400);
        });
    });

    describe('Stripe Webhook Stream Limit & Retry Behavior', () => {
        test('rejects webhook streams exceeding 128 KB with HTTP 413', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
            process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake';

            const oversizedStream = 'x'.repeat(130 * 1024);
            const { req, res } = createMockReqRes({
                method: 'POST',
                rawPayload: oversizedStream,
                headers: { 'stripe-signature': 't=1,v1=sig' }
            });

            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(413);
        });

        test('returns HTTP 500 when DB persistence fails and POSTGRES_URL is configured', async () => {
            process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
            const webhookSecret = 'whsec_test_fake';
            process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
            process.env.POSTGRES_URL = 'postgres://invalid:invalid@127.0.0.1:1/nonexistent';

            const rawPayload = JSON.stringify({
                id: 'evt_test_db_fail',
                object: 'event',
                type: 'checkout.session.completed',
                data: {
                    object: {
                        id: 'cs_test_123456',
                        payment_status: 'paid',
                        amount_total: 299,
                        currency: 'usd',
                        metadata: {
                            user_auth_id: 'auth0|user123',
                            pack_id: 'god_mode'
                        }
                    }
                }
            });
            const sig = Stripe.webhooks.generateTestHeaderString({ payload: rawPayload, secret: webhookSecret });

            const { req, res } = createMockReqRes({
                method: 'POST',
                rawPayload,
                headers: { 'stripe-signature': sig }
            });

            await webhookHandler(req, res);
            expect(res._getStatusCode()).toBe(500);
        });
    });

    describe('Fail-Closed Entitlement DB Queries', () => {
        test('getPurchases returns 500 instead of empty purchases on non-42P01 DB error', async () => {
            process.env.POSTGRES_URL = 'postgres://invalid:invalid@127.0.0.1:1/nonexistent';
            const { req, res } = createMockReqRes({ method: 'GET' });
            await getPurchasesHandler(req, res);
            expect(res._getStatusCode()).toBe(500);
        });

        test('saveGame returns 500 rather than wiping verifiedPurchases on DB outage', async () => {
            process.env.POSTGRES_URL = 'postgres://invalid:invalid@127.0.0.1:1/nonexistent';
            const { req, res } = createMockReqRes({
                method: 'POST',
                body: {
                    email: 'player@example.com',
                    game_data: {
                        activeSlotId: 'slot_1',
                        slots: { slot_1: { id: 'slot_1', data: { user: { age: 20 } } } }
                    }
                }
            });
            await saveGameHandler(req, res);
            expect(res._getStatusCode()).toBe(500);
        });
    });

    describe('Client-Side State Depth Cap & Class Token Sanitization', () => {
        test('sanitizeGameState and deepClone cap depth at 32 without throwing RangeError', () => {
            let deep = { leaf: 1 };
            for (let i = 0; i < 60; i++) {
                deep = { child: deep };
            }
            expect(() => sanitizeGameState(deep)).not.toThrow();
            expect(() => deepClone(deep)).not.toThrow();
        });

        test('migrateState strips HTML/attribute breakout characters from lifeLog color and manager icons', () => {
            const migrated = migrateState({
                user: {
                    username: 'Player',
                    age: 25,
                    propertyManager: {
                        hired: true,
                        lastReport: {
                            activity: [{ type: 'rent', icon: 'fa-home" onclick="alert(1)', text: 'Collected rent' }],
                            repairs: [{ id: 'r1', icon: 'fa-wrench" onerror="alert(1)', desc: 'Pipe', cost: 100 }]
                        }
                    }
                },
                lifeLog: [
                    {
                        age: 25,
                        events: [{ msg: 'Test', color: 'text-green-400" onmouseover="alert(1)' }]
                    }
                ]
            });

            expect(migrated.lifeLog[0].events[0].color).not.toContain('"');
            expect(migrated.lifeLog[0].events[0].color).not.toContain('(');
            expect(migrated.user.propertyManager.lastReport.activity[0].icon).not.toContain('"');
            expect(migrated.user.propertyManager.lastReport.repairs[0].icon).not.toContain('"');
        });
    });
});
