// UserPreferencesService.ts
import supabase from '../supabaseClient';

class UserPreferencesService {
  // Get the last active chat for the user
  static async getLastActiveChat() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get preferences with last active chat
      const { data, error } = await supabase
        .from('user_preferences')
        .select('last_active_chat_id')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        // If no record exists, create one
        if (error.code === 'PGRST116') {
          await supabase
            .from('user_preferences')
            .insert([{ user_id: user.id }]);
          return { success: true, chatId: null };
        }
        throw error;
      }
      
      return { success: true, chatId: data.last_active_chat_id };
    } catch (error) {
      console.error('Error getting last active chat:', error);
      return { success: false, chatId: null };
    }
  }
  
  // Update the last active chat for the user
  static async updateLastActiveChat(chatId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id,
          last_active_chat_id: chatId,
          last_active_time: new Date()
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating last active chat:', error);
      return { success: false };
    }
  }
}

export default UserPreferencesService;