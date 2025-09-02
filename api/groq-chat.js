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
    const { messages, model, temperature, max_tokens, stream } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get Groq API key from environment variables
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
    }

    console.log('Sending Request to the Target: POST /api/groq/chat/completions');

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        stream: stream || false
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', errorText);
      return res.status(groqResponse.status).json({ 
        error: 'Failed to generate response',
        details: errorText
      });
    }

    const data = await groqResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in groq-chat handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}