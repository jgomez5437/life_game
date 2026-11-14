// api/lib/rateLimit.js
// Serverless sliding-window rate limiter for Start a Life API endpoints.
//
// LIMITATION: This rate limiter uses in-memory storage (Map). In horizontally
// scaled serverless environments (e.g., Vercel), each lambda instance maintains
// its own counter. This provides per-instance protection but does NOT enforce
// global distributed rate limits across all concurrent instances.
//
// For production-grade distributed rate limiting, consider migrating to:
//   - Upstash Redis (https://upstash.com) with @upstash/ratelimit
//   - Vercel KV (https://vercel.com/docs/storage/vercel-kv)
//
// The current implementation is acceptable for launch and provides meaningful
// protection against single-origin abuse and accidental client-side retry storms.

export const RATE_LIMIT_CONFIGS = {
    saveGame: { maxRequests: 60, windowMs: 60 * 1000 },       // 60 saves / min
    load: { maxRequests: 60, windowMs: 60 * 1000 },           // 60 loads / min
    login: { maxRequests: 30, windowMs: 60 * 1000 },          // 30 logins / min
    checkout: { maxRequests: 10, windowMs: 60 * 1000 },       // 10 checkout sessions / min
    getPurchases: { maxRequests: 60, windowMs: 60 * 1000 },   // 60 entitlement checks / min
    eulogy: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 eulogy requests / min
    feedback: { maxRequests: 5, windowMs: 10 * 60 * 1000 },   // 5 feedback submissions / 10 min
    health: { maxRequests: 60, windowMs: 60 * 1000 },         // 60 health checks / min
    webhook: { maxRequests: 120, windowMs: 60 * 1000 },       // 120 webhook events / min
    default: { maxRequests: 60, windowMs: 60 * 1000 }         // 60 req / min default
};

export const MAX_STORE_KEYS = 5000;

const rateLimitStore = new Map();

/**
 * Resets the in-memory rate limit store (primarily for unit tests).
 */
export function clearRateLimits() {
    rateLimitStore.clear();
}

/**
 * Returns the current number of tracked keys in the in-memory store.
 */
export function getRateLimitStoreSize() {
    return rateLimitStore.size;
}

function normalizeIp(rawIp) {
    if (!rawIp || typeof rawIp !== 'string') return '127.0.0.1';
    const cleaned = rawIp.trim().slice(0, 64).replace(/[^0-9a-fA-F:.,]/g, '');
    const first = cleaned.split(',')[0].trim();
    return first || '127.0.0.1';
}

/**
 * Extracts client IP from request headers (supports proxies/Cloudflare/Vercel).
 * Prefers platform-managed single-IP headers before client-modifiable x-forwarded-for.
 * @param {object} request
 * @returns {string} Client IP address
 */
export function getClientIp(request) {
    if (!request) return '127.0.0.1';
    const headers = request.headers || {};
    const vercelForwarded = headers['x-vercel-forwarded-for'] || headers['X-Vercel-Forwarded-For'];
    if (vercelForwarded) {
        return normalizeIp(String(vercelForwarded));
    }
    const xReal = headers['x-real-ip'] || headers['X-Real-IP'];
    if (xReal) {
        return normalizeIp(String(xReal));
    }
    const xForwarded = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
    if (xForwarded) {
        return normalizeIp(String(xForwarded));
    }
    return normalizeIp(String(request.socket?.remoteAddress || request.connection?.remoteAddress || '127.0.0.1'));
}

/**
 * Checks whether a request exceeds the configured rate limit.
 * If exceeded, automatically sends HTTP 429 response with Retry-After and rate limit headers.
 * 
 * @param {object} request - HTTP request object
 * @param {object} response - HTTP response object
 * @param {string} [endpointKey='default'] - Name of the endpoint configuration
 * @param {object} [customConfig=null] - Optional override { maxRequests, windowMs }
 * @param {string} [authUserId=null] - Optional verified user ID for per-user rate limiting
 * @returns {boolean} true if allowed, false if rejected (429 sent)
 */
export function checkRateLimit(request, response, endpointKey = 'default', customConfig = null, authUserId = null) {
    const config = customConfig || RATE_LIMIT_CONFIGS[endpointKey] || RATE_LIMIT_CONFIGS.default;
    const { maxRequests, windowMs } = config;

    const identifier = authUserId ? String(authUserId).slice(0, 128) : getClientIp(request);
    const storeKey = `${endpointKey}:${identifier}`;
    const now = Date.now();

    let entry = rateLimitStore.get(storeKey);

    // Filter out timestamps outside the sliding window
    if (entry) {
        entry.timestamps = entry.timestamps.filter(ts => (now - ts) < windowMs);
    } else {
        // Periodic cleanup & hard cap enforcement before adding new keys
        if (rateLimitStore.size >= MAX_STORE_KEYS) {
            for (const [k, v] of rateLimitStore.entries()) {
                v.timestamps = v.timestamps.filter(ts => (now - ts) < windowMs);
                if (v.timestamps.length === 0) {
                    rateLimitStore.delete(k);
                }
            }
            // If still over cap (e.g. distributed IP flood within windowMs), evict oldest entries FIFO
            while (rateLimitStore.size >= MAX_STORE_KEYS) {
                const oldestKey = rateLimitStore.keys().next().value;
                if (oldestKey === undefined) break;
                rateLimitStore.delete(oldestKey);
            }
        }
        entry = { timestamps: [] };
        rateLimitStore.set(storeKey, entry);
    }

    const currentHits = entry.timestamps.length;
    const oldestTimestamp = entry.timestamps[0] || now;
    const resetTimeSec = Math.ceil((oldestTimestamp + windowMs) / 1000);
    const retryAfterSec = Math.max(1, Math.ceil(((oldestTimestamp + windowMs) - now) / 1000));

    if (currentHits >= maxRequests) {
        // Rate limit exceeded: set headers and send 429
        if (response && typeof response.setHeader === 'function') {
            response.setHeader('Retry-After', String(retryAfterSec));
            response.setHeader('X-RateLimit-Limit', String(maxRequests));
            response.setHeader('X-RateLimit-Remaining', '0');
            response.setHeader('X-RateLimit-Reset', String(resetTimeSec));
        }
        if (response && typeof response.status === 'function') {
            response.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded for this endpoint. Please wait ${retryAfterSec} seconds before retrying.`,
                retryAfter: retryAfterSec
            });
        }
        return false;
    }

    // Allowed: record hit and set headers
    entry.timestamps.push(now);
    const remaining = Math.max(0, maxRequests - entry.timestamps.length);

    if (response && typeof response.setHeader === 'function') {
        response.setHeader('X-RateLimit-Limit', String(maxRequests));
        response.setHeader('X-RateLimit-Remaining', String(remaining));
        response.setHeader('X-RateLimit-Reset', String(resetTimeSec));
    }

    return true;
}
