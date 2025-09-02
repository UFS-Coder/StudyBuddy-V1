// Direct Groq API implementation for practice questions

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, subtopic, gradeBand, questionCount = 10, language = 'de-DE' } = req.body;

    if (!topic || !subtopic || !gradeBand) {
      return res.status(400).json({ error: 'Missing required fields: topic, subtopic, gradeBand' });
    }

    // Create the prompt for generating practice questions
    const prompt = `Generate exactly ${questionCount} German practice questions for the subtopic "${subtopic}" within the broader topic "${topic}". 

Level of difficulty: ${gradeBand}

Requirements:
- All questions must be in German
- Include a mix of question types: Multiple Choice (MCQ), True/False (Richtig/Falsch), Fill-in-the-Blank (Lückentext), and Short Answer (Kurzantwort)
- At least 3 different question types must be included
- Questions should be appropriate for ${gradeBand} level
- Provide correct answers for each question
- Focus primarily on the subtopic "${subtopic}" but use "${topic}" as supporting context

Return the response as a JSON array where each question object has this structure:
{
  "question": "The question text in German",
  "type": "mcq|true_false|fill_blank|short_answer",
  "options": ["option1", "option2", "option3", "option4"] // only for MCQ questions
  "correct_answer": "The correct answer",
  "explanation": "Brief explanation in German (optional)"
}

Ensure the JSON is valid and properly formatted.`;

    // Call Groq API
    const messages = [
      {
        role: 'system',
        content: 'You are an expert German educator who creates practice questions for students. Always respond with valid JSON only, no additional text or formatting.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

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
         model: 'llama-3.3-70b-versatile',
         messages: messages,
         max_tokens: 4000,
         temperature: 0.7,
         top_p: 0.9
       })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', errorText);
      return res.status(500).json({ error: 'Failed to generate practice questions' });
    }

    const groqData = await groqResponse.json();
    const response = groqData;

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Groq API');
    }

    // Parse the JSON response
    let questions;
    try {
      // Clean the response to extract JSON
      const cleanedContent = content.replace(/```json\n?|```\n?/g, '').trim();
      questions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format received');
    }

    // Ensure we have exactly the requested number of questions
    const validQuestions = questions.slice(0, questionCount).map((q, index) => ({
      id: index + 1,
      question: q.question || '',
      type: q.type || 'short_answer',
      options: q.options || [],
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || ''
    }));

    if (validQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    res.status(200).json(validQuestions);

  } catch (error) {
    console.error('Error generating practice questions:', error);
    res.status(500).json({ 
      error: 'Failed to generate practice questions',
      details: error.message 
    });
  }
}