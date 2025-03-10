import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient"; // Adjust the import path as needed
import { useNavigate } from "react-router-dom";
import Timeline from "./Timeline.tsx"; // Import the Timeline component
import ChatList from "./ChatList.tsx"; // Import the ChatList component
import "./ChatList.css"; // Import ChatList styles
import CredibilityFeature from './CredibilityFeature.tsx';

interface SidebarProps {
  showSidePanel: boolean;
  toggleSidePanel: () => void;
  showTimelinePanel: boolean;
  setShowTimelinePanel: (show: boolean) => void;
  isPoppedOut: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  panelRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handlePopOut: () => void;
  handleResizeStart: (e: React.MouseEvent, direction: string) => void;
  falseClaims: { time: number; count: number }[];
  trueClaims: { time: number; count: number }[];
  activeChatId?: string | null;
  setActiveChatId?: (id: string | null) => void;
  timelineLoading?: boolean;
  chatMessages?: any[]; 
  analysisSources?: string[];
  
}

const Sidebar: React.FC<SidebarProps> = ({
  showSidePanel,
  toggleSidePanel,
  showTimelinePanel,
  setShowTimelinePanel,
  isPoppedOut,
  position,
  size,
  panelRef,
  handleMouseDown,
  handlePopOut,
  handleResizeStart,
  falseClaims,
  trueClaims,
  activeChatId,
  setActiveChatId,
  timelineLoading = false,
  chatMessages,
  analysisSources
}) => {
  const [username, setUsername] = useState("User");
  const [isDiscussionExpanded, setIsDiscussionExpanded] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [bugReportMessage, setBugReportMessage] = useState("");
  const [bugReportSuccess, setBugReportSuccess] = useState(false);

  const getUserName = () => {
    // Retrieve first name from localStorage, default to "User" if not found
    return localStorage.getItem("firstName") || "User";
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return;

      const userId = data.user.id;
      
      try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`);
        if (!response.ok) throw new Error("User not found");

        const userData = await response.json();
        setUsername(userData.firstName || "User");
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };
  
  const handleSelectChat = (chatId: string) => {
    if (setActiveChatId) {
      setActiveChatId(chatId);
    }
    // Here you would typically load the selected chat's messages
    console.log(`Selected chat: ${chatId}`);
  };
  
  const sendBugReport = async () => {
    if (!bugReportMessage.trim()) return;
    
    try {
      // In a real application, you would send this to your backend
      // For now, we'll simulate sending an email
      console.log("Sending bug report:", bugReportMessage);
      
      // Simple email sending simulation - in production, replace with actual API call
      const emailContent = `
        Bug Report from: ${username}
        
        Message: ${bugReportMessage}
      `;
      
      // Log the email content to console
      console.log("Email that would be sent to rahulthennarasu07@gmail.com:");
      console.log(emailContent);
      
      // Simulate API call
      // In production, replace with actual email sending
      const sendEmail = async () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 1500);
        });
      };
      
      await sendEmail();
      
      setBugReportSuccess(true);
      setTimeout(() => {
        setShowBugReport(false);
        setBugReportSuccess(false);
        setBugReportMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error sending bug report:", error);
      alert("Failed to send bug report. Please try again later.");
    }
  };
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you'd update the app's theme here
    document.body.classList.toggle('light-mode');
  };
  
  const changeFontSize = (size: number) => {
    setFontSize(size);
    // In a real app, you'd update the app's font size here
    document.documentElement.style.setProperty('--base-font-size', `${size}px`);
  };

  return (
    <>
      {/* Sidebar toggle button - only visible when sidebar is closed */}
      {!showSidePanel && (
        <button
          className="sidebar-toggle-button"
          onClick={toggleSidePanel}
          title="Open Sidebar"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7"></path>
          </svg>
        </button>
      )}

      <div className={`sidebar ${showSidePanel ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>Hi, {getUserName()}</h2>
          <button
            className="icon-button outside-sidebar"
            onClick={toggleSidePanel}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
          </button>
        </div>

        <div className="sidebar-menu">
          <div
            className="menu-item"
            onClick={() => setShowTimelinePanel(!showTimelinePanel)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Timeline Graph</span>
          </div>

          {/* Timeline component is now imported and used here */}
          {showTimelinePanel && (
            <Timeline
              showSidePanel={showSidePanel}
              toggleSidePanel={toggleSidePanel}
              showTimelinePanel={showTimelinePanel}
              setShowTimelinePanel={setShowTimelinePanel}
              isPoppedOut={isPoppedOut}
              position={position}
              size={size}
              panelRef={panelRef}
              handleMouseDown={handleMouseDown}
              handlePopOut={handlePopOut}
              handleResizeStart={handleResizeStart}
              falseClaims={falseClaims}
              trueClaims={trueClaims}
              activeChatId={activeChatId}
              isLoading={timelineLoading}
            />
          )}

<CredibilityFeature 
  activeChatId={activeChatId} 
  analysisSourceUrls={analysisSources || []}
/>

          <div 
            className="menu-item"
            onClick={() => setIsDiscussionExpanded(!isDiscussionExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>
              Discussion Spaces
            </span>
            <svg
              style={{ 
                marginLeft: 'auto', 
                transform: isDiscussionExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.3s ease'
              }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          {isDiscussionExpanded && (
            <ChatList 
            onSelectChat={handleSelectChat} 
            selectedChatId={activeChatId || null}
          />
          )}

          <div className="menu-divider"></div>

          <div className="menu-item active">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2l-5.5 9h11L12 2z"></path>
              <path d="M6.5 11L2 20h20l-4.5-9H6.5z"></path>
            </svg>
            <span>Veritas</span>
          </div>

          <div className="menu-divider"></div>

          <div 
            className="menu-item"
            onClick={() => {
              setShowSettings(true);
              setShowBugReport(false);
              setShowHelp(false);
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
            </svg>
            <span>Settings</span>
          </div>

          <div 
            className="menu-item"
            onClick={() => {
              setShowBugReport(true);
              setShowSettings(false);
              setShowHelp(false);
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Report Bug</span>
          </div>

          <div 
            className="menu-item"
            onClick={() => {
              setShowHelp(true);
              setShowSettings(false);
              setShowBugReport(false);
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Help</span>
          </div>

          <div className="menu-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="sign-out-icon"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <button onClick={handleSignOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal for Settings */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="close-modal" onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <h4>Appearance</h4>
                <div className="setting-item">
                  <label>Dark Mode</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={toggleDarkMode}
                      id="darkmode-toggle"
                    />
                    <label htmlFor="darkmode-toggle" className="toggle-label"></label>
                  </div>
                </div>
                <div className="setting-item">
                  <label>Font Size</label>
                  <div className="font-size-controls">
                    <button onClick={() => changeFontSize(fontSize - 1)} disabled={fontSize <= 12}>-</button>
                    <span>{fontSize}px</span>
                    <button onClick={() => changeFontSize(fontSize + 1)} disabled={fontSize >= 20}>+</button>
                  </div>
                </div>
              </div>
              
              <div className="settings-section">
                <h4>Notification Preferences</h4>
                <div className="setting-item">
                  <label>Email Notifications</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="email-toggle"
                    />
                    <label htmlFor="email-toggle" className="toggle-label"></label>
                  </div>
                </div>
                <div className="setting-item">
                  <label>Push Notifications</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="push-toggle"
                    />
                    <label htmlFor="push-toggle" className="toggle-label"></label>
                  </div>
                </div>
              </div>
              
              <div className="settings-section">
                <h4>Account Settings</h4>
                <button className="text-button">Change Password</button>
                <button className="text-button">Privacy Settings</button>
                <button className="text-button text-danger">Delete Account</button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setShowSettings(false)}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Bug Report */}
      {showBugReport && (
        <div className="modal-overlay" onClick={() => setShowBugReport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report a Bug</h3>
              <button className="close-modal" onClick={() => setShowBugReport(false)}>×</button>
            </div>
            <div className="modal-body">
              {bugReportSuccess ? (
                <div className="success-message">
                  <svg className="success-icon" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
                  </svg>
                  <p>Bug report sent successfully! Thank you for your feedback.</p>
                </div>
              ) : (
                <>
                  <p>Please describe the bug you encountered in detail. This will be sent to: rahulthennarasu07@gmail.com</p>
                  <textarea
                    className="bug-report-textarea"
                    rows={6}
                    placeholder="Describe what happened, what you expected to happen, and any steps to reproduce the issue..."
                    value={bugReportMessage}
                    onChange={e => setBugReportMessage(e.target.value)}
                  ></textarea>
                  <div className="attachment-section">
                    <button className="text-button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                      </svg>
                      Attach Screenshot
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {!bugReportSuccess && (
                <>
                  <button className="secondary-button" onClick={() => setShowBugReport(false)}>Cancel</button>
                  <button 
                    className="primary-button" 
                    onClick={sendBugReport}
                    disabled={!bugReportMessage.trim()}
                  >
                    Send Report
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Help */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content help-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Help & Support</h3>
              <button className="close-modal" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="help-section">
                <h4>Getting Started</h4>
                <div className="help-item">
                  <h5>What is Veritas?</h5>
                  <p>Veritas is a tool that helps you analyze statements and detect potential inaccuracies or misleading information.</p>
                </div>
                <div className="help-item">
                  <h5>How to use Veritas</h5>
                  <p>Type or paste a statement in the input field and press Enter. Veritas will analyze the statement and provide feedback on its accuracy.</p>
                </div>
              </div>
              
              <div className="help-section">
                <h4>Features</h4>
                <div className="help-item">
                  <h5>Timeline Graph</h5>
                  <p>The Timeline Graph shows the frequency of accurate and inaccurate claims detected over time.</p>
                </div>
                <div className="help-item">
                  <h5>Screen Capture</h5>
                  <p>The Screen Capture feature allows you to record your screen and analyze statements in real-time.</p>
                </div>
                <div className="help-item">
                  <h5>Discussion Spaces</h5>
                  <p>Discussion Spaces let you organize your chats and analyses into separate categories.</p>
                </div>
              </div>
              
              <div className="help-section">
                <h4>Troubleshooting</h4>
                <div className="help-item">
                  <h5>Common Issues</h5>
                  <ul>
                    <li>If the analysis is not working, make sure you have a stable internet connection</li>
                    <li>For screen capture issues, make sure you've granted the necessary permissions</li>
                    <li>If the app feels slow, try refreshing the page or clearing your browser cache</li>
                  </ul>
                </div>
              </div>
              
              <div className="help-section">
                <h4>Contact Support</h4>
                <p>Need more help? Contact us at: <a href="mailto:rahulthennarasu07@gmail.com">rahulthennarasu07@gmail.com</a></p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="primary-button" onClick={() => setShowHelp(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;