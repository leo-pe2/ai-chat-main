import { supabase } from './auth';

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
