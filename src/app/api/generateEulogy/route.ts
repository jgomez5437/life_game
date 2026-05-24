import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { compressedLog, username } = body;

    if (!compressedLog) {
      return NextResponse.json({ error: 'Missing life log' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

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

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
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
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const eulogy = data.candidates[0].content.parts[0].text;
    console.log(eulogy);
    console.log(data.candidates[0].finishReason);

    return NextResponse.json({ eulogy }, { status: 200 });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to generate eulogy' }, { status: 500 });
  }
}
