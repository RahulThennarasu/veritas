import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import Groq, { toFile } from "groq-sdk";
import "./App.css";
import { Chart, registerables } from "chart.js";
import Sidebar from "./components/Sidebar.tsx";
import MainContent from "./components/MainContent.tsx";
import supabase from "./supabaseClient";
import SignUp from './components/SignUp/SignUp.tsx';
import SignIn from './components/SignIn/SignIn.tsx';
import AuthCallBack from './components/AuthCallBack.tsx';
import InteractiveAnalysis from "./components/InterativeAnalysis.tsx";
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown


Chart.register(...registerables);

// Protected Route Component
const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};

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
  const [showScreenPopup, setShowScreenPopup] = useState<boolean>(false);
  const [isPoppedOut, setIsPoppedOut] = useState<boolean>(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showTimelinePanel, setShowTimelinePanel] = useState<boolean>(false);
  const [falseClaims, setFalseClaims] = useState<{ time: number; count: number }[]>([]);
  const [trueClaims, setTrueClaims] = useState<{ time: number; count: number }[]>([]);
  const [size, setSize] = useState({ width: 450, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const [position, setPosition] = useState({ x: 100, y: 100 });
  const panelRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arecorder = useRef<MediaRecorder | null>(null);
  const astream = useRef<MediaStream | null>(null);
  const sock = useRef<WebSocket | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const poppedWindowRef = useRef<Window | null>(null);

  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY as string,
    dangerouslyAllowBrowser: true,
  });

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

  useEffect(() => {
    if (stream && isRecording) {
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

      if (stream.active) {
        try {
          arecorder.current.start(3000); // Start recording every 3 seconds
        } catch (err) {
          console.error("Failed to start MediaRecorder:", err);
        }
      }

      const interval = setInterval(() => {
        if (
          arecorder.current &&
          arecorder.current.state === "recording" &&
          stream.active &&
          isRecording
        ) {
          try {
            arecorder.current.stop();
            arecorder.current.start(3000);
          } catch (err) {
            console.error("Error restarting MediaRecorder:", err);
          }
        }
      }, 3000);

      return () => {
        clearInterval(interval);
        if (arecorder.current && arecorder.current.state !== "inactive") {
          arecorder.current.stop();
        }
      };
    }
  }, [stream, isRecording]);

  const hasAnalyzed = useRef(false);

  useEffect(() => {
    // In your React component, modify the axios request:

const analyzeTranscript = async () => {
  if (hasAnalyzed.current) return;

  if (transcript.trim()) {
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length > 0) {
      const lastFiveSentences = sentences.slice(-5).join(" ").trim();

      try {
        setLoading(true);
        const response = await axios.post<AnalysisResponse>(
          "http://127.0.0.1:5000/analyze", 
          { statement: transcript },
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        setAnalysis(response.data.analysis);
        setSources(response.data.sources);

        // Count false claims
        const falseClaimCount = (
          response.data.analysis.match(
            /This claim is (inaccurate|misleading|vague|false)/gi
          ) || []
        ).length;

        // Count true claims
        const trueClaimCount = (
          response.data.analysis.match(
            /This claim is (correct|true|right|accurate)/gi
          ) || []
        ).length;

        // Update false claims if any
        if (falseClaimCount > 0) {
          setFalseClaims((prevClaims) => [
            ...prevClaims,
            { time: Date.now(), count: falseClaimCount },
          ]);
        }

        // Update true claims if any
        if (trueClaimCount > 0) {
          setTrueClaims((prevClaims) => [
            ...prevClaims,
            { time: Date.now(), count: trueClaimCount },
          ]);
        }

        hasAnalyzed.current = true;
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

// Also update the handleSubmit function similarly
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await axios.post<AnalysisResponse>(
      "http://127.0.0.1:5000/analyze", 
      { statement },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("Backend Response:", response.data);
    setAnalysis(response.data.analysis);
    setSources(response.data.sources);

    const falseClaimCount = (
      response.data.analysis.match(
        /This claim is (inaccurate|misleading|vague|false)/gi
      ) || []
    ).length;

    if (falseClaimCount > 0) {
      setFalseClaims((prevClaims) => [
        ...prevClaims,
        { time: Date.now(), count: falseClaimCount },
      ]);
    }
    const trueClaimCount = (
      response.data.analysis.match(
        /This claim is (accurate|correct|true)/gi
      ) || []
    ).length;

    if (trueClaimCount > 0) {
      setTrueClaims((prevClaims) => [
        ...prevClaims,
        { time: Date.now(), count: trueClaimCount },
      ]);
    }
  } catch (error) {
    console.error("Full error details:", error.response ? error.response.data : error);
    setAnalysis("An error occurred while analyzing the statement.");
    setSources([]);
  } finally {
    setLoading(false);
  }
};

    const timeout = setTimeout(() => {
      analyzeTranscript();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [transcript]);

  const startCapture = async () => {
    try {
      const cs = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setStream(cs);
      setIsRecording(true);
      setTranscript(""); // Reset transcript
      setAnalysis(""); // Reset analysis
      setSources([]); // Reset sources
      hasAnalyzed.current = false; // Reset analysis flag

      if (videoRef.current) {
        videoRef.current.srcObject = cs;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        videoRef.current.onerror = (error) => {
          console.error("Video error:", error);
        };
      }

      setShowScreenPopup(true);
      sock.current = connectHume();
    } catch (err) {
      console.error("Error capturing screen:", err);
    }
  };

  const stopAndAnalyze = async () => {
    // Stop recording
    setIsRecording(false);
    
    if (arecorder.current && arecorder.current.state !== "inactive") {
      arecorder.current.stop();
    }
    
    // Use transcript as the statement to analyze
    if (transcript.trim()) {
      setStatement(transcript);
      setLoading(true);
      
      try {
        const response = await axios.post<AnalysisResponse>(
          "http://127.0.0.1:5000/analyze", 
          { statement: transcript },
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
        
        console.log("Backend Response:", response.data);
        setAnalysis(response.data.analysis);
        setSources(response.data.sources);

        // Count false claims
        const falseClaimCount = (
          response.data.analysis.match(
            /This claim is (inaccurate|misleading|vague|false)/gi
          ) || []
        ).length;

        if (falseClaimCount > 0) {
          setFalseClaims((prevClaims) => [
            ...prevClaims,
            { time: Date.now(), count: falseClaimCount },
          ]);
        }
        
        // Count true claims
        const trueClaimCount = (
          response.data.analysis.match(
            /This claim is (accurate|correct|true)/gi
          ) || []
        ).length;

        if (trueClaimCount > 0) {
          setTrueClaims((prevClaims) => [
            ...prevClaims,
            { time: Date.now(), count: trueClaimCount },
          ]);
        }
      } catch (error) {
        console.error("Full error details:", error.response ? error.response.data : error);
        setAnalysis("An error occurred while analyzing the transcript.");
        setSources([]);
      } finally {
        setLoading(false);
      }
    } else {
      console.log("No transcript to analyze");
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
      setTranscript((prevText) => prevText + " " + newTranscriptText);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  };

  const humeQuery = async (socket: WebSocket, blob: Blob, models: Object) => {
    const data = await blobToBase64(blob);
    const message = JSON.stringify({ data, models, raw_text: false });
    socket.send(message);
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post<AnalysisResponse>(
        "http://127.0.0.1:5000/analyze", 
        { statement },
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        }
      );
      console.log("Backend Response:", response.data);
      
      // Set analysis regardless of format
      setAnalysis(response.data.analysis);
      setSources(response.data.sources);
  
      // Check if analysis is a string or an object
      let analysisText = "";
      if (typeof response.data.analysis === 'string') {
        analysisText = response.data.analysis;
      } else if (typeof response.data.analysis === 'object') {
        // Convert all sections to a single string for pattern matching
        analysisText = Object.values(response.data.analysis).join(" ");
      } else {
        console.error("Unexpected analysis format:", response.data.analysis);
        analysisText = JSON.stringify(response.data.analysis);
      }
  
      // Now use analysisText for matching patterns
      const falseClaimCount = (
        analysisText.match(
          /This claim is (inaccurate|misleading|vague|false)/gi
        ) || []
      ).length;
  
      if (falseClaimCount > 0) {
        setFalseClaims((prevClaims) => [
          ...prevClaims,
          { time: Date.now(), count: falseClaimCount },
        ]);
      }
      
      const trueClaimCount = (
        analysisText.match(
          /This claim is (accurate|correct|true)/gi
        ) || []
      ).length;
  
      if (trueClaimCount > 0) {
        setTrueClaims((prevClaims) => [
          ...prevClaims,
          { time: Date.now(), count: trueClaimCount },
        ]);
      }
    } catch (error) {
      console.error("Full error details:", error.response ? error.response.data : error);
      setAnalysis("An error occurred while analyzing the statement.");
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateEmotionBars = () => {
      const emotions = getTopEmotions();

      Object.entries(emotions).forEach(([emotion, score]) => {
        const barElements = document.querySelectorAll(
          `[data-emotion="${emotion}"] .bar`
        );

        if (barElements.length > 0) {
          (barElements[0] as HTMLElement).style.setProperty(
            "--emotion-width",
            `${score * 100}%`
          );
        }
      });
    };

    updateEmotionBars();
  }, [hAudioStats, hVideoStats]);

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

  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging && !isPoppedOut) {
      setPopupPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && isPoppedOut) {
        setPosition({
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
  }, [isDragging, dragOffset, isPoppedOut]);

  const popOutWindow = () => {
    if (isPoppedOut) return;

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
            
            closeBtn.addEventListener('click', function() {
              window.close();
            });
            
            window.addEventListener('beforeunload', function() {
              window.opener.postMessage('popupClosed', '*');
            });
          </script>
        </body>
        </html>
      `);

      const popupVideo = newWindow.document.getElementById(
        "popup-video"
      ) as HTMLVideoElement;
      if (popupVideo && stream) {
        popupVideo.srcObject = stream;
      }

      setIsPoppedOut(true);
      setShowScreenPopup(false);

      window.addEventListener("message", (event) => {
        if (event.data === "popupClosed") {
          setIsPoppedOut(false);
          poppedWindowRef.current = null;
        }
      });

      newWindow.addEventListener("beforeunload", () => {
        setIsPoppedOut(false);
        poppedWindowRef.current = null;
      });
    }
  };

  const closePopup = () => {
    setShowScreenPopup(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPoppedOut && panelRef.current && (e.target as HTMLElement).closest(".timeline-panel-header")) {
      setIsDragging(true);
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

    const handlePopOut = () => {
      setIsPoppedOut(!isPoppedOut);
  
      // If we're popping back in, we need to ensure the panel stays open
      if (isPoppedOut) {
        setShowTimelinePanel(true);
      }
    };

    useEffect(() => {
      const handleResize = (e: MouseEvent) => {
        if (!isResizing || !isPoppedOut) return;
        
        const deltaX = e.clientX - dragOffset.x;
        const deltaY = e.clientY - dragOffset.y;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;
        
        // Handle different resize directions
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, size.width + deltaX);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(300, size.width - deltaX);
          newX = position.x + deltaX;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, size.height + deltaY);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(200, size.height - deltaY);
          newY = position.y + deltaY;
        }
        
        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        setDragOffset({ x: e.clientX, y: e.clientY });
      };
      
      const handleMouseUp = () => {
        setIsResizing(false);
      };
      
      if (isResizing) {
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', handleMouseUp);
      }
      
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing, resizeDirection, size, position, dragOffset, isPoppedOut]);

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
      if (isPoppedOut && panelRef.current) {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeDirection(direction);
      }
    };

  const toggleSidePanel = () => {
    setShowSidePanel(!showSidePanel);
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route path="/auth/callback" element={<AuthCallBack />} />


        <Route element={<ProtectedRoute />}>
          <Route 
            path="/" 
            element={
              <div className={`app-container ${
                showTimelinePanel 
                  ? (isPoppedOut ? 'timeline-panel-popped-out' : 'timeline-panel-open') 
                  : ''
              }`}>
                <Sidebar
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
                />
                <MainContent
                  setShowTimelinePanel={setShowTimelinePanel}
                  showSidePanel={showSidePanel}
                  showTimelinePanel={showTimelinePanel}
                  isPoppedOutTimeline={isPoppedOut}
                  statement={statement}
                  setStatement={setStatement}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  startCapture={startCapture}
                  transcript={transcript}
                  analysis={analysis}
                  sources={sources}
                  getTopEmotions={getTopEmotions}
                  showScreenPopup={showScreenPopup}
                  popupPosition={popupPosition}
                  popupRef={popupRef}
                  handleDragStart={handleDragStart}
                  handleDrag={handleDrag}
                  handleDragEnd={handleDragEnd}
                  popOutWindow={popOutWindow}
                  closePopup={closePopup}
                  videoRef={videoRef}
                />
                
              </div>
            } 
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
};

export default App;