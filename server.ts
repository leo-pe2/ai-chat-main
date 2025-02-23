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
    
    }  else if (model === 'o3-mini' || model === 'o3-mini-high' || model === 'DeepSeek R1') {
      // New branch using openrouter with full conversation history + extra headers & logging
      const messages = history.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
      }));
      messages.push({ role: 'user', content: prompt });
      
      const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: `openai/${model}`,
        messages
      })
      });
      
      const data = await openrouterRes.json();
      console.log('openrouter response:', data); // Log full data to debug
      response = data.message?.content || data.choices?.[0]?.message?.content || "No response generated";
    } else {
      throw new Error('Unknown model selected');
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
