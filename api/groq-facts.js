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
    const { prompt, category, expand } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get Groq API key from environment variables
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are Buddy, a fun, respectful, and family-friendly guide for teenagers. Always respond with appropriate, positive, and educational content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: expand ? 150 : 80,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', errorText);
      return res.status(500).json({ error: 'Failed to generate content' });
    }

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: 'No content generated' });
    }

    // Return the appropriate response based on whether it's an expansion or new fact
    if (expand) {
      return res.status(200).json({ expansion: content });
    } else {
      return res.status(200).json({ fact: content, category });
    }

  } catch (error) {
    console.error('Error in groq-facts API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}