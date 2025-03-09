export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'system';
    timestamp: Date;
    chat_id: string;
    user_id: string;
  }