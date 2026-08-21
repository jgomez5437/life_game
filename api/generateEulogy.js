// /api/generateEulogy.js
// DEPRECATED: Eulogies are now generated 100% client-side via public/src/core/eulogyGenerator.js (Zero-AI architecture).
import { checkRateLimit } from './lib/rateLimit.js';

export default function handler(request, response) {
    if (!checkRateLimit(request, response, 'eulogy')) {
        return;
    }
    return response.status(410).json({ error: 'Endpoint deprecated. Eulogies are now generated procedurally on client.' });
}