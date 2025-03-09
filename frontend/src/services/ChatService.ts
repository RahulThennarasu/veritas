import supabase from '../supabaseClient';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'system';
  timestamp: Date;
  chat_id: string;
}

interface Chat {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

/**
 * Service class for chat-related operations
 */
class ChatService {
  /**
   * Get all chats for the current user
   */
  static async getUserChats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, chats: data || [] };
    } catch (error: any) {
      console.error('Error fetching chats:', error.message);
      return { success: false, error: error.message, chats: [] };
    }
  }
  
  /**
   * Create a new chat
   */
  static async createChat(name: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('chats')
        .insert([{ name, user_id: user.id }])
        .select();
      
      if (error) throw error;
      
      return { success: true, chat: data ? data[0] : null };
    } catch (error: any) {
      console.error('Error creating chat:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update a chat's name
   */
  static async updateChat(chatId: string, name: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // First check if the chat belongs to this user
      const { data: chatData } = await supabase
        .from('chats')
        .select('user_id')
        .eq('id', chatId)
        .single();
        
      if (!chatData || chatData.user_id !== user.id) {
        throw new Error('Chat not found or not owned by you');
      }
      
      const { data, error } = await supabase
        .from('chats')
        .update({ name, updated_at: new Date() })
        .eq('id', chatId)
        .select();
      
      if (error) throw error;
      
      return { success: true, chat: data ? data[0] : null };
    } catch (error: any) {
      console.error('Error updating chat:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Delete a chat and all its messages
   */
  static async deleteChat(chatId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // First check if the chat belongs to this user
      const { data: chatData } = await supabase
        .from('chats')
        .select('user_id')
        .eq('id', chatId)
        .single();
        
      if (!chatData || chatData.user_id !== user.id) {
        throw new Error('Chat not found or not owned by you');
      }
      
      // Delete the chat (messages will cascade delete)
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting chat:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get all messages for a specific chat
   */
  static async getChatMessages(chatId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // First verify this chat belongs to the current user
      const { data: chatData } = await supabase
        .from('chats')
        .select('user_id')
        .eq('id', chatId)
        .single();
        
      if (!chatData || chatData.user_id !== user.id) {
        throw new Error('Chat not found or not owned by you');
      }
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      return { success: true, messages: data || [] };
    } catch (error: any) {
      console.error('Error fetching chat messages:', error.message);
      return { success: false, error: error.message, messages: [] };
    }
  }
  
  /**
   * Add a message to a chat
   */
  static async addMessage(chatId: string, content: string, sender: 'user' | 'system') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // First verify this chat belongs to the current user
      const { data: chatData } = await supabase
        .from('chats')
        .select('user_id')
        .eq('id', chatId)
        .single();
        
      if (!chatData || chatData.user_id !== user.id) {
        throw new Error('Chat not found or not owned by you');
      }
      
      const newMessage = {
        content,
        sender,
        chat_id: chatId,
        user_id: user.id,
        timestamp: new Date()
      };
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([newMessage])
        .select();
      
      if (error) throw error;
      
      // Update the chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date() })
        .eq('id', chatId);
      
      return { success: true, message: data ? data[0] : null };
    } catch (error: any) {
      console.error('Error adding message:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Set up a real-time subscription for new messages in a chat
   */
  static subscribeToChat(chatId: string, callback: (message: ChatMessage) => void) {
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
      
    return subscription;
  }
  
  /**
   * Get last active chat ID for current user
   */
  static async getLastActiveChat() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'User not authenticated' };
      
      // Get last active chat ID from local storage
      const lastChatId = localStorage.getItem('lastActiveChatId');
      
      if (!lastChatId) {
        // If no last chat found, get most recent chat
        const { data, error } = await supabase
          .from('chats')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error || !data) {
          return { success: true, chatId: null }; // No chats found
        }
        
        return { success: true, chatId: data.id };
      }
      
      // Verify the stored chat ID belongs to this user
      const { data, error } = await supabase
        .from('chats')
        .select('id')
        .eq('id', lastChatId)
        .eq('user_id', user.id)
        .single();
        
      if (error || !data) {
        // Chat doesn't exist or doesn't belong to user
        localStorage.removeItem('lastActiveChatId');
        return { success: true, chatId: null };
      }
      
      return { success: true, chatId: data.id };
    } catch (error: any) {
      console.error('Error getting last active chat:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Save the current active chat ID
   */
  static saveActiveChat(chatId: string | null) {
    if (chatId) {
      localStorage.setItem('lastActiveChatId', chatId);
    } else {
      localStorage.removeItem('lastActiveChatId');
    }
  }
}

export default ChatService;