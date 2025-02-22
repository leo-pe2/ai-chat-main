import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Explicitly load .env.development so that all VITE_ variables are available.
dotenv.config({ path: './.env.development' });

const app = express();

// Configure CORS to accept requests from your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['POST'],
  credentials: true
}));
app.use(express.json());

// Debug/log all incoming requests (optional)
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Initialize API clients
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });
const deepseek = new OpenAI({
  apiKey: process.env.VITE_DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1"
});
const anthropic = new Anthropic({ apiKey: process.env.VITE_ANTHROPIC_API_KEY });
const googleGenAI = new GoogleGenerativeAI(process.env.VITE_GOOGLE_API_KEY || '');
const googleModel = googleGenAI.getGenerativeModel({ model: "gemini-pro" });

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, model, history } = req.body;

    let response;
    if (model === '4o-mini') {
      const messages = history.map((msg: any) => ({ 
        role: msg.sender === 'user' ? 'user' : 'assistant', 
        content: msg.text 
      }));
      messages.push({ role: 'user', content: prompt });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });
      response = completion.choices[0].message?.content;
      
    } else if (model === 'o1-mini') {
      const messages = history.map((msg: any) => ({ 
        role: msg.sender === 'user' ? 'user' : 'assistant', 
        content: msg.text 
      }));
      messages.push({ role: 'user', content: prompt });

      const completion = await openai.chat.completions.create({
        model: 'o1-mini',
        messages,
      });
      response = completion.choices[0].message?.content;

    } else if (model === 'DeepSeek Reasoner') {
      const completion = await deepseek.chat.completions.create({
        model: "deepseek-reasoner",
        messages: [{ role: 'user', content: prompt }]
      });
      response = completion.choices[0].message?.content;

    } else if (model === 'Gemini 2.0 Flash') {
      const result = await googleModel.generateContent(prompt);
      response = (await result.response).text();
    }

    // Log the successful endpoint hit
    console.log('Response sent for /api/chat');
    res.json({ response });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // Log a full error object for debugging (remove stack trace in production)
    res.status(500).json({ error: error.message || 'Internal server error', details: error.stack });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
