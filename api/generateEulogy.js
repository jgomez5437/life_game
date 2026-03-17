// /api/generateEulogy.js
export default async function handler(request, response) {
    if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });

    const { compressedLog, username } = request.body;
    if (!compressedLog) return response.status(400).json({ error: 'Missing life log' });

    const apiKey = process.env.GEMINI_API_KEY; // Must be set in Vercel dashboard

    const prompt = `You are writing a biographical summary for a life simulation game character named ${username}.

    STRICT REQUIREMENTS:
    - Write EXACTLY 3 sentences.
    - Each sentence must be between 8 and 16 words.
    - Use specific details from the life events (career, milestones, cause of death).
    - Do NOT be vague, generic, or overly brief.
    - Do NOT use bullet points or lists.
    - Do NOT cut off mid-sentence.

    STYLE:
    - Tone should be slightly cynical, reflective, and a bit darkly humorous.
    - Write as if summarizing a flawed but human life.

    OUTPUT FORMAT:
    - One single paragraph of exactly 3 complete sentences.
    
    Life Events:
    ${compressedLog}`;

    try {
       const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    maxOutputTokens: 1000, 
                    temperature: 0.7 
                },

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
        console.log(data.candidates[0].finishReason);
        return response.status(200).json({ eulogy });
    } catch (error) {
        console.error('Gemini API Error:', error);
        return response.status(500).json({ error: 'Failed to generate eulogy' });
    }
}