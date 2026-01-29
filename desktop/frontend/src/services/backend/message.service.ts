import { supabase } from './auth.service';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'link';
  file_url?: string;
  created_at: string;
}

export interface CreateMessageData {
  room_id: string;
  user_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'image' | 'link';
  file_url?: string;
}

export const messageService = {
  async sendMessage(data: CreateMessageData) {
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        ...data,
        message_type: data.message_type || 'text',
      })
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return message;
  },

  async getMessages(roomId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  async updateMessage(messageId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  },

  subscribeToMessages(roomId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },

  unsubscribeFromMessages(roomId: string) {
    return supabase.channel(`room:${roomId}`).unsubscribe();
  },
};
