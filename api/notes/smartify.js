import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subtopicId, notes, language } = req.body;

    if (!notes || !language) {
      return res.status(400).json({ 
        error: 'Missing required fields: notes and language are required' 
      });
    }

    // Limit input size to prevent token limit issues
    // Roughly 4 characters per token, so limit to ~8000 characters for safety
    const maxInputLength = 8000;
    const truncatedNotes = notes.length > maxInputLength 
      ? notes.substring(0, maxInputLength) + '...'
      : notes;

    // Determine requested output language
    const targetLang = String(language || 'auto').toLowerCase();

    // Build the prompt depending on language preference
    let prompt;
    if (targetLang === 'en' || targetLang === 'english') {
      prompt = `You are given some notes. Your task is to:
1) Correct grammar, spelling, and punctuation.
2) Convert them into Smart Notes with:
   - Clear bullet points
   - Bold important terms using **bold** markdown
   - Simpler sentences while keeping the original meaning
3) If the original is not in English, translate and output the final Smart Notes in ENGLISH.

Original Notes:
${truncatedNotes}

Respond ONLY with the corrected and formatted Smart Notes in ENGLISH, with no extra commentary.`;
    } else if (
      targetLang === 'de' || targetLang === 'german' || targetLang === 'deutsch'
    ) {
      prompt = `Du erhältst Notizen. Deine Aufgabe:
1) Grammatik, Rechtschreibung und Zeichensetzung korrigieren.
2) In Smart Notes umwandeln mit:
   - Klaren Aufzählungspunkten
   - Wichtige Begriffe fett mit **fett** Markdown
   - Vereinfachten Sätzen bei gleicher Bedeutung
3) Wenn die Originalsprache nicht Deutsch ist, übersetze und gib die finalen Smart Notes auf DEUTSCH aus.

Originale Notizen:
${truncatedNotes}

Antworte AUSSCHLIESSLICH mit den korrigierten und formatierten Smart Notes auf DEUTSCH, ohne zusätzliche Erklärungen.`;
    } else {
      // Auto-detect and keep same language (previous behavior)
      prompt = `Take the following notes and analyze their language. Your task is to:
1. Detect the original language of the notes
2. Correct grammar, spelling, and punctuation in that same language
3. Convert into Smart Notes format with:
   - Clear bullet points
   - Bold important terms using **bold** markdown
   - Simplify long/complex sentences while keeping the original meaning
   - IMPORTANT: Maintain the exact same language as the original notes

Original Notes:
${truncatedNotes}

Please return ONLY the corrected and formatted Smart Notes in the SAME LANGUAGE as the original notes, without any additional explanations or comments.`;
    }

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert editor and note-taking assistant. You help students improve their notes by correcting grammar and formatting them into clear, structured Smart Notes with bullet points and highlighted key terms."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2000,
    });

    const smartNotes = completion.choices[0]?.message?.content;

    if (!smartNotes) {
      throw new Error('No response from AI service');
    }

    // Return both original and smart notes
    return res.status(200).json({
      originalNotes: notes,
      smartNotes: smartNotes.trim(),
      subtopicId: subtopicId || null,
      wasTruncated: notes.length > maxInputLength
    });

  } catch (error) {
    console.error('Error in smartify endpoint:', error);
    
    // Handle specific Groq API errors
    if (error.message?.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again in a moment.' 
      });
    }
    
    if (error.message?.includes('API key')) {
      return res.status(401).json({ 
        error: 'API configuration error. Please contact support.' 
      });
    }

    return res.status(500).json({ 
      error: 'Failed to generate Smart Notes. Please try again.' 
    });
  }
}