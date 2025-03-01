import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Groq, { toFile } from "groq-sdk";
import "./App.css";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Define types for the response data
interface AnalysisResponse {
  analysis: string;
  sources: string[];
}

interface EmotionScores {
  [key: string]: number;
}

const App: React.FC = () => {
  const [statement, setStatement] = useState<string>("");
  const [analysis, setAnalysis] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hAudioStats, setHAudioStats] = useState<any>({});
  const [hVideoStats, setHVideoStats] = useState<any>({});
  const [showSidePanel, setShowSidePanel] = useState<boolean>(true);
  // New states for screen capture popup
  const [showScreenPopup, setShowScreenPopup] = useState<boolean>(false);
  const [isPoppedOut, setIsPoppedOut] = useState<boolean>(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Panels
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showTimelineGraph, setShowTimelineGraph] = useState<boolean>(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState<boolean>(false);
  // Claims
  const [falseClaims, setFalseClaims] = useState<{ time: number; count: number }[]>([]);


  // Get time of day for greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Happy Late Night";
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    if (hour < 22) return "Good Evening";
    return "Happy Late Night";
  };

  // Get user name - in a real app, this would come from auth
  const getUserName = () => {
    return "User";
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arecorder = useRef<MediaRecorder | null>(null);
  const astream = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sock = useRef<WebSocket | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const poppedWindowRef = useRef<Window | null>(null);

  // Instantiate Groq with your API Key
  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY as string,
    dangerouslyAllowBrowser: true,
  });

  // Connect to Hume WebSocket API
  const connectHume = () => {
    const socket = new WebSocket(
      `wss://api.hume.ai/v0/stream/models?apikey=${process.env.REACT_APP_HUME_API_KEY}`
    );

    socket.addEventListener("open", () => {
      console.log("Connection to Hume.ai established");
    });

    socket.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      if ("face" in data) {
        setHVideoStats(data.face);
      } else if ("prosody" in data) {
        setHAudioStats(data.prosody);
      }
    });

    socket.addEventListener("close", () => {
      console.log("Connection to Hume.ai closed");
      sock.current = connectHume(); // Reconnect on close
    });

    return socket;
  };

  // Effect to handle audio recording and transcription
  useEffect(() => {
    if (stream) {
      astream.current = new MediaStream();
      for (const track of stream.getAudioTracks()) {
        astream.current.addTrack(track);
      }

      arecorder.current = new MediaRecorder(astream.current);

      arecorder.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          await transcribe(e.data, groq);
          if (sock.current) {
            humeQuery(sock.current, e.data, { prosody: {} }); // Send audio to Hume
          }
        }
      };

      // Start recording only if the stream is still active
      if (stream.active) {
        try {
          arecorder.current.start(3000); // Start recording every 3 seconds
        } catch (err) {
          console.error("Failed to start MediaRecorder:", err);
        }
      }

      // Restart the recorder safely every 3 seconds
      const interval = setInterval(() => {
        if (
          arecorder.current &&
          arecorder.current.state === "recording" &&
          stream.active
        ) {
          try {
            arecorder.current.stop();
            arecorder.current.start(3000);
          } catch (err) {
            console.error("Error restarting MediaRecorder:", err);
          }
        }
      }, 3000);

      // Cleanup function
      return () => {
        clearInterval(interval);
        if (arecorder.current && arecorder.current.state !== "inactive") {
          arecorder.current.stop();
        }
      };
    }
  }, [stream]);

  // Effect to handle real-time analysis of the transcript
  const hasAnalyzed = useRef(false); // Track if analysis has already run

  useEffect(() => {
    // Function to analyze the last 5 sentences after 10 seconds
    const analyzeTranscript = async () => {
      if (hasAnalyzed.current) return; // Stop if analysis has already been done
    
      if (transcript.trim()) {
        const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    
        if (sentences.length > 0) {
          const lastFiveSentences = sentences.slice(-5).join(" ").trim();
    
          try {
            setLoading(true);
            const response = await axios.post<AnalysisResponse>(
              "http://127.0.0.1:5000/analyze",
              { statement: lastFiveSentences }
            );
            setAnalysis(response.data.analysis);
            setSources(response.data.sources);
    
            // Check for keywords in the analysis
            const keywords = ["inaccurate", "not accurate", "misleading"];
            const falseClaimCount = keywords.reduce((count, keyword) => {
              return count + (response.data.analysis.toLowerCase().includes(keyword) ? 1 : 0);
            }, 0);
    
            if (falseClaimCount > 0) {
              setFalseClaims((prevClaims) => {
                const newClaims = [
                  ...prevClaims,
                  { time: Date.now(), count: falseClaimCount },
                ];
                console.log("Transcript False Claims Updated:", newClaims); // Debugging
                return newClaims;
              });
            }
    
            hasAnalyzed.current = true; // Mark analysis as done
          } catch (error) {
            console.error("Error analyzing transcript:", error);
            setAnalysis("An error occurred while analyzing the transcript.");
            setSources([]);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    // Set a timeout to trigger the analysis after 10 seconds
    const timeout = setTimeout(() => {
      analyzeTranscript();
    }, 10000);

    // Cleanup the timeout when component unmounts or when transcript changes
    return () => clearTimeout(timeout);
  }, [transcript]);

  // Function to start screen capture and audio recording
  const startCapture = async () => {
    try {
      const cs = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setStream(cs); // Set the stream in state

      // Ensure the videoRef is assigned the stream
      if (videoRef.current) {
        videoRef.current.srcObject = cs;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play(); // Ensure the video plays
        };
        videoRef.current.onerror = (error) => {
          console.error("Video error:", error); // Log any errors
        };
      }

      // Open the popup
      setShowScreenPopup(true);

      // Connect to Hume WebSocket
      sock.current = connectHume();
    } catch (err) {
      console.error("Error capturing screen:", err);
    }
  };

  useEffect(() => {
    if (showScreenPopup && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
      };
    }
  }, [showScreenPopup, stream]);

  // Function to handle transcription using Groq
  const transcribe = async (blob: Blob, groq: Groq) => {
    try {
      const response = await groq.audio.translations.create({
        file: await toFile(blob, "audio.webm"),
        model: "whisper-large-v3",
        prompt: "",
        response_format: "json",
        temperature: 0,
      });

      const newTranscriptText = response.text;

      // Update transcript state
      setTranscript((prevText) => prevText + " " + newTranscriptText);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  // Function to send data to Hume API
  const humeQuery = async (socket: WebSocket, blob: Blob, models: Object) => {
    const data = await blobToBase64(blob);
    const message = JSON.stringify({ data, models, raw_text: false });
    socket.send(message);
  };

  // Function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.readAsDataURL(blob);
    });
  };

  // Function to get top emotions from Hume response
  const getTopEmotions = (): EmotionScores => {
    const emotions: EmotionScores = {};

    if (hVideoStats.predictions) {
      for (const frame of hVideoStats.predictions) {
        for (const e of frame.emotions) {
          if (
            [
              "Confusion",
              "Determination",
              "Pride",
              "Interest",
              "Concentration",
              "Happiness",
            ].includes(e.name)
          ) {
            emotions[e.name] = (emotions[e.name] || 0) + e.score;
          }
        }
      }
    }

    if (hAudioStats.predictions) {
      for (const e of hAudioStats.predictions[0].emotions) {
        if (
          [
            "Confusion",
            "Determination",
            "Pride",
            "Interest",
            "Concentration",
            "Happiness",
          ].includes(e.name)
        ) {
          emotions[e.name] = (emotions[e.name] || 0) + e.score;
        }
      }
    }

    return emotions;
  };

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post<AnalysisResponse>(
        "http://127.0.0.1:5000/analyze",
        { statement }
      );
      setAnalysis(response.data.analysis);
      setSources(response.data.sources);
  
      // Check for keywords in the analysis
      const keywords = ["inaccurate", "not accurate", "misleading"];
      const falseClaimCount = keywords.reduce((count, keyword) => {
        return count + (response.data.analysis.toLowerCase().includes(keyword) ? 1 : 0);
      }, 0);
  
      if (falseClaimCount > 0) {
        setFalseClaims((prevClaims) => {
          const newClaims = [
            ...prevClaims,
            { time: Date.now(), count: falseClaimCount },
          ];
          console.log("Message False Claims Updated:", newClaims); // Debugging
          return newClaims;
        });
      }
    } catch (error) {
      console.error("Error analyzing statement:", error);
      setAnalysis("An error occurred while analyzing the statement.");
      setSources([]);
    } finally {
      setLoading(false);
    }
  };
  // Effect to update emotion bar widths after render
  useEffect(() => {
    // Get all emotion bars and update their widths
    const updateEmotionBars = () => {
      const emotions = getTopEmotions();

      Object.entries(emotions).forEach(([emotion, score]) => {
        // Find the bar elements by their parent's data attribute
        const barElements = document.querySelectorAll(
          `[data-emotion="${emotion}"] .bar`
        );

        if (barElements.length > 0) {
          // Update the width of the ::before pseudo-element using a CSS variable
          (barElements[0] as HTMLElement).style.setProperty(
            "--emotion-width",
            `${score * 100}%`
          );
        }
      });
    };

    // Run the update function
    updateEmotionBars();
  }, [hAudioStats, hVideoStats]); // Run whenever emotion data changes

  // Drag start handler for popup
  const handleDragStart = (e: React.MouseEvent) => {
    if (popupRef.current && !isPoppedOut) {
      setIsDragging(true);
      const rect = popupRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Drag handler for popup
  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging && !isPoppedOut) {
      setPopupPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  // Drag end handler for popup
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Effect to add mouse move and mouse up events for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPopupPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Function to pop out the screen capture window
  const popOutWindow = () => {
    if (isPoppedOut) return;

    // Create a new window
    const width = 640;
    const height = 480;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const newWindow = window.open(
      "",
      "Screen Capture",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no`
    );

    if (newWindow) {
      poppedWindowRef.current = newWindow;

      // Add basic styles and HTML to the new window
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Screen Capture</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background-color: #1c1c1c; 
              overflow: hidden;
              font-family: 'Inter', sans-serif;
            }
            .popup-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px;
              background-color: #272727;
              border-bottom: 1px solid #333;
            }
            h3 {
              margin: 0;
              color: #fff;
              font-size: 16px;
              font-weight: 500;
            }
            .popup-video {
              width: 100%;
              height: calc(100vh - 40px);
              background-color: #222;
            }
            .popup-controls {
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 10;
            }
            button {
              background: #333;
              border: none;
              color: #fff;
              padding: 5px 10px;
              border-radius: 4px;
              cursor: pointer;
              margin-left: 5px;
            }
            button:hover {
              background: #444;
            }
          </style>
        </head>
        <body>
          <div class="popup-header">
            <h3>Screen Capture</h3>
            <button id="close-btn">Close</button>
          </div>
          <video id="popup-video" class="popup-video" autoplay></video>
          <script>
            const video = document.getElementById('popup-video');
            const closeBtn = document.getElementById('close-btn');
            
            // When close button is clicked
            closeBtn.addEventListener('click', function() {
              window.close();
            });
            
            // When window is closed
            window.addEventListener('beforeunload', function() {
              window.opener.postMessage('popupClosed', '*');
            });
          </script>
        </body>
        </html>
      `);

      // Get the video element in the new window and set its source to our stream
      const popupVideo = newWindow.document.getElementById(
        "popup-video"
      ) as HTMLVideoElement;
      if (popupVideo && stream) {
        popupVideo.srcObject = stream;
      }

      setIsPoppedOut(true);
      setShowScreenPopup(false);

      // Listen for messages from the popup window
      window.addEventListener("message", (event) => {
        if (event.data === "popupClosed") {
          setIsPoppedOut(false);
          poppedWindowRef.current = null;
        }
      });

      // Also listen for the window being closed
      newWindow.addEventListener("beforeunload", () => {
        setIsPoppedOut(false);
        poppedWindowRef.current = null;
      });
    }
  };

  // Function to close the popup
  const closePopup = () => {
    setShowScreenPopup(false);
  };

  // Sample suggestions for quick access cards
  const suggestions = [
    {
      icon: "",
      title: "",
    },
    {
      icon: "",
      title: "",
    },
    {
      icon: "",
      title: "",
    },
  ];

  const toggleSidePanel = () => {
    setShowSidePanel(!showSidePanel);
  };

  return (
    <div className="app-container">
      {/* Left sidebar */}
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
          {/* Timeline Graph Menu Item */}
          <div className="menu-item" onClick={() => setShowTimelinePanel(!showTimelinePanel)}>
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

          {/* Timeline Graph Side Panel */}
          <div className={`timeline-panel ${showTimelinePanel ? "open" : ""}`}>
            <div className="timeline-panel-header">
              <h3>Timeline Graph</h3>
              <button
                className="close-button"
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
            <div className="timeline-panel-content">
              <h4>False Claims Over Time</h4>
              {falseClaims.length > 0 ? (
                <Line
                  key={falseClaims.length} // Force re-render when falseClaims changes
                  data={{
                    labels: falseClaims.map((claim) => new Date(claim.time).toLocaleTimeString()),
                    datasets: [
                      {
                        label: "False Claims",
                        data: falseClaims.map((claim) => claim.count),
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: "False Claims Over Time",
                      },
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: "Time",
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: "False Claims Count",
                        },
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <p>No false claims detected yet.</p>
              )}
            </div>
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

      {/* Main content area */}
      <div className={`main-content ${showSidePanel ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="content-wrapper">
          <div className="greeting-section">
            <div className="wrap">
              <div className="infinity"></div>
            </div>
            <h1 className="greeting-text">
              {getTimeOfDay()}, {getUserName()}
            </h1>
          </div>
          {/* Timeline Graph Section */}
          {showTimelineGraph && (
            <div className={`timeline-graph-section ${showTimelineGraph ? "open" : ""}`}>
              <h3>Timeline Graph</h3>
              <p>This is where the timeline graph will be displayed.</p>
            </div>
          )}

          {/* Suggestion cards */}
          <div className="suggestion-cards">
            {suggestions.map((suggestion, index) => (
              <div className="card" key={index}>
                <div className="card-icon">{suggestion.icon}</div>
                <div className="card-title">{suggestion.title}</div>
              </div>
            ))}
          </div>

          {/* Main input area */}
          <div className="input-section">
            <form onSubmit={handleSubmit}>
              <div className="message-input-container">
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Enter your passage or statements to Veritas..."
                  rows={1}
                  className="message-input"
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    const target = e.target as HTMLTextAreaElement; // Type the event target
                    target.style.height = "auto"; // Reset height
                    target.style.height = `${target.scrollHeight}px`; // Adjust height based on content
                  }}
                />
                {/* Added screen capture button */}
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

          {/* Results area - conditionally rendered */}
          {transcript && (
            <div className="result-box">
              <h2>Transcript</h2>
              <p>{transcript}</p>
            </div>
          )}

          {/* Screen capture popup - hidden by default */}
          {showScreenPopup && !isPoppedOut && (
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
                ref={videoRef} // Ensure this ref is correctly assigned
                autoPlay
                className="popup-video"
              ></video>
            </div>
          )}

          {analysis && (
            <div className="result-box">
              <h2>Analysis</h2>
              <p>{analysis}</p>

              {sources.length > 0 && (
                <>
                  <h2>Relevant Sources</h2>
                  <ul>
                    {sources.map((url, index) => (
                      <li key={index}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
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

      {/* Screen Capture Popup */}
    </div>
  );
};

export default App;
