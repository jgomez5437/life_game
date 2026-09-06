/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

let mockSqlError = null;
let mockSqlResult = { rows: [{ now: '2026-09-06T12:00:00.000Z' }] };

const mockSql = jest.fn(async () => {
    if (mockSqlError) {
        throw mockSqlError;
    }
    return mockSqlResult;
});

jest.unstable_mockModule('@vercel/postgres', () => ({
    sql: mockSql
}));

const { default: healthHandler } = await import('../../api/index.js');
const { clearRateLimits } = await import('../../api/lib/rateLimit.js');

function createMockReqRes({ method = 'GET', headers = {}, ip = '127.0.0.1' } = {}) {
    const req = {
        method,
        headers: {
            ...headers,
            'x-forwarded-for': ip
        },
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
        _getHeaders: () => resHeaders,
        _getSentText: () => sentText
    };

    return { req, res };
}

describe('Health Check Endpoint (api/index.js)', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        clearRateLimits();
        mockSql.mockClear();
        mockSqlError = null;
        mockSqlResult = { rows: [{ now: '2026-09-06T12:00:00.000Z' }] };
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('HTTP Method Enforcement', () => {
        test('rejects POST, PUT, and DELETE methods with 405 Method Not Allowed', async () => {
            for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
                const { req, res } = createMockReqRes({ method, ip: `192.168.1.${method.length}` });
                await healthHandler(req, res);

                expect(res._getStatusCode()).toBe(405);
                expect(res._getJsonBody()).toEqual({ error: 'Method Not Allowed' });
                expect(mockSql).not.toHaveBeenCalled();
            }
        });

        test('allows GET and HEAD requests', async () => {
            const { req: getReq, res: getRes } = createMockReqRes({ method: 'GET', ip: '10.0.1.1' });
            await healthHandler(getReq, getRes);
            expect(getRes._getStatusCode()).toBe(200);

            const { req: headReq, res: headRes } = createMockReqRes({ method: 'HEAD', ip: '10.0.1.2' });
            await healthHandler(headReq, headRes);
            expect(headRes._getStatusCode()).toBe(200);
        });
    });

    describe('Success Handling (200 OK)', () => {
        test('returns database timestamp and endpoint information on successful query', async () => {
            const expectedTime = '2026-09-06T13:42:00.000Z';
            mockSqlResult = { rows: [{ now: expectedTime }] };

            const { req, res } = createMockReqRes({ method: 'GET', ip: '10.0.2.1' });
            await healthHandler(req, res);

            expect(res._getStatusCode()).toBe(200);
            expect(res._getJsonBody()).toEqual({
                message: 'Database connection successful',
                databaseTime: expectedTime,
                apiEndpoint: '/api'
            });
            expect(mockSql).toHaveBeenCalledTimes(1);
        });
    });

    describe('Security & Information Leak Prevention (500 Error Handling)', () => {
        test('does NOT leak sensitive connection strings, credentials, or hostnames in 500 response', async () => {
            const sensitiveError = new Error(
                'connect ECONNREFUSED postgres://db_admin:P@ssw0rd123!@ep-internal-cluster.neon.tech:5432/live_game_prod'
            );
            mockSqlError = sensitiveError;

            const { req, res } = createMockReqRes({ method: 'GET', ip: '10.0.3.1' });
            await healthHandler(req, res);

            expect(res._getStatusCode()).toBe(500);

            const body = res._getJsonBody();
            expect(body).toEqual({
                message: 'Database connection error',
                error: 'Internal Server Error'
            });

            // Rigorous leakage verification: ensure no sensitive keywords appear anywhere in JSON
            const serialized = JSON.stringify(body);
            expect(serialized).not.toContain('ECONNREFUSED');
            expect(serialized).not.toContain('postgres://');
            expect(serialized).not.toContain('db_admin');
            expect(serialized).not.toContain('P@ssw0rd123!');
            expect(serialized).not.toContain('ep-internal-cluster');
            expect(serialized).not.toContain('neon.tech');
            expect(serialized).not.toContain('5432');
            expect(serialized).not.toContain('live_game_prod');

            // Verify internal server logging occurred for observability
            expect(consoleErrorSpy).toHaveBeenCalledWith('Database connection error:', sensitiveError);
        });

        test('does NOT leak VercelPostgresError missing connection details or env var names', async () => {
            const vpgError = new Error(
                "VercelPostgresError - 'missing_connection_string': You did not supply a 'connectionString' and no 'POSTGRES_URL' env var was found."
            );
            mockSqlError = vpgError;

            const { req, res } = createMockReqRes({ method: 'GET', ip: '10.0.3.2' });
            await healthHandler(req, res);

            expect(res._getStatusCode()).toBe(500);
            const body = res._getJsonBody();
            expect(body).toEqual({
                message: 'Database connection error',
                error: 'Internal Server Error'
            });

            const serialized = JSON.stringify(body);
            expect(serialized).not.toContain('VercelPostgresError');
            expect(serialized).not.toContain('missing_connection_string');
            expect(serialized).not.toContain('POSTGRES_URL');
        });
    });

    describe('Rate Limiting Enforcement', () => {
        test('returns 429 when IP exceeds 60 health checks in one minute', async () => {
            const ip = '198.51.100.55';

            for (let i = 0; i < 60; i++) {
                const { req, res } = createMockReqRes({ method: 'GET', ip });
                await healthHandler(req, res);
                expect(res._getStatusCode()).toBe(200);
            }

            const { req: limitedReq, res: limitedRes } = createMockReqRes({ method: 'GET', ip });
            await healthHandler(limitedReq, limitedRes);

            expect(limitedRes._getStatusCode()).toBe(429);
            expect(limitedRes._getJsonBody().error).toBe('Too Many Requests');
            expect(limitedRes._getHeaders()['retry-after']).toBeDefined();
        });
    });
});
