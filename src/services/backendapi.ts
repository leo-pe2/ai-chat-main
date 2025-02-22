import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, validateConfig } from '../config/env.config';
import { supabase } from './supabaseClient';


// Validate environment variables before initializing clients
validateConfig();

// openai model instructions
const PERSONALITY_PROMPT = `You are a helpful assistant that answers questions and provides information. You are friendly, professional, and knowledgeable. You are always ready to help and provide accurate information. You are an expert in coding and academics. `;

function getClients() {
  if (!config.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing');
  }
  if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is missing');
  }
  if (!config.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is missing');
  }
  if (!config.GOOGLE_API_KEY) {
    throw new Error('Google API key is missing');
  }

  const openai = new OpenAI({ 
    apiKey: config.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true 
  });

  const deepseek = new OpenAI({
    apiKey: config.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
    dangerouslyAllowBrowser: true
  });

  const anthropic = new Anthropic({ 
    apiKey: config.ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true 
  });

  const googleGenAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
  const googleModel = googleGenAI.getGenerativeModel({ model: "gemini-pro" });

  return { openai, anthropic, googleModel, deepseek };
}

export async function getAIBackendResponse(
  prompt: string, 
  model: string, 
  history: { sender: string; text: string }[] = []
): Promise<string> {
  const { openai, anthropic, googleModel, deepseek } = getClients();
  if (model === '4o-mini') {
    // Use stored conversation as provided; if empty, just start with the user message.
    const messages = (history && history.length)
      ? history.map(msg => ({ role: msg.sender as 'user'|'assistant'|'system', content: msg.text }))
      : [];
    messages.push({ role: 'user', content: prompt });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });
    return completion.choices[0].message?.content || 'No response generated';
  } else if (model === 'o1-mini') {
    const messages = (history && history.length)
      ? history.map(msg => ({ role: msg.sender as 'user'|'assistant'|'system', content: msg.text }))
      : [];
    messages.push({ role: 'user', content: prompt });
    const completion = await openai.chat.completions.create({
      model: 'o1-mini',
      messages,
    });
    return completion.choices[0].message?.content || 'No response generated';
  } else if (model === 'DeepSeek R1') {  // Updated branch for DeepSeek
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-reasoner",
      messages: [{ role: 'user', content: prompt }]
    });
    const answer = completion.choices[0].message?.content || '';
    return answer;
  } else if (model === 'Gemini 2.0 Flash') {
    const result = await googleModel.generateContent(prompt);
    const response = await result.response;
    return response.text() || 'No response generated';
 // } else if (model === 'Claude 3.5 Sonnet') {
 //   const response = await anthropic.messages.create({
 //     model: "claude-3-sonnet-20240229",
 //     messages: [{ role: "user", content: prompt }],
 //     temperature: 0.7,
 //   });
 //   return (response as any).completion || 'No response generated';
  } else {
    throw new Error('Unknown model selected');
  }
}

export async function getUserChats(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  return data || [];
}

export async function updateChatContent(chatId: string, conversation: any[]): Promise<void> {
  const { error } = await supabase
    .from('chats')
    .update({ content: conversation }) // Assumes a new 'content' column of type JSON exists
    .eq('id', chatId);
  if (error) {
    throw error;
  }
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  // Update title _and_ set the chat to visible.
  const { error } = await supabase
    .from('chats')
    .update({ title, is_visible: true })
    .eq('id', chatId);
  if (error) {
    throw error;
  }
}

export async function getChatById(chatId: string): Promise<any> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')  // remove the is_visible filter here
    .eq('id', chatId)
    .maybeSingle();  // use maybeSingle() to return null if no row found

  console.log('getChatById response:', { data, error }); // More detailed logging
  
  if (error) {
    console.error('getChatById error:', error);
    throw error;
  }
  return data;
}

// Function to delete chat by setting is_visible to false
export async function deleteChatById(chatId: string): Promise<void> {
  const { error } = await supabase.from('chats').update({ is_visible: false }).eq('id', chatId);
  if (error) {
    throw error;
  }
}

// Function to permanently delete old "New Chat" chats after 24 hours
export async function deleteOldNewChats(): Promise<void> {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('title', 'New Chat')
    .lt('created_at', twentyFourHoursAgo.toISOString());

  if (error) {
    throw error;
  }
}