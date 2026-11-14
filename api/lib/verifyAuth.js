import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'https://dev-ofc1agu3ax7gzj2f.us.auth0.com';
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || 'SzIrZaBzHZLS9js0HtJEwA35ZwN8hmkT';
const JWKS = createRemoteJWKSet(new URL(`${AUTH0_DOMAIN}/.well-known/jwks.json`));

let testVerifier = null;
export function setTestAuthVerifier(fn) {
    if (process.env.NODE_ENV === 'production' && !process.env.JEST_WORKER_ID) {
        return;
    }
    testVerifier = fn;
}

export async function verifyAuth(request) {
    if (testVerifier && (process.env.NODE_ENV !== 'production' || process.env.JEST_WORKER_ID)) {
        return testVerifier(request);
    }

    const authHeader = request.headers?.['authorization'] || request.headers?.['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.length > 8192) {
        throw new Error('Missing or invalid Bearer token');
    }

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            algorithms: ['RS256'],
            issuer: [`${AUTH0_DOMAIN}/`, AUTH0_DOMAIN],
            audience: AUTH0_CLIENT_ID,
            clockTolerance: '60s'
        });
        if (!payload?.sub || typeof payload.sub !== 'string') {
            throw new Error('Token missing subject claim');
        }
        return payload.sub;
    } catch (err) {
        console.warn(`[AUTH] Token verification failed: ${err.message}`);
        throw new Error('Authentication failed');
    }
}
