import { getAIBackendResponse } from './backendapi';

export async function generateChatTitle(firstMessage: string): Promise<string> {
  // Compose a prompt with the system instruction along with the first user message
  const prompt = `Create a very short chat name for the following conversation starter: "${firstMessage}"`;
  const titleResponse = await getAIBackendResponse(prompt, '4o-mini');
  const generatedTitle = titleResponse.trim() || "Chat";
  return generatedTitle;
}