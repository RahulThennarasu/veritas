import React, { useState, useRef, useEffect } from "react";
import { Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import Groq, { toFile } from "groq-sdk";
import "./App.css";
import "./components/ChatMessages.css"; // Import chat message styles
import { Chart, registerables } from "chart.js";
import Sidebar from "./components/Sidebar.tsx";
import MainContent from "./components/MainContent.tsx";
import supabase from "./supabaseClient";
import SignUp from './components/SignUp/SignUp.tsx';
import SignIn from './components/SignIn/SignIn.tsx';
import AuthCallBack from './components/AuthCallBack.tsx';
import InteractiveAnalysis from "./components/InterativeAnalysis.tsx";
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import TimelineService from "./services/TimelineService.ts";
import UserPreferencesService from "./services/UserPreferencesService.ts";

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
  analysis: string | Record<string, string>;
  sources: string[];
}

interface EmotionScores {
  [key: string]: number;
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

const AppContent: React.FC = () => {
  // Use location for state passed from login
  const location = useLocation();

  // App state
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
  const [showCredibility, setShowCredibility] = useState<boolean>(false);
  const [falseClaims, setFalseClaims] = useState<{ time: number; count: number }[]>([]);
  const [trueClaims, setTrueClaims] = useState<{ time: number; count: number }[]>([]);
  const [size, setSize] = useState({ width: 450, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [timelineLoading, setTimelineLoading] = useState<boolean>(false);

  const [position, setPosition] = useState({ x: 100, y: 100 });
  const panelRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arecorder = useRef<MediaRecorder | null>(null);
  const astream = useRef<MediaStream | null>(null);
  const sock = useRef<WebSocket | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const poppedWindowRef = useRef<Window | null>(null);
  const messageSubscription = useRef<any>(null);

  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY as string,
    dangerouslyAllowBrowser: true,
  });

  const returnToHomePage = () => {
    setActiveChatId(null);
    setChatMessages([]);
    setAnalysis('');
    setSources([]);
  };

  // Load session state when component mounts
  useEffect(() => {
    const loadSessionState = async () => {
      try {
        // Check if we have state passed from sign-in process
        if (location.state?.restoreSession && location.state?.restoreChatId) {
          setActiveChatId(location.state.restoreChatId);
          if (location.state.restoreChatId) {
            await fetchChatMessages(location.state.restoreChatId);
          }
          return;
        }
        
        // Do not automatically load the last active chat
        // We'll leave activeChatId as null to show the greeting page
        
      } catch (error) {
        console.error('Error loading session state:', error);
      }
    };
    
    loadSessionState();
  }, [location.state]);

  // Save the active chat ID when it changes
  useEffect(() => {
    const saveSessionState = async () => {
      // Only save the active chat ID if it's not null
      // and if it's been explicitly set by a user action, not by auto-loading
      if (activeChatId) {
        await UserPreferencesService.updateLastActiveChat(activeChatId);
      }
    };
    
    saveSessionState();
  }, [activeChatId]);

  // Load timeline data when activeChatId changes
  useEffect(() => {
    const loadTimelineData = async () => {
      if (!activeChatId) return;
      
      setTimelineLoading(true);
      console.log("Loading timeline data for chat:", activeChatId);
      
      try {
        const { success, trueClaims: loadedTrueClaims, falseClaims: loadedFalseClaims } = 
          await TimelineService.loadTimelineData(activeChatId);
        
        if (success) {
          console.log(`Loaded ${loadedTrueClaims.length} true claims and ${loadedFalseClaims.length} false claims`);
          setTrueClaims(loadedTrueClaims);
          setFalseClaims(loadedFalseClaims);
        } else {
          console.error("Failed to load timeline data");
          setTrueClaims([]);
          setFalseClaims([]);
        }
      } catch (error) {
        console.error("Error loading timeline data:", error);
        setTrueClaims([]);
        setFalseClaims([]);
      } finally {
        setTimelineLoading(false);
      }
    };
    
    loadTimelineData();
  }, [activeChatId]);

  // Set up real-time subscription for chat messages
  useEffect(() => {
    const setupMessageSubscription = () => {
      if (!activeChatId) return;
      
      // Clean up any existing subscription
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
      
      // Set up new subscription
      const subscription = supabase
        .channel(`chat:${activeChatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_id=eq.${activeChatId}`
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setChatMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();
        
      messageSubscription.current = subscription;
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    return setupMessageSubscription();
  }, [activeChatId]);

  // Fetch chat messages when activeChatId changes
  const fetchChatMessages = async (chatId: string) => {
    if (!chatId) return;
    
    try {
      console.log("Fetching messages for chat:", chatId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      console.log("Loaded messages:", data?.length || 0);
      setChatMessages(data || []);
    } catch (error) {
      console.error('Error in fetchChatMessages:', error);
    }
  };

  // Load messages when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      fetchChatMessages(activeChatId);
    }
  }, [activeChatId]);

  // Setup for screen recording and transcription
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
            setAnalysis(typeof response.data.analysis === 'string' ? 
              response.data.analysis : 
              JSON.stringify(response.data.analysis));
            setSources(response.data.sources);

            // Process analysis text for claims
            const analysisText = typeof response.data.analysis === 'string' ? 
              response.data.analysis : 
              JSON.stringify(response.data.analysis);

            // Count false claims
            const falseClaimCount = (
              analysisText.match(
                /This claim is (inaccurate|misleading|vague|false)/gi
              ) || []
            ).length;

            // Count true claims
            const trueClaimCount = (
              analysisText.match(
                /This claim is (correct|true|right|accurate)/gi
              ) || []
            ).length;

            // Update false claims if any
            if (falseClaimCount > 0 && activeChatId) {
              const newFalseClaim = { time: Date.now(), count: falseClaimCount };
              
              // Save to Supabase
              await TimelineService.saveTimelineData(activeChatId, 'false_claim', falseClaimCount);
              
              // Update state
              setFalseClaims(prevClaims => [...prevClaims, newFalseClaim]);
            }

            // Update true claims if any
            if (trueClaimCount > 0 && activeChatId) {
              const newTrueClaim = { time: Date.now(), count: trueClaimCount };
              
              // Save to Supabase
              await TimelineService.saveTimelineData(activeChatId, 'true_claim', trueClaimCount);
              
              // Update state
              setTrueClaims(prevClaims => [...prevClaims, newTrueClaim]);
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

    const timeout = setTimeout(() => {
      analyzeTranscript();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [transcript, activeChatId]);

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
        setAnalysis(typeof response.data.analysis === 'string' ? 
          response.data.analysis : 
          JSON.stringify(response.data.analysis));
        setSources(response.data.sources);

        // Process analysis for claims
        const analysisText = typeof response.data.analysis === 'string' ? 
          response.data.analysis : 
          JSON.stringify(response.data.analysis);

        // Count false claims
        const falseClaimCount = (
          analysisText.match(
            /This claim is (inaccurate|misleading|vague|false)/gi
          ) || []
        ).length;

        if (falseClaimCount > 0 && activeChatId) {
          await TimelineService.saveTimelineData(activeChatId, 'false_claim', falseClaimCount);
          setFalseClaims(prevClaims => [
            ...prevClaims,
            { time: Date.now(), count: falseClaimCount },
          ]);
        }
        
        // Count true claims
        const trueClaimCount = (
          analysisText.match(
            /This claim is (accurate|correct|true)/gi
          ) || []
        ).length;

        if (trueClaimCount > 0 && activeChatId) {
          await TimelineService.saveTimelineData(activeChatId, 'true_claim', trueClaimCount);
          setTrueClaims(prevClaims => [
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
    if (!statement.trim()) return;
    
    setLoading(true);
    
    try {
      // Get the current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }
      
      let currentChatId = activeChatId;
      
      // If no active chat, create a new one
      if (!currentChatId) {
        // Create a new chat with a title based on the statement
        const chatTitle = statement.length > 30 
          ? statement.substring(0, 30) + '...' 
          : statement;
          
        const { data, error } = await supabase
          .from('chats')
          .insert([{
            name: chatTitle,
            user_id: userData.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
        
        if (error) {
          console.error('Error creating new chat:', error);
          setLoading(false);
          return;
        }
        
        currentChatId = data[0].id;
        setActiveChatId(currentChatId);
      }
      
      // First, save the user's message
      const { data: userMsgData, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert([{
          content: statement,
          sender: 'user',
          chat_id: currentChatId,
          user_id: userData.user.id,
          timestamp: new Date().toISOString()
        }])
        .select();
      
      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
        setLoading(false);
        return;
      }
      
      // Add user message to state for immediate display
      const userMessageId = userMsgData?.[0]?.id;
      const userMessage = {
        id: userMessageId || 'temp-id-' + Date.now(),
        content: statement,
        sender: 'user' as const,
        timestamp: new Date(),
        chat_id: currentChatId,
        user_id: userData.user.id
      };
      setChatMessages(prev => [...prev, userMessage]);
      
      // Clear input field
      const currentStatement = statement;
      setStatement('');
      
      // Proceed with analysis
      const response = await axios.post<AnalysisResponse>(
        "http://127.0.0.1:5000/analyze", 
        { statement: currentStatement },
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
        }
      );
      
      // Process the analysis results
      const analysisData = response.data.analysis;
      setAnalysis(typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData));
      setSources(response.data.sources);
      
      // Format the system response text
      let responseText = '';
      let analysisForStorage = '';
      
      if (typeof analysisData === 'string') {
        responseText = analysisData;
        analysisForStorage = analysisData;
      } else if (typeof analysisData === 'object') {
        // Convert object to readable format for display
        responseText = Object.entries(analysisData)
          .map(([key, value]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
          .join('\n\n');
        
        // Store the raw object for potential reconstruction
        analysisForStorage = JSON.stringify(analysisData);
      }
      
      // Save system response to database with the analysis data
      const { data: sysMsgData, error: sysMsgError } = await supabase
        .from('chat_messages')
        .insert([{
          content: responseText,
          sender: 'system',
          chat_id: currentChatId,
          user_id: userData.user.id,
          timestamp: new Date().toISOString(),
          analysis: analysisForStorage, // Store the full analysis
          sources: response.data.sources // Store the sources
        }])
        .select();
      
      if (sysMsgError) {
        console.error('Error saving system message:', sysMsgError);
      }
      
      // Add system message to state
      const systemMessage = {
        id: sysMsgData?.[0]?.id || 'temp-id-' + Date.now() + 1,
        content: responseText,
        sender: 'system' as const,
        timestamp: new Date(),
        chat_id: currentChatId,
        user_id: userData.user.id,
        analysis: analysisForStorage,
        sources: response.data.sources
      };
      setChatMessages(prev => [...prev, systemMessage]);
      
      // Process claims for the timeline as in your original code
      const analysisText = typeof analysisData === 'string' 
        ? analysisData 
        : JSON.stringify(analysisData);
        
      const falseClaimCount = (
        analysisText.match(/This claim is (inaccurate|misleading|vague|false)/gi) || []
      ).length;
  
      if (falseClaimCount > 0) {
        // Save to Supabase timeline data
        if (currentChatId) {
          await TimelineService.saveTimelineData(currentChatId, 'false_claim', falseClaimCount);
        }
        
        setFalseClaims(prev => [...prev, { time: Date.now(), count: falseClaimCount }]);
      }
      
      const trueClaimCount = (
        analysisText.match(/This claim is (accurate|correct|true)/gi) || []
      ).length;
  
      if (trueClaimCount > 0) {
        // Save to Supabase timeline data
        if (currentChatId) {
          await TimelineService.saveTimelineData(currentChatId, 'true_claim', trueClaimCount);
        }
        
        setTrueClaims(prev => [...prev, { time: Date.now(), count: trueClaimCount }]);
      }
      
      // Update the chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);
        
    } catch (error: any) {
      console.error("Error in handleSubmit:", error.response ? error.response.data : error);
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
                setShowCredibility={setShowCredibility}
                showCredibility={showCredibility}
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
                setActiveChatId={setActiveChatId}
                timelineLoading={timelineLoading}
                chatMessages={chatMessages}
                analysisSources={sources}
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
                chatMessages={chatMessages}
                activeChatId={activeChatId}
                setActiveChatId={returnToHomePage}
                setShowCredibility={setShowCredibility}
                showCredibility={showCredibility}
              />
              
            </div>
          } 
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
};

export default AppContent;