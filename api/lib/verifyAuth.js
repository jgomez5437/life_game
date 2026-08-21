import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH0_DOMAIN = 'https://dev-ofc1agu3ax7gzj2f.us.auth0.com';
const AUTH0_CLIENT_ID = 'SzIrZaBzHZLS9js0HtJEwA35ZwN8hmkT';
const JWKS = createRemoteJWKSet(new URL(`${AUTH0_DOMAIN}/.well-known/jwks.json`));

let testVerifier = null;
export function setTestAuthVerifier(fn) {
    testVerifier = fn;
}

export async function verifyAuth(request) {
    if (testVerifier) {
        return testVerifier(request);
    }

    const authHeader = request.headers?.['authorization'] || request.headers?.['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `${AUTH0_DOMAIN}/`,
            audience: AUTH0_CLIENT_ID
        });
        return payload.sub;
    } catch (err) {
        throw new Error(`Token verification failed: ${err.message}`);
    }
}
