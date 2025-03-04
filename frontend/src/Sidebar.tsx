import React from "react";
import { Bar } from "react-chartjs-2";


interface SidebarProps {
  showSidePanel: boolean;
  toggleSidePanel: () => void;
  showTimelinePanel: boolean;
  setShowTimelinePanel: (show: boolean) => void;
  isPoppedOut: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  panelRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handlePopOut: () => void;
  handleResizeStart: (e: React.MouseEvent, direction: string) => void;
  falseClaims: { time: number; count: number }[];
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
}) => {
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Happy Late Night";
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    if (hour < 22) return "Good Evening";
    return "Happy Late Night";
  };

  const getUserName = () => {
    return "User";
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

          <div
            ref={panelRef}
            className={`timeline-panel ${showTimelinePanel ? "open" : ""} ${
              isPoppedOut ? "popped-out" : ""
            }`}
            style={
              isPoppedOut
                ? {
                    position: "absolute",
                    top: `${position.y}px`,
                    left: `${position.x}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    zIndex: 1000,
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                    border: "1px solid #333",
                  }
                : {}
            }
            onMouseDown={handleMouseDown}
          >
            <div className="timeline-panel-header">
              <h3>Timeline Graph</h3>
              <div className="timeline-panel-controls">
                <button
                  className="panel-control-button"
                  title="Pop out"
                  onClick={() => handlePopOut()}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                  </svg>
                </button>
                <button
                  className="panel-control-button"
                  title="Close"
                  onClick={() => setShowTimelinePanel(false)}
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

            <div className="timeline-panel-toolbar">
              <div className="timeline-panel-tabs">
                <button className="timeline-tab active">Graph</button>
                <button className="timeline-tab">Log</button>
                <button className="timeline-tab">Settings</button>
              </div>
            </div>

            <div className="timeline-panel-content">
              <div className="timeline-graph-wrapper">
                <h4>False Claims Over Time</h4>
                <div className="timeline-filter">
                  <label className="timeline-filter-label">View Mode</label>
                  <select className="timeline-filter-select">
                    <option value="all">All Claims</option>
                    <option value="false">False Claims Only</option>
                    <option value="questionable">Questionable Claims</option>
                  </select>
                </div>

                <div className="timeline-graph-container">
                  {falseClaims.length > 0 ? (
                    <Bar
                      key={falseClaims.length}
                      data={{
                        labels: falseClaims.map((claim) =>
                          new Date(claim.time).toLocaleTimeString()
                        ),
                        datasets: [
                          {
                            label: "False Claims",
                            data: falseClaims.map((claim) => claim.count),
                            backgroundColor: "#ae9130",
                            borderColor: "#ae9130",
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: "#232323",
                            titleColor: "#ffffff",
                            bodyColor: "#cccccc",
                            borderColor: "#333333",
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false,
                            callbacks: {
                              title: (tooltipItems) => {
                                return `Time: ${tooltipItems[0].label}`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: "Time",
                              color: "#888888",
                            },
                            grid: {
                              color: "#2a2a2a",
                            },
                            ticks: {
                              color: "#888888",
                            },
                          },
                          y: {
                            title: {
                              display: true,
                              text: "False Claims Count",
                              color: "#888888",
                            },
                            beginAtZero: true,
                            grid: {
                              color: "#2a2a2a",
                            },
                            ticks: {
                              color: "#888888",
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="timeline-empty">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#555"
                        strokeWidth="1.5"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <p className="timeline-empty-text">
                        No false claims detected yet.
                      </p>
                      <p className="timeline-empty-subtext">
                        Claims will appear here as they are detected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="timeline-panel-footer">
                <button className="timeline-action-button">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export Data
                </button>
                <button className="timeline-action-button">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Add Reference
                </button>
              </div>
            </div>

            {isPoppedOut && (
              <>
                <div
                  className="resize-handle resize-e"
                  onMouseDown={(e) => handleResizeStart(e, "e")}
                />
                <div
                  className="resize-handle resize-s"
                  onMouseDown={(e) => handleResizeStart(e, "s")}
                />
                <div
                  className="resize-handle resize-se"
                  onMouseDown={(e) => handleResizeStart(e, "se")}
                />
                <div
                  className="resize-handle resize-w"
                  onMouseDown={(e) => handleResizeStart(e, "w")}
                />
                <div
                  className="resize-handle resize-n"
                  onMouseDown={(e) => handleResizeStart(e, "n")}
                />
                <div
                  className="resize-handle resize-sw"
                  onMouseDown={(e) => handleResizeStart(e, "sw")}
                />
                <div
                  className="resize-handle resize-ne"
                  onMouseDown={(e) => handleResizeStart(e, "ne")}
                />
                <div
                  className="resize-handle resize-nw"
                  onMouseDown={(e) => handleResizeStart(e, "nw")}
                />
              </>
            )}
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Credibility</span>
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
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Discussion Spaces</span>
          </div>

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
            <span>Politics</span>
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
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Exit to Home</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;