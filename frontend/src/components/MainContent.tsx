import React, { useEffect, useState } from "react";
import "../App.css";
import InteractiveAnalysis from "./InterativeAnalysis.tsx";
import supabase from "../supabaseClient";
import axios from "axios";

interface AnalysisResponse {
  analysis: string;
  sources: string[];
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'system';
  timestamp: Date;
  chat_id: string;
  user_id: string;
  analysis?: string;
  sources?: string[];
}

interface MainContentProps {
  setShowTimelinePanel: (show: boolean) => void;
  showSidePanel: boolean;
  showTimelinePanel: boolean;
  isPoppedOutTimeline: boolean;
  statement: string;
  setStatement: (statement: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  startCapture: () => void;
  transcript: string;
  analysis: string;
  sources: string[];
  getTopEmotions: () => { [key: string]: number };
  showScreenPopup: boolean;
  popupPosition: { x: number; y: number };
  popupRef: React.RefObject<HTMLDivElement | null>;
  handleDragStart: (e: React.MouseEvent) => void;
  handleDrag: (e: React.MouseEvent) => void;
  handleDragEnd: () => void;
  popOutWindow: () => void;
  closePopup: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  chatMessages?: ChatMessage[];
  activeChatId?: string | null;
}

const MainContent: React.FC<MainContentProps> = ({
  setShowTimelinePanel,
  showSidePanel,
  showTimelinePanel,
  isPoppedOutTimeline,
  statement,
  setStatement,
  handleSubmit,
  loading,
  startCapture,
  transcript,
  analysis,
  sources,
  getTopEmotions,
  showScreenPopup,
  popupPosition,
  popupRef,
  handleDragStart,
  handleDrag,
  handleDragEnd,
  popOutWindow,
  closePopup,
  videoRef,
  chatMessages = [],
  activeChatId
}) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessageAnalysis, setSelectedMessageAnalysis] = useState<string>("");
  const [selectedMessageSources, setSelectedMessageSources] = useState<string[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Happy Late Night";
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    if (hour < 22) return "Good Evening";
    return "Happy Late Night";
  };

  const getUserName = () => {
    // Retrieve first name from localStorage, default to "User" if not found
    return localStorage.getItem('firstName') || "User";
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add this useEffect to scroll to bottom when messages change
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatMessages]);

  // Function to fetch analysis for a message
  const fetchMessageAnalysis = async (message: ChatMessage) => {
    setIsLoadingAnalysis(true);

    try {
      // First check if this message already has analysis stored in Supabase
      const { data: messageData, error } = await supabase
        .from('chat_messages')
        .select('analysis, sources')
        .eq('id', message.id)
        .single();

      if (error) {
        console.error("Error fetching message analysis:", error);
        
        // If the message doesn't have analysis, look for a system response
        const userMessageIndex = chatMessages.findIndex(m => m.id === message.id);
        
        // Look for the next message from system
        if (userMessageIndex >= 0 && userMessageIndex + 1 < chatMessages.length && 
            chatMessages[userMessageIndex + 1].sender === 'system') {
          
          const systemResponse = chatMessages[userMessageIndex + 1];
          
          // Get the full analysis for this system message
          const { data: systemData, error: systemError } = await supabase
            .from('chat_messages')
            .select('analysis, sources')
            .eq('id', systemResponse.id)
            .single();
            
          if (!systemError && systemData) {
            setSelectedMessageAnalysis(systemData.analysis || systemResponse.content);
            setSelectedMessageSources(systemData.sources || []);
            return;
          }
          
          // Fallback to just using the content
          setSelectedMessageAnalysis(systemResponse.content);
          setSelectedMessageSources([]);
          return;
        }
        
        // If we can't find anything, create a new analysis
        if (message.content) {
          try {
            setSelectedMessageAnalysis("Analyzing message...");
            
            const response = await axios.post<AnalysisResponse>(
              "http://127.0.0.1:5000/analyze", 
              { statement: message.content },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
              }
            );
            
            setSelectedMessageAnalysis(
              typeof response.data.analysis === 'string'
                ? response.data.analysis
                : JSON.stringify(response.data.analysis, null, 2)
            );
            setSelectedMessageSources(response.data.sources);
            
            // Save this analysis for future reference
            await supabase
              .from('chat_messages')
              .update({
                analysis: typeof response.data.analysis === 'string'
                  ? response.data.analysis
                  : JSON.stringify(response.data.analysis),
                sources: response.data.sources
              })
              .eq('id', message.id);
              
          } catch (analysisError) {
            console.error("Error creating new analysis:", analysisError);
            setSelectedMessageAnalysis("Error creating analysis. Please try again.");
            setSelectedMessageSources([]);
          }
        } else {
          setSelectedMessageAnalysis("Analysis not available for this message.");
          setSelectedMessageSources([]);
        }
        return;
      }
      
      // We found existing analysis in the database
      if (messageData) {
        let analysisContent = messageData.analysis || "";
        
        // If analysis is a stringified JSON, parse it for better formatting
        try {
          const parsedAnalysis = JSON.parse(analysisContent);
          if (typeof parsedAnalysis === 'object') {
            analysisContent = Object.entries(parsedAnalysis)
              .map(([key, value]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
              .join('\n\n');
          }
        } catch (e) {
          // Not JSON, use as is
        }
        
        setSelectedMessageAnalysis(analysisContent);
        setSelectedMessageSources(messageData.sources || []);
      } else {
        setSelectedMessageAnalysis("No analysis available");
        setSelectedMessageSources([]);
      }
    } catch (error) {
      console.error("Error in fetchMessageAnalysis:", error);
      setSelectedMessageAnalysis("Error retrieving analysis");
      setSelectedMessageSources([]);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Function to handle message click
  const handleMessageClick = (message: ChatMessage) => {
    // Toggle selection - deselect if already selected
    if (selectedMessageId === message.id) {
      setSelectedMessageId(null);
      setSelectedMessageAnalysis("");
      setSelectedMessageSources([]);
      return;
    }
    
    setSelectedMessageId(message.id);
    
    // Only fetch analysis for user messages
    if (message.sender === 'user') {
      fetchMessageAnalysis(message);
    } else {
      setSelectedMessageAnalysis(message.content);
      setSelectedMessageSources([]);
      setIsLoadingAnalysis(false);
    }
  };

  const suggestions = [
    {
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className="suggestion-icon"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      title: (<div className="suggestion-title">Screen Capture</div>),
      action: startCapture,
    },
    {
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className="suggestion-icon-filled"
        >
          <rect x="3" y="13" width="4" height="7" rx="1"></rect>
          <rect x="10" y="8" width="4" height="12" rx="1"></rect>
          <rect x="17" y="3" width="4" height="17" rx="1"></rect>
        </svg>
      ),
      title: (<div className="suggestion-title">Timeline Graph</div>),
      action: () => setShowTimelinePanel(!showTimelinePanel),
    },
    {
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          className="suggestion-icon"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" /> 
          <path d="M2 17l10 5 10-5" /> 
          <path d="M2 12l10 5 10-5" /> 
        </svg>
      ),
      title: (<div className="suggestion-title">Credibility</div>),
      action: () => {}, // Add a placeholder action if needed
    }
  ];

  // CSS styles for chat messages
  const chatMessagesStyles = `
  .chat-messages-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 400px;
    max-height: calc(100vh - 220px);
    margin: 20px 0;
    background-color: #1e1e1e;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chat-message {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 12px;
    position: relative;
    animation: fadeIn 0.3s ease;
    word-wrap: break-word;
    line-height: 1.5;
  }

  .user-message {
    background-color: #2196f3;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }

  .system-message {
    background-color: #333;
    color: #e0e0e0;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }

  .message-content {
    font-size: 14px;
    margin-bottom: 4px;
    white-space: pre-line; /* Preserves line breaks */
  }

  .message-timestamp {
    font-size: 10px;
    opacity: 0.7;
    text-align: right;
    margin-top: 4px;
  }

  .empty-chat-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
    font-style: italic;
    text-align: center;
    padding: 20px;
  }

  .chat-header {
    padding: 12px 20px;
    background-color: #252525;
    border-bottom: 1px solid #333;
    display: flex;
    align-items: center;
  }

  .chat-title {
    font-size: 16px;
    font-weight: 500;
    color: #e0e0e0;
  }

  .message-hint {
    font-size: 10px;
    font-style: italic;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    display: none;
  }
  
  .user-message:hover .message-hint {
    display: block;
  }
  
  .selected-message {
    box-shadow: 0 0 0 2px #4CAF50;
  }
  
  .selected-message-analysis {
    margin-top: 20px;
    padding: 16px;
    background-color: #272727;
    border-radius: 12px;
    border: 1px solid #333;
  }
  
  .selected-message-analysis h3 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    color: #e0e0e0;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
  }
  
  .analysis-loading {
    padding: 20px;
    text-align: center;
    color: #aaa;
    font-style: italic;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  `;
  
  return (
    <div
      className={`main-content 
        ${showSidePanel ? "sidebar-open" : "sidebar-closed"}
        ${showTimelinePanel ? "timeline-panel-open" : ""}
        ${isPoppedOutTimeline ? "timeline-panel-popped-out" : ""}
      `}
    >
      <div className="content-wrapper">
        {!activeChatId ? (
          // Show default welcome screen when no chat is selected
          <>
            <div className="greeting-section">
              <div className="wrap">
                <div className="veritasso-logo">
                  <div className="veritasso-infinity">
                    <div className="veritasso-left"></div>
                    <div className="veritasso-right"></div>
                    <div className="veritasso-bridge"></div>
                  </div>
                </div>
              </div>
              <h1 className="greeting-text">
                {getTimeOfDay()}, {getUserName()}
              </h1>
            </div>

            <div className="suggestion-cards">
              {suggestions.map((suggestion, index) => (
                <div 
                  className="card" 
                  key={index} 
                  onClick={suggestion.action}
                >
                  <div className="card-icon">{suggestion.icon}</div>
                  <div className="card-title">{suggestion.title}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Show chat messages when a chat is selected
          <div className="chat-messages-container">
            <style>{chatMessagesStyles}</style>
            <div className="chat-messages">
              {chatMessages && chatMessages.length > 0 ? (
                chatMessages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`chat-message ${message.sender === 'user' ? 'user-message' : 'system-message'} ${selectedMessageId === message.id ? 'selected-message' : ''}`}
                    onClick={() => handleMessageClick(message)}
                    style={{ 
                      cursor: message.sender === 'user' ? 'pointer' : 'default'
                    }}
                  >
                    <div className="message-content">{message.content}</div>
                    <div className="message-timestamp">
                      {formatTimestamp(message.timestamp)}
                    </div>
                    {message.sender === 'user' && (
                      <div className="message-hint">
                        Click to view analysis
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-chat-message">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              )}
            </div>
            
            {/* Selected message analysis section */}
            {selectedMessageId && (
              <div className="selected-message-analysis">
                <h3>Analysis for Selected Message</h3>
                {isLoadingAnalysis ? (
                  <div className="analysis-loading">Loading analysis...</div>
                ) : (
                  <InteractiveAnalysis 
                    analysis={selectedMessageAnalysis} 
                    sources={selectedMessageSources} 
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="message-input-container">
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder={activeChatId 
                  ? "Type your message here..." 
                  : "Enter your passage or statements to Veritas..."
                }
                rows={1}
                className="message-input"
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button
                type="button"
                className="screen-capture-button"
                onClick={startCapture}
                title="Screen Capture"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="2"
                    y="3"
                    width="20"
                    height="14"
                    rx="2"
                    ry="2"
                  ></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </button>
              {statement && (
                <button
                  type="submit"
                  className="send-button"
                  disabled={loading}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                  </svg>
                </button>
              )}
            </div>
          </form>
          <div className="buddi-footer">
            <p>
              Veritas may make mistakes. Check important info and please
              report any bugs.
            </p>
          </div>
        </div>

        {transcript && (
          <div className="result-box">
            <h2>Transcript</h2>
            <p>{transcript}</p>
          </div>
        )}

        {showScreenPopup && (
          <div
            ref={popupRef}
            className="screen-popup"
            style={{
              left: popupPosition.x,
              top: popupPosition.y,
            }}
          >
            <div
              className="popup-header"
              onMouseDown={handleDragStart}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
            >
              <h3>Screen Capture</h3>
              <div className="popup-controls">
                <button
                  onClick={popOutWindow}
                  className="popup-button"
                  title="Pop Out"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </button>
                <button
                  onClick={closePopup}
                  className="popup-button"
                  title="Close"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <video
              ref={videoRef}
              autoPlay
              className="popup-video"
            ></video>
          </div>
        )}

        {analysis && !selectedMessageId && (
          <InteractiveAnalysis analysis={analysis} sources={sources} />
        )}

        {Object.keys(getTopEmotions()).length > 0 && (
          <div className="emotion-box">
            <h2>Emotion Analysis</h2>
            {Object.entries(getTopEmotions()).map(([emotion, score]) => (
              <div
                key={emotion}
                className="emotion-bar"
                data-emotion={emotion}
              >
                <span>{emotion}</span>
                <div
                  className="bar"
                  style={
                    {
                      "--emotion-width": `${score * 100}%`,
                    } as React.CSSProperties
                  }
                ></div>
                <span className="score">{score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;