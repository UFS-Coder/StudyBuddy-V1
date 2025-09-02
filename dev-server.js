import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import the API handlers
import groqFactsHandler from './api/groq-facts.js';
import groqChatHandler from './api/groq-chat.js';
import generatePracticeQuestionsHandler from './api/generate-practice-questions.js';
import smartifyHandler from './api/notes/smartify.js';

// Convert Vercel handler to Express middleware
app.post('/api/groq-facts', async (req, res) => {
  // Create a mock Vercel-like req/res object
  const mockReq = {
    method: req.method,
    body: req.body,
    headers: req.headers
  };
  
  const mockRes = {
    setHeader: (key, value) => res.setHeader(key, value),
    status: (code) => {
      res.status(code);
      return {
        json: (data) => res.json(data),
        end: () => res.end()
      };
    },
    json: (data) => res.json(data)
  };
  
  try {
    await groqFactsHandler(mockReq, mockRes);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add groq chat completions endpoint
app.post('/api/groq/chat/completions', async (req, res) => {
  // Create a mock Vercel-like req/res object
  const mockReq = {
    method: req.method,
    body: req.body,
    headers: req.headers
  };
  
  const mockRes = {
    setHeader: (key, value) => res.setHeader(key, value),
    status: (code) => {
      res.status(code);
      return {
        json: (data) => res.json(data),
        end: () => res.end()
      };
    },
    json: (data) => res.json(data)
  };
  
  try {
    await groqChatHandler(mockReq, mockRes);
  } catch (error) {
    console.error('Groq Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add generate practice questions endpoint
app.post('/api/generate-practice-questions', async (req, res) => {
  // Create a mock Vercel-like req/res object
  const mockReq = {
    method: req.method,
    body: req.body,
    headers: req.headers
  };
  
  const mockRes = {
    setHeader: (key, value) => res.setHeader(key, value),
    status: (code) => {
      res.status(code);
      return {
        json: (data) => res.json(data),
        end: () => res.end()
      };
    },
    json: (data) => res.json(data)
  };
  
  try {
    await generatePracticeQuestionsHandler(mockReq, mockRes);
  } catch (error) {
    console.error('Generate Practice Questions API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add smartify notes endpoint
app.post('/api/notes/smartify', async (req, res) => {
  // Create a mock Vercel-like req/res object
  const mockReq = {
    method: req.method,
    body: req.body,
    headers: req.headers
  };
  
  const mockRes = {
    setHeader: (key, value) => res.setHeader(key, value),
    status: (code) => {
      res.status(code);
      return {
        json: (data) => res.json(data),
        end: () => res.end()
      };
    },
    json: (data) => res.json(data)
  };
  
  try {
    await smartifyHandler(mockReq, mockRes);
  } catch (error) {
    console.error('Smartify API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Development API server running on http://localhost:${PORT}`);
});