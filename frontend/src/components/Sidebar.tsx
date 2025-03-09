import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient"; // Adjust the import path as needed
import { useNavigate } from "react-router-dom";
import Timeline from "./Timeline.tsx"; // Import the Timeline component
import ChatList from "./ChatList.tsx"; // Import the ChatList component
import "./ChatList.css"; // Import ChatList styles

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
}) => {
  const [username, setUsername] = useState("User");
  const [isDiscussionExpanded, setIsDiscussionExpanded] = useState<boolean>(true);

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

          <div className="menu-item">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Credibility</span>
          </div>

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

          <div className="menu-item">
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

          <div className="menu-item">
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

          <div className="menu-item">
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
    </>
  );
};

export default Sidebar;