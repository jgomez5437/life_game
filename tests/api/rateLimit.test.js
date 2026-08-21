import { checkRateLimit, clearRateLimits, getClientIp, RATE_LIMIT_CONFIGS } from '../../api/lib/rateLimit.js';

function createMockReqRes(options = {}) {
    const headers = options.headers || {};
    const req = {
        headers,
        socket: { remoteAddress: options.ip || '127.0.0.1' }
    };

    const resHeaders = {};
    let statusCode = 200;
    let jsonBody = null;

    const res = {
        setHeader: (name, val) => {
            resHeaders[name.toLowerCase()] = String(val);
        },
        getHeader: (name) => resHeaders[name.toLowerCase()],
        status: (code) => {
            statusCode = code;
            return {
                json: (data) => {
                    jsonBody = data;
                    return data;
                },
                send: (data) => {
                    jsonBody = data;
                    return data;
                }
            };
        },
        _getHeaders: () => resHeaders,
        _getStatusCode: () => statusCode,
        _getJsonBody: () => jsonBody
    };

    return { req, res };
}

describe('Rate Limiter Engine (api/lib/rateLimit.js)', () => {
    beforeEach(() => {
        clearRateLimits();
    });

    test('allows requests within limit and sets standard headers', () => {
        const { req, res } = createMockReqRes({ ip: '1.2.3.4' });
        const allowed = checkRateLimit(req, res, 'saveGame', { maxRequests: 3, windowMs: 1000 });

        expect(allowed).toBe(true);
        expect(res._getHeaders()['x-ratelimit-limit']).toBe('3');
        expect(res._getHeaders()['x-ratelimit-remaining']).toBe('2');
        expect(res._getHeaders()['x-ratelimit-reset']).toBeDefined();
    });

    test('rejects requests with HTTP 429 when max requests are exceeded', () => {
        const customConfig = { maxRequests: 2, windowMs: 5000 };

        const first = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(first.req, first.res, 'saveGame', customConfig)).toBe(true);

        const second = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(second.req, second.res, 'saveGame', customConfig)).toBe(true);

        const third = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(third.req, third.res, 'saveGame', customConfig)).toBe(false);

        expect(third.res._getStatusCode()).toBe(429);
        expect(third.res._getHeaders()['retry-after']).toBeDefined();
        expect(third.res._getHeaders()['x-ratelimit-remaining']).toBe('0');
        expect(third.res._getJsonBody().error).toBe('Too Many Requests');
    });

    test('differentiates pools between different users', () => {
        const customConfig = { maxRequests: 1, windowMs: 5000 };

        const userA = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(userA.req, userA.res, 'saveGame', customConfig, 'auth0|userA')).toBe(true);

        const userB = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(userB.req, userB.res, 'saveGame', customConfig, 'auth0|userB')).toBe(true);

        // userA second request should be blocked
        const userA2 = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(userA2.req, userA2.res, 'saveGame', customConfig, 'auth0|userA')).toBe(false);
    });

    test('differentiates pools between different endpoints', () => {
        const customConfig = { maxRequests: 1, windowMs: 5000 };

        const saveReq = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(saveReq.req, saveReq.res, 'saveGame', customConfig)).toBe(true);

        const loadReq = createMockReqRes({ ip: '1.2.3.4' });
        expect(checkRateLimit(loadReq.req, loadReq.res, 'load', customConfig)).toBe(true);
    });

    test('getClientIp extracts IP correctly from headers', () => {
        const forwardedReq = { headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' } };
        expect(getClientIp(forwardedReq)).toBe('203.0.113.195');

        const realIpReq = { headers: { 'x-real-ip': '198.51.100.1' } };
        expect(getClientIp(realIpReq)).toBe('198.51.100.1');

        const socketReq = { headers: {}, socket: { remoteAddress: '192.0.2.1' } };
        expect(getClientIp(socketReq)).toBe('192.0.2.1');
    });

    test('RATE_LIMIT_CONFIGS has safe definitions for all endpoints', () => {
        expect(RATE_LIMIT_CONFIGS.saveGame.maxRequests).toBe(20);
        expect(RATE_LIMIT_CONFIGS.load.maxRequests).toBe(30);
        expect(RATE_LIMIT_CONFIGS.login.maxRequests).toBe(10);
        expect(RATE_LIMIT_CONFIGS.checkout.maxRequests).toBe(5);
        expect(RATE_LIMIT_CONFIGS.getPurchases.maxRequests).toBe(30);
        expect(RATE_LIMIT_CONFIGS.eulogy.maxRequests).toBe(5);
        expect(RATE_LIMIT_CONFIGS.health.maxRequests).toBe(30);
        expect(RATE_LIMIT_CONFIGS.webhook.maxRequests).toBe(120);
    });
});
