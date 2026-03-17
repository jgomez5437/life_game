// /api/generateEulogy.js
export default async function handler(request, response) {
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

    const { compressedLog, username } = request.body;
    if (!compressedLog) return response.status(400).json({ error: 'Missing life log' });

    const apiKey = process.env.GEMINI_API_KEY; // Must be set in Vercel dashboard

    const prompt = `You are writing a short, 3-sentence biographical summary for a life simulation game character named ${username}. 
    Review their life events below. Highlight their career, major milestones, and how they died. Keep the tone slightly cynical but reflective.
    
    Life Events:
    ${compressedLog}`;

    try {
       const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    maxOutputTokens: 250, // Bumped slightly to guarantee headroom
                    temperature: 0.7 
                },
                // THE FIX: Override default safety blocks for fictional game events
                safetySettings: [
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        const data = await geminiRes.json();
        const eulogy = data.candidates[0].content.parts[0].text;
        console.log(eulogy);
        return response.status(200).json({ eulogy });
    } catch (error) {
        console.error('Gemini API Error:', error);
        return response.status(500).json({ error: 'Failed to generate eulogy' });
    }
}