import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";
import jsPDF from "jspdf";
import TimelineService from '../services/TimelineService.ts';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TimelineProps {
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
  isLoading?: boolean; // Add this prop
}

type TabType = "graph" | "log" | "settings";
type ViewMode = "all" | "false" | "true";

const Timeline: React.FC<TimelineProps> = ({
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
  isLoading = false,
}) => {
  const [references, setReferences] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("graph");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [logEntries, setLogEntries] = useState<{ timestamp: Date; message: string }[]>([
    { timestamp: new Date(), message: "Timeline analysis started" },
    { timestamp: new Date(Date.now() - 300000), message: "Detected first claim pattern" },
  ]);

  // Settings state
  const [settings, setSettings] = useState({
    refreshInterval: 30,
    showNotifications: true,
    darkMode: true,
    dataSource: "live",
    claimThreshold: 0.75,
  });

  useEffect(() => {
    console.log("Timeline component received props:", {
      activeChatId,
      falseClaims: falseClaims.length,
      trueClaims: trueClaims.length,
      isLoading
    });
  }, [activeChatId, falseClaims, trueClaims, isLoading]);

  useEffect(() => {
    if (activeChatId) {
      addLogEntry(`Showing timeline data for chat: ${activeChatId.substring(0, 8)}...`);
    } else {
      addLogEntry('No active chat selected');
    }
  }, [activeChatId]);

  // Add a method to clear timeline for the current chat
  const clearTimelineData = async () => {
    if (!activeChatId) {
      addLogEntry('No active chat to clear timeline data from');
      return;
    }
    
    try {
      const result = await TimelineService.deleteTimelineData(activeChatId);
      if (result.success) {
        addLogEntry(`Timeline data cleared for chat: ${activeChatId.substring(0, 8)}...`);
        // You should also reset the state in the parent component
        // This could be done by raising an event
        setLogEntries([]);
      } else {
        addLogEntry('Failed to clear timeline data');
      }
    } catch (error) {
      console.error('Error clearing timeline data:', error);
      addLogEntry('Error clearing timeline data');
    }
  };

  const handleAddReference = () => {
    const reference = prompt("Enter the reference details:");
    if (reference) {
      setReferences((prevReferences) => [...prevReferences, reference]);
      addLogEntry(`Added reference: ${reference}`);
    }
  };

  const addLogEntry = (message: string) => {
    setLogEntries((prev) => [...prev, { timestamp: new Date(), message }]);
  };

  const exportPDF = () => {
    const chartCanvas = document.getElementById("timelineChart") as HTMLCanvasElement;
    const imageUrl = chartCanvas?.toDataURL("image/png");

    if (imageUrl) {
      const doc = new jsPDF();
      doc.addImage(imageUrl, "PNG", 10, 10, 180, 160);
      doc.save("timelineGraph.pdf");
      addLogEntry("Exported timeline as PDF");
    }
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSettings((prev) => ({ ...prev, [setting]: value }));
    addLogEntry(`Updated setting: ${setting} to ${value}`);
  };

  // Generate chart data based on viewMode
  const getChartData = () => {
    console.log("Generating chart data with:", {
      falseClaims: falseClaims.length,
      trueClaims: trueClaims.length
    });
    const labels = [...new Set([
      ...falseClaims.map(claim => new Date(claim.time).toLocaleTimeString()),
      ...trueClaims.map(claim => new Date(claim.time).toLocaleTimeString())
    ])].sort((a, b) => {
      const timeA = new Date(`1970/01/01 ${a}`).getTime();
      const timeB = new Date(`1970/01/01 ${b}`).getTime();
      return timeA - timeB;
    });

    const datasets: { label: string; data: number[]; backgroundColor: string; borderColor: string; borderWidth: number; }[] = [];

    if (viewMode === "all" || viewMode === "false") {
      datasets.push({
        label: "False Claims",
        data: labels.map(label => {
          const match = falseClaims.find(
            claim => new Date(claim.time).toLocaleTimeString() === label
          );
          return match ? match.count : 0;
        }),
        backgroundColor: "#0d47a1",
        borderColor: "#0d47a1",
        borderWidth: 1,
      });
    }

    if (viewMode === "all" || viewMode === "true") {
      datasets.push({
        label: "True Claims",
        data: labels.map(label => {
          const match = trueClaims.find(
            claim => new Date(claim.time).toLocaleTimeString() === label
          );
          return match ? match.count : 0;
        }),
        backgroundColor: "#2196f3",
        borderColor: "#2196f3",
        borderWidth: 1,
      });
    }

    return {
      labels,
      datasets,
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        backgroundColor: "#232323",
        titleColor: "#ffffff",
        bodyColor: "#cccccc",
        borderColor: "#333333",
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          title: (tooltipItems: any) => {
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
          text: "Claims Count",
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
  };

  // Add a log entry when true claims are loaded
  useEffect(() => {
    if (trueClaims.length > 0) {
      addLogEntry(`Loaded ${trueClaims.length} true claims for visualization`);
    }
  }, [trueClaims]);

  useEffect(() => {
    if (falseClaims.length > 0) {
      addLogEntry(`Loaded ${falseClaims.length} false claims for visualization`);
    }
  }, [falseClaims]);

  return (
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
          <button
            className={`timeline-tab ${activeTab === "graph" ? "active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            Graph
          </button>
          <button
            className={`timeline-tab ${activeTab === "log" ? "active" : ""}`}
            onClick={() => setActiveTab("log")}
          >
            Log
          </button>
          <button
            className={`timeline-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="timeline-panel-content">
        {activeTab === "graph" && (
          <div className="timeline-graph-wrapper">
            <h4>Claims Over Time</h4>
            <div className="timeline-filter">
              <label className="timeline-filter-label">View Mode</label>
              <select 
                className="timeline-filter-select"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
              >
                <option value="all">All Claims</option>
                <option value="false">False Claims Only</option>
                <option value="true">True Claims Only</option>
              </select>
            </div>

            <div className="timeline-references">
              <h4>References</h4>
              {references.length > 0 ? (
                <ul>
                  {references.map((reference, index) => (
                    <li key={index}>{reference}</li>
                  ))}
                </ul>
              ) : (
                <p>No references added yet.</p>
              )}
            </div>

            <div className="timeline-graph-container">
              {isLoading ? (
                // Show loading indicator
                <div className="timeline-loading">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="##2196f3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="loading-spinner"
                  >
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  <p>Loading timeline data...</p>
                </div>
              ) : falseClaims.length === 0 && trueClaims.length === 0 ? (
                // Show empty state
                <div className="timeline-empty">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#555"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  <p className="timeline-empty-text">No claims detected yet.</p>
                  <p className="timeline-empty-subtext">
                    Claims will appear here as they are detected
                  </p>
                </div>
              ) : (
                // Show the chart if we have data
                <Bar
                  id="timelineChart"
                  data={getChartData()}
                  options={chartOptions}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <div className="timeline-log-wrapper">
            <h4>Activity Log</h4>
            <div className="timeline-log-actions">
              <button className="timeline-log-action-button">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Log
              </button>
              <button
                className="timeline-log-action-button"
                onClick={() => setLogEntries([])}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Clear Log
              </button>
            </div>
            <div className="timeline-log-container">
              {logEntries.length > 0 ? (
                <ul className="timeline-log-list">
                  {logEntries.map((entry, index) => (
                    <li key={index} className="timeline-log-entry">
                      <span className="timeline-log-timestamp">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="timeline-log-message">{entry.message}</span>
                    </li>
                  ))}
                </ul>
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <p className="timeline-empty-text">Activity log is empty</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="timeline-settings-wrapper">
            <h4>Timeline Settings</h4>
            <div className="timeline-settings-container">
              <div className="timeline-setting-group">
                <h5>Display Settings</h5>
                <div className="timeline-setting-item">
                  <label htmlFor="darkMode">Dark Mode</label>
                  <input
                    type="checkbox"
                    id="darkMode"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange("darkMode", e.target.checked)}
                  />
                </div>
                <div className="timeline-setting-item">
                  <label htmlFor="refreshInterval">Refresh Interval (seconds)</label>
                  <input
                    type="number"
                    id="refreshInterval"
                    min="5"
                    max="300"
                    value={settings.refreshInterval}
                    onChange={(e) =>
                      handleSettingChange("refreshInterval", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="timeline-setting-item">
                  <label htmlFor="showNotifications">Show Notifications</label>
                  <input
                    type="checkbox"
                    id="showNotifications"
                    checked={settings.showNotifications}
                    onChange={(e) =>
                      handleSettingChange("showNotifications", e.target.checked)
                    }
                  />
                </div>
                <button 
                  className="timeline-action-button" 
                  onClick={clearTimelineData}
                  title="Clear Timeline Data"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Clear Timeline
                </button>
              </div>

              <div className="timeline-setting-group">
                <h5>Data Settings</h5>
                <div className="timeline-setting-item">
                  <label htmlFor="dataSource">Data Source</label>
                  <select
                    id="dataSource"
                    value={settings.dataSource}
                    onChange={(e) => handleSettingChange("dataSource", e.target.value)}
                  >
                    <option value="live">Live Data</option>
                    <option value="recorded">Recorded Session</option>
                    <option value="historical">Historical Data</option>
                  </select>
                </div>
                <div className="timeline-setting-item">
                  <label htmlFor="claimThreshold">Claim Threshold</label>
                  <input
                    type="range"
                    id="claimThreshold"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.claimThreshold}
                    onChange={(e) =>
                      handleSettingChange("claimThreshold", parseFloat(e.target.value))
                    }
                  />
                  <span>{settings.claimThreshold}</span>
                </div>
              </div>

              <div className="timeline-settings-actions">
                <button
                  className="timeline-settings-button"
                  onClick={() => {
                    setSettings({
                      refreshInterval: 30,
                      showNotifications: true,
                      darkMode: true,
                      dataSource: "live",
                      claimThreshold: 0.75,
                    });
                    addLogEntry("Reset all settings to defaults");
                  }}
                >
                  Reset to Defaults
                </button>
                <button
                  className="timeline-settings-button"
                  onClick={() => {
                    addLogEntry("Applied settings changes");
                    alert("Settings applied successfully");
                  }}
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="timeline-panel-footer">
          {activeTab === "graph" && (
            <>
              <button className="timeline-action-button" onClick={exportPDF}>
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

              <button
                className="timeline-action-button"
                onClick={handleAddReference}
              >
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
            </>
          )}

          {activeTab === "log" && (
            <>
              <button
                className="timeline-action-button"
                onClick={() => {
                  addLogEntry("Manual log entry added by user");
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Entry
              </button>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <span className="timeline-settings-status">
                Last saved: {new Date().toLocaleTimeString()}
              </span>
            </>
          )}
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
  );
};

export default Timeline;