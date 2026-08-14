// /api/generateEulogy.js
// DEPRECATED: Eulogies are now generated 100% client-side via public/src/core/eulogyGenerator.js (Zero-AI architecture).
export default function handler(request, response) {
    return response.status(410).json({ error: 'Endpoint deprecated. Eulogies are now generated procedurally on client.' });
}