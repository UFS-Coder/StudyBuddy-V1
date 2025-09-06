import Groq from 'groq-sdk';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, category } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Strengthen prompt to require strict JSON only
    const effectivePrompt = `${prompt}\n\nRespond ONLY with a valid JSON object (no markdown, no backticks, no prose). Use exactly this schema: {"question":"string","options":["string","string","string","string"],"correct_answer":"string","explanation":"string"}. The correct_answer MUST exactly match one of the options.`;

    // Get Groq API key from environment variables
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Use groq-sdk client for better JSON mode compliance
    const groq = new Groq({ apiKey: groqApiKey });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are Buddy, a fun, respectful, and family-friendly guide for teenagers. You create educational quiz questions that are engaging and appropriate for students. Always return STRICT JSON as requested.'
        },
        {
          role: 'user',
          content: effectivePrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: 'No content generated' });
    }

    // Enhanced JSON parsing with balanced-brace scanning
    const extractJsonFromText = (text) => {
      // First try direct parsing
      try {
        return JSON.parse(text);
      } catch {}
      
      // Remove markdown code blocks
      let cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {}
      
      // Find JSON object using balanced brace scanning
      let braceCount = 0;
      let startIndex = -1;
      let endIndex = -1;
      
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
          if (startIndex === -1) startIndex = i;
          braceCount++;
        } else if (text[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            endIndex = i;
            break;
          }
        }
      }
      
      if (startIndex !== -1 && endIndex !== -1) {
        const jsonStr = text.substring(startIndex, endIndex + 1);
        try {
          return JSON.parse(jsonStr);
        } catch {}
      }
      
      return null;
    };

    // Parse the JSON response with enhanced extraction
    let quizData = extractJsonFromText(content);

    // If still not parsed, trigger existing normalization flow by throwing
    if (!quizData) {
      throw new Error('NEEDS_NORMALIZATION');
    }

    // Validate the response structure
    if (!quizData.question || !quizData.options || !Array.isArray(quizData.options) || 
        !quizData.correct_answer || !quizData.explanation) {
      return res.status(500).json({ error: 'Invalid quiz question format' });
    }

    // Return the quiz question
    return res.status(200).json({
      question: quizData.question,
      options: quizData.options,
      correct_answer: quizData.correct_answer,
      explanation: quizData.explanation,
      category
    });

  } catch (error) {
    // If our manual throw asked for normalization, run the normalization path that already exists below
    if (error.message === 'NEEDS_NORMALIZATION') {
      // Re-run the earlier code path that normalizes using the REST call already present in file
      try {
        // Reconstruct variables from earlier scope
        const { prompt, category } = req.body;
        const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

        // Attempt a simpler prompt to normalize into JSON
        const normalizeResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Output STRICT JSON ONLY, no markdown.' },
              { role: 'user', content: `${prompt}\n\nReturn JSON with schema {"question":"string","options":["string","string","string","string"],"correct_answer":"string","explanation":"string"}.` }
            ],
            temperature: 0,
            max_tokens: 300,
            response_format: { type: 'json_object' }
          })
        });

        if (!normalizeResp.ok) {
          const t = await normalizeResp.text();
          console.error('Groq normalize error:', t);
          return res.status(500).json({ error: 'Invalid JSON response from AI' });
        }

        const normData = await normalizeResp.json();
        const normContent = normData.choices?.[0]?.message?.content?.trim();
        const quizData = JSON.parse(normContent);

        if (!quizData.question || !quizData.options || !Array.isArray(quizData.options) || 
            !quizData.correct_answer || !quizData.explanation) {
          return res.status(500).json({ error: 'Invalid quiz question format' });
        }

        return res.status(200).json({
          question: quizData.question,
          options: quizData.options,
          correct_answer: quizData.correct_answer,
          explanation: quizData.explanation,
          category
        });
      } catch (e) {
        console.error('Normalization path failed:', e);
        return res.status(500).json({ error: 'Invalid JSON response from AI' });
      }
    }

    console.error('Error in groq-quiz API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}