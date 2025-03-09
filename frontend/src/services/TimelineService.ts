import supabase from '../supabaseClient';

interface TimelineDataPoint {
  time: number;
  count: number;
}

/**
 * Service for managing timeline data in Supabase
 */
class TimelineService {
  /**
   * Save a timeline data point to Supabase
   * @param chatId The chat ID this data belongs to
   * @param dataType 'true_claim' or 'false_claim'
   * @param count Number of claims detected
   */
  static async saveTimelineData(chatId: string, dataType: 'true_claim' | 'false_claim', count: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('chat_timeline_data')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          data_type: dataType,
          count: count,
          timestamp: new Date().toISOString()
        });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error(`Error saving ${dataType} data:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Load timeline data for a specific chat
   * @param chatId The chat ID to load data for
   */
  static async loadTimelineData(chatId: string) {
    try {
      console.log("TimelineService: Starting to load data for chat", chatId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("TimelineService: No authenticated user found");
        throw new Error('User not authenticated');
      }
      
      console.log("TimelineService: Loading true claims...");
      // Get true claims
      const { data: trueClaimsData, error: trueError } = await supabase
        .from('chat_timeline_data')
        .select('timestamp, count')
        .eq('chat_id', chatId)
        .eq('data_type', 'true_claim')
        .order('timestamp', { ascending: true });
      
      if (trueError) {
        console.error("TimelineService: Error loading true claims:", trueError);
        throw trueError;
      }
      
      console.log("TimelineService: Loading false claims...");
      // Get false claims
      const { data: falseClaimsData, error: falseError } = await supabase
        .from('chat_timeline_data')
        .select('timestamp, count')
        .eq('chat_id', chatId)
        .eq('data_type', 'false_claim')
        .order('timestamp', { ascending: true });
      
      if (falseError) {
        console.error("TimelineService: Error loading false claims:", falseError);
        throw falseError;
      }
      
      // Log the raw data
      console.log("TimelineService: Raw true claims data:", trueClaimsData);
      console.log("TimelineService: Raw false claims data:", falseClaimsData);
      
      // Convert to the format expected by the application
      const trueClaims = (trueClaimsData || []).map(item => ({
        time: new Date(item.timestamp).getTime(),
        count: item.count
      }));
      
      const falseClaims = (falseClaimsData || []).map(item => ({
        time: new Date(item.timestamp).getTime(),
        count: item.count
      }));
      
      console.log("TimelineService: Processed true claims:", trueClaims);
      console.log("TimelineService: Processed false claims:", falseClaims);
      
      return { 
        success: true, 
        trueClaims,
        falseClaims
      };
    } catch (error: any) {
      console.error('TimelineService: Error loading timeline data:', error.message);
      return { 
        success: false, 
        error: error.message,
        trueClaims: [],
        falseClaims: []
      };
    }
  }
  
  /**
   * Delete all timeline data for a specific chat
   * @param chatId The chat ID to delete data for
   */
  static async deleteTimelineData(chatId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('chat_timeline_data')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting timeline data:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default TimelineService;