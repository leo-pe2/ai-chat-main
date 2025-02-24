import { getAIBackendResponse } from './backendapi';

export async function generateChatTitle(firstMessage: string): Promise<string> {
  // Compose a prompt with the system instruction along with the first user message
  const prompt = `Generate ONE concise and descriptive chat names based on the following topic(s) or purpose. The names should be clear, professional, and reflect the core subject of the discussion. Use no more than 3-5 words per name. Ensure that the names are unique and easy to understand at a glance "${firstMessage}"`;
  const titleResponse = await getAIBackendResponse(prompt, '4o-mini');
  const generatedTitle = titleResponse.trim() || "Chat";
  return generatedTitle;
}