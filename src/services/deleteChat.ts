import { supabase } from './auth';

export async function deleteChatById(chatId: string): Promise<void> {
  const { error } = await supabase.from('chats').update({ is_visible: false }).eq('id', chatId);
  if (error) {
    throw error;
  }
}
