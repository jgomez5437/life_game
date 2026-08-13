import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH0_DOMAIN = 'https://dev-ofc1agu3ax7gzj2f.us.auth0.com';
const JWKS = createRemoteJWKSet(new URL(`${AUTH0_DOMAIN}/.well-known/jwks.json`));

export async function verifyAuth(request) {
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
        // Try with issuer validation
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: `${AUTH0_DOMAIN}/`,
        });
        return payload.sub;
    } catch (err) {
        throw new Error(`Token verification failed: ${err.message}`);
    }
}
