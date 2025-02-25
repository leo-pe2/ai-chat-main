import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, validateConfig } from '../config/env.config';
import { supabase } from './supabaseClient';


validateConfig();

const PERSONALITY_PROMPT = `You are a helpful assistant that answers questions and provides information. You are friendly, professional, and knowledgeable. You are always ready to help and provide accurate information. You are an expert in coding and academics. `;

export async function getAIBackendResponse(
  prompt: string, 
  model: string, 
  history: { sender: string; text: string }[] = []
): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, history })
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.response || 'No response generated';
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
    .update({ content: conversation }) 
    .eq('id', chatId);
  if (error) {
    throw error;
  }
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
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
    .select('*')  
    .eq('id', chatId)
    .maybeSingle();  

  console.log('getChatById response:', { data, error });
  if (error) {
    console.error('getChatById error:', error);
    throw error;
  }
  return data;
}

export async function deleteChatById(chatId: string): Promise<void> {
  const { error } = await supabase.from('chats').update({ is_visible: false }).eq('id', chatId);
  if (error) {
    throw error;
  }
}

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