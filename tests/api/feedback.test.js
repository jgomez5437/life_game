/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import feedbackHandler, { setTestFeedbackDb, setTestFeedbackMailer } from '../../api/feedback.js';
import { clearRateLimits } from '../../api/lib/rateLimit.js';
import { setTestAuthVerifier } from '../../api/lib/verifyAuth.js';
import { validateFeedbackPayload, escapeEmailHtml, isValidEmail } from '../../api/lib/validation.js';

function createMockReqRes({ method = 'POST', body = {}, headers = {}, ip = '127.0.0.1' } = {}) {
    const req = {
        method,
        body,
        headers: {
            ...headers,
            'x-forwarded-for': ip
        },
        socket: { remoteAddress: ip }
    };

    const resHeaders = {};
    let statusCode = 200;
    let jsonBody = null;

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
        _getStatusCode: () => statusCode,
        _getJsonBody: () => jsonBody
    };

    return { req, res };
}

describe('POST /api/feedback Endpoint & Validation', () => {
    const origResendKey = process.env.RESEND_API_KEY;
    const origToEmail = process.env.FEEDBACK_TO_EMAIL;
    const origFromEmail = process.env.FEEDBACK_FROM_EMAIL;

    beforeEach(() => {
        clearRateLimits();
        delete process.env.RESEND_API_KEY;
        delete process.env.FEEDBACK_TO_EMAIL;
        delete process.env.FEEDBACK_FROM_EMAIL;

        setTestAuthVerifier((req) => {
            const authHeader = req.headers?.authorization || req.headers?.Authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Missing or invalid Authorization header');
            }
            const token = authHeader.split(' ')[1];
            if (token === 'guest_token') return 'guest';
            if (token === 'valid_token') return 'auth0|player_123';
            throw new Error('Invalid token');
        });

        setTestFeedbackDb(async (record) => ({
            id: 42,
            createdAt: '2026-11-12T00:00:00Z',
            resolvedEmail: record.clientEmail || 'player@example.com'
        }));

        setTestFeedbackMailer(null);
    });

    afterEach(() => {
        setTestAuthVerifier(null);
        setTestFeedbackDb(null);
        setTestFeedbackMailer(null);

        if (origResendKey !== undefined) process.env.RESEND_API_KEY = origResendKey;
        else delete process.env.RESEND_API_KEY;

        if (origToEmail !== undefined) process.env.FEEDBACK_TO_EMAIL = origToEmail;
        else delete process.env.FEEDBACK_TO_EMAIL;

        if (origFromEmail !== undefined) process.env.FEEDBACK_FROM_EMAIL = origFromEmail;
        else delete process.env.FEEDBACK_FROM_EMAIL;
    });

    test('rejects non-POST HTTP methods with 405', async () => {
        const { req, res } = createMockReqRes({ method: 'GET' });
        await feedbackHandler(req, res);
        expect(res._getStatusCode()).toBe(405);
    });

    test('rejects unauthenticated requests with 401', async () => {
        const { req, res } = createMockReqRes({
            method: 'POST',
            body: { message: 'Add a pet adoption feature!' }
        });
        await feedbackHandler(req, res);
        expect(res._getStatusCode()).toBe(401);
        expect(res._getJsonBody().error).toContain('Authentication required');
    });

    test('rejects guest auth identifier with 401', async () => {
        const { req, res } = createMockReqRes({
            method: 'POST',
            headers: { authorization: 'Bearer guest_token' },
            body: { message: 'Add a pet adoption feature!' }
        });
        await feedbackHandler(req, res);
        expect(res._getStatusCode()).toBe(401);
    });

    test('validates message length, category, and prototype pollution keys', async () => {
        const shortReq = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: { message: 'hi' }
        });
        await feedbackHandler(shortReq.req, shortReq.res);
        expect(shortReq.res._getStatusCode()).toBe(400);

        const longReq = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: { message: 'x'.repeat(2001) }
        });
        await feedbackHandler(longReq.req, longReq.res);
        expect(longReq.res._getStatusCode()).toBe(400);

        const badCatReq = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: { category: 'admin', message: 'Valid feedback message' }
        });
        await feedbackHandler(badCatReq.req, badCatReq.res);
        expect(badCatReq.res._getStatusCode()).toBe(400);

        const protoPayload = JSON.parse('{"__proto__": {"polluted": true}, "message": "Valid feedback message"}');
        const protoCheck = validateFeedbackPayload(protoPayload);
        expect(protoCheck.ok).toBe(false);
    });

    test('rejects oversized payload with 413', async () => {
        const { req, res } = createMockReqRes({
            headers: {
                authorization: 'Bearer valid_token',
                'content-length': String(32 * 1024)
            },
            body: { message: 'Valid message' }
        });
        await feedbackHandler(req, res);
        expect(res._getStatusCode()).toBe(413);
    });

    test('persists feedback to DB and succeeds cleanly even if email env vars are unset', async () => {
        const dbSpy = jest.fn(async () => ({
            id: 101,
            createdAt: '2026-11-12T12:00:00Z',
            resolvedEmail: 'player@example.com'
        }));
        setTestFeedbackDb(dbSpy);

        const { req, res } = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: {
                category: 'feature',
                message: 'Please add a stock dividend history chart!',
                email: 'player@example.com',
                appVersion: '1.7.2'
            }
        });

        await feedbackHandler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJsonBody()).toEqual({
            ok: true,
            id: 101,
            emailSent: false
        });
        expect(dbSpy).toHaveBeenCalledWith({
            authUserId: 'auth0|player_123',
            category: 'feature',
            message: 'Please add a stock dividend history chart!',
            appVersion: '1.7.2',
            clientEmail: 'player@example.com'
        });
    });

    test('dispatches escaped HTML email with reply_to when Resend env vars are configured', async () => {
        process.env.RESEND_API_KEY = 're_test_secret_key';
        process.env.FEEDBACK_TO_EMAIL = 'owner@example.com';
        process.env.FEEDBACK_FROM_EMAIL = 'Start a Life <feedback@startalife.app>';

        const mailerSpy = jest.fn(async () => ({ sent: true }));
        setTestFeedbackMailer(mailerSpy);

        const { req, res } = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: {
                category: 'bug',
                message: 'Found an issue with <script>alert(1)</script>\nLine 2',
                email: 'user@example.com',
                appVersion: '1.7.2'
            }
        });

        await feedbackHandler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJsonBody()).toEqual({
            ok: true,
            id: 42,
            emailSent: true
        });
        expect(mailerSpy).toHaveBeenCalledTimes(1);
        const emailArgs = mailerSpy.mock.calls[0][0];
        expect(emailArgs.to).toEqual(['owner@example.com']);
        expect(emailArgs.from).toBe('Start a Life <feedback@startalife.app>');
        expect(emailArgs.reply_to).toBe('user@example.com');
        expect(emailArgs.subject).toBe('[Start a Life] Bug Report');
        expect(emailArgs.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>Line 2');
        expect(emailArgs.html).not.toContain('<script>');
        // Never leak owner's email in HTTP response
        expect(JSON.stringify(res._getJsonBody())).not.toContain('owner@example.com');
    });

    test('returns 200 if DB fails but email succeeds, and 500 if both fail', async () => {
        setTestFeedbackDb(async () => {
            throw new Error('DB connection down');
        });

        // Case 1: Both DB fails and email unconfigured -> 500
        const bothFail = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: { message: 'Testing failure fallback behavior' }
        });
        await feedbackHandler(bothFail.req, bothFail.res);
        expect(bothFail.res._getStatusCode()).toBe(500);

        // Case 2: DB fails, but email succeeds -> 200
        process.env.RESEND_API_KEY = 're_test_secret_key';
        process.env.FEEDBACK_TO_EMAIL = 'owner@example.com';
        setTestFeedbackMailer(async () => ({ sent: true }));

        const mailOnlyOk = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: { message: 'Testing email fallback when DB fails' }
        });
        await feedbackHandler(mailOnlyOk.req, mailOnlyOk.res);
        expect(mailOnlyOk.res._getStatusCode()).toBe(200);
        expect(mailOnlyOk.res._getJsonBody().emailSent).toBe(true);
    });

    test('enforces rate limit of 5 feedback submissions per 10 minutes per user', async () => {
        for (let i = 0; i < 5; i++) {
            const { req, res } = createMockReqRes({
                headers: { authorization: 'Bearer valid_token' },
                body: { message: `Feedback item #${i + 1} valid text` }
            });
            await feedbackHandler(req, res);
            expect(res._getStatusCode()).toBe(200);
        }

        const sixth = createMockReqRes({
            headers: { authorization: 'Bearer valid_token' },
            body: { message: 'Sixth feedback attempt should be rate limited' }
        });
        await feedbackHandler(sixth.req, sixth.res);
        expect(sixth.res._getStatusCode()).toBe(429);
    });

    test('isValidEmail and escapeEmailHtml guard against header injection and XSS', () => {
        expect(isValidEmail('valid@example.com')).toBe(true);
        expect(isValidEmail("bad\r\nBcc: attacker@evil.com")).toBe(false);
        expect(isValidEmail('not-an-email')).toBe(false);
        expect(escapeEmailHtml('<b>"hi"</b>')).toBe('&lt;b&gt;&quot;hi&quot;&lt;/b&gt;');
    });
});
