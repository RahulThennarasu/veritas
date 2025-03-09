import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

interface Chat {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

const ChatList: React.FC<ChatListProps> = ({ onSelectChat, selectedChatId }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [newChatName, setNewChatName] = useState<string>('');
  const [showNewChatInput, setShowNewChatInput] = useState<boolean>(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatName, setEditChatName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch user chats on component mount
  useEffect(() => {
    fetchUserChats();
  }, []);

  const fetchUserChats = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setChats(data || []);
      
      // If there are chats and none is selected, select the first one
      if (data && data.length > 0 && !selectedChatId) {
        onSelectChat(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    if (!newChatName.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }
      
      const { data, error } = await supabase
        .from('chats')
        .insert([
          { 
            name: newChatName.trim(),
            user_id: user.id 
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setChats(prevChats => [data[0], ...prevChats]);
        onSelectChat(data[0].id);
      }
      
      // Reset input and hide it
      setNewChatName('');
      setShowNewChatInput(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const updateChatName = async (chatId: string) => {
    if (!editChatName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .update({ name: editChatName.trim() })
        .eq('id', chatId);
      
      if (error) {
        throw error;
      }
      
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId ? { ...chat, name: editChatName.trim() } : chat
        )
      );
      
      // Reset editing state
      setEditingChatId(null);
      setEditChatName('');
    } catch (error) {
      console.error('Error updating chat name:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
      
      if (error) {
        throw error;
      }
      
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was selected, select another chat
      if (selectedChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          onSelectChat(remainingChats[0].id);
        } else {
          onSelectChat('');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowNewChatInput(false);
      setEditingChatId(null);
    }
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Your Chats</h3>
        <button 
          className="new-chat-button"
          onClick={() => setShowNewChatInput(true)}
          title="New Chat"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
      
      {showNewChatInput && (
        <div className="new-chat-input-container">
          <input
            type="text"
            placeholder="New chat name..."
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, createNewChat)}
            autoFocus
          />
          <div className="new-chat-actions">
            <button onClick={createNewChat}>Create</button>
            <button onClick={() => setShowNewChatInput(false)}>Cancel</button>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="chat-list-loading">Loading chats...</div>
      ) : chats.length === 0 ? (
        <div className="empty-chat-list">
          <p>No chats yet. Create your first chat!</p>
        </div>
      ) : (
        <ul className="chats">
          {chats.map((chat) => (
            <li 
              key={chat.id}
              className={`chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
            >
              {editingChatId === chat.id ? (
                <div className="edit-chat-container">
                  <input
                    type="text"
                    value={editChatName}
                    onChange={(e) => setEditChatName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, () => updateChatName(chat.id))}
                    autoFocus
                  />
                  <div className="edit-chat-actions">
                    <button onClick={() => updateChatName(chat.id)}>Save</button>
                    <button onClick={() => setEditingChatId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span 
                    className="chat-name"
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="chat-icon"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {chat.name}
                  </span>
                  <div className="chat-actions">
                    <button 
                      className="edit-chat-button"
                      onClick={() => {
                        setEditingChatId(chat.id);
                        setEditChatName(chat.name);
                      }}
                      title="Rename"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </button>
                    <button 
                      className="delete-chat-button"
                      onClick={() => deleteChat(chat.id)}
                      title="Delete"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatList;