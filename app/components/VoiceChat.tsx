'use client';

import { useState, useRef, useEffect } from 'react';
import AnimatedNacho from './AnimatedNacho';
import TypingAnimation from './TypingAnimation';
import SessionResults from './SessionResults';

// Enhanced interface to handle different event types
interface RealtimeEvent {
  type: string;
  text?: string;
  content?: string;
  delta?: string;
  role?: string;
  is_final?: boolean;
  response_id?: string;
  event_id?: string;
  session?: { id: string };
  // Other fields depending on event type
}

// Define a structure for conversation messages
interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface VoiceChatProps {
  onClose?: () => void;
  difficultyLevel: number;
  language: string;
}

export default function VoiceChat({ onClose, difficultyLevel, language }: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [subtitleBuffer, setSubtitleBuffer] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [active, setActive] = useState(true); // Set to true since we're starting directly in the session
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  // Session timer state
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  // Keep references separate to avoid interference
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Add a ref for the subtitle container
  const subtitleContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start the session timer when connected
  useEffect(() => {
    if (isConnected && !isWrappingUp && !showResults) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - start wrapping up
            setIsWrappingUp(true);
            clearInterval(timerIntervalRef.current!);
            
            // Trigger wrapping up message from AI
            sendWrappingUpMessage();
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isConnected, isWrappingUp, showResults]);

  // Format time remaining in MM:SS format
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Check for system dark mode preference
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize audio elements once on component mount
  useEffect(() => {
    // Create separate audio elements with different handling
    if (typeof Audio !== 'undefined') {
      // Create audio element for OpenAI's response audio
      audioRef.current = new Audio();
      audioRef.current.autoplay = true;
      audioRef.current.muted = false;
      
      // Add event listeners to detect AI speaking
      if (audioRef.current) {
        // When audio starts playing, set aiSpeaking to true
        audioRef.current.onplaying = () => setAiSpeaking(true);
        // When audio pauses or ends, set aiSpeaking to false
        audioRef.current.onpause = () => setAiSpeaking(false);
        audioRef.current.onended = () => setAiSpeaking(false);
      }
    }
    
    // Clean up all audio resources on unmount
    return () => {
      cleanupAudioResources();
    };
  }, []);

  // Clean up function to properly release all audio resources
  const cleanupAudioResources = () => {
    console.log('Cleaning up all audio resources');
    
    // Set states to indicate disconnection
    setIsListening(false);
    setIsConnected(false);
    setAiSpeaking(false);
    
    // Clean up WebRTC peer connection
    if (peerConnectionRef.current) {
      try {
        console.log('Closing WebRTC peer connection');
        // Close data channel first
        if (dataChannelRef.current) {
          dataChannelRef.current.close();
          dataChannelRef.current = null;
        }
        
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      } catch (error) {
        console.error('Error closing peer connection:', error);
      }
    }
    
    // Clean up audio element
    if (audioRef.current) {
      try {
        console.log('Cleaning up audio element');
        audioRef.current.pause();
        
        if (audioRef.current.srcObject instanceof MediaStream) {
          const mediaStream = audioRef.current.srcObject as MediaStream;
          mediaStream.getTracks().forEach(track => {
            console.log('Stopping audio track');
            track.stop();
          });
        }
        
        audioRef.current.srcObject = null;
        audioRef.current = null;
      } catch (error) {
        console.error('Error cleaning up audio element:', error);
      }
    }
  };

  // Modified handleDataChannelEvent to save conversation history using specific events
  const handleDataChannelEvent = (event: MessageEvent) => {
    try {
      console.log('Received event:', event.data);
      const data: RealtimeEvent = JSON.parse(event.data);
      
      // Log session ID to help with debugging
      if (data.type === 'session.created' && data.session?.id) {
        console.log(`Active session ID: ${data.session.id}`);
      }
      
      // Handle AI response audio transcript deltas
      if (data.type === 'response.audio_transcript.delta' && data.delta) {
        // For delta events, append to subtitle buffer and temporary AI transcript
        setSubtitleBuffer(prev => prev + data.delta);
        setAiTranscript(prev => prev + data.delta);
      }
      
      // Handle user transcription deltas - important for capturing real-time user speech
      if (data.type === 'conversation.item.input_audio_transcription.delta' && data.delta) {
        console.log('User transcription delta received:', data.delta);
        // Update the user transcript as it comes in
        setUserTranscript(prev => prev + data.delta);
      }
      
      // Handle end of AI response (response.done)
      if (data.type === 'response.done') {
        console.log('Response completed, adding new line for next response');
        setSubtitleBuffer(prev => prev + '\n');
        
        // Save completed assistant message to conversation history if it's not empty
        if (aiTranscript.trim()) {
          console.log('Saving AI message to history:', aiTranscript);
          setConversationHistory(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'assistant' && msg.text === aiTranscript.trim()
            );
            if (!isDuplicate) {
              return [...prev, {
                role: 'assistant',
                text: aiTranscript.trim(),
                timestamp: Date.now()
              }];
            }
            return prev;
          });
          
          // Reset temporary AI transcript buffer
          setAiTranscript('');
        }
        
        // Check if we should end the conversation after AI response
        if (isWrappingUp) {
          console.log('AI finished response during wrap-up, ending session very soon');
          setTimeout(() => finishSession(), 1000);
        }
        
        return; // Stop processing this event here
      }
      
      // Handle completed user transcription
      if (data.type === 'conversation.item.input_audio_transcription.completed' && data.text) {
        setUserTranscript(data.text); // Update live user transcript view with final version
        console.log('Final user transcription received:', data.text);
        
        // Save user message to conversation history
        if (data.text.trim()) {
          console.log('Saving user message to history:', data.text);
          setConversationHistory(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'user' && msg.text === data.text?.trim()
            );
            if (!isDuplicate) {
              return [...prev, {
                role: 'user',
                text: data.text || '',
                timestamp: Date.now() // Use current time when event is received
              }];
            }
            return prev;
          });
        }
        
        // Reset the userTranscript for the next utterance after saving it to history
        setTimeout(() => {
          setUserTranscript('');
        }, 500);
      }
      
    } catch (error) {
      console.error('Error parsing event:', error);
    }
  };

  // Add this function to trigger the AI to start the conversation without overriding server-side prompts
  const triggerAIToStartConversation = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      console.log('Triggering AI to start the conversation');
      
      // Simply trigger the AI to respond based on the session instructions already provided
      // This avoids sending new instructions that would conflict with the server-side templates
      const responseCreate = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio']
          // No additional instructions - use the ones from session creation
        }
      };
      
      dataChannelRef.current.send(JSON.stringify(responseCreate));
      console.log('Sent response.create to trigger AI initial response');
    } else {
      console.error('Data channel not ready to trigger AI response');
    }
  };

  // Modify the initWebRTC function to add the data channel onopen event handler
  const initWebRTC = async () => {
    // Prevent multiple connections with extensive logging
    if (peerConnectionRef.current) {
      console.log('WebRTC connection already exists (peerConnectionRef), skipping initialization');
      return;
    }
    
    if (isConnected) {
      console.log('Already connected according to state, skipping initialization');
      return;
    }
    
    console.log('Initializing new WebRTC connection');
    
    try {
      // Get ephemeral token
      console.log('Fetching session token');
      const tokenResponse = await fetch('/api/session', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          difficultyLevel,
          language
        })
      });
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;
      
      // Create peer connection
      console.log('Creating new RTCPeerConnection');
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Set up audio handling for WebRTC
      pc.ontrack = (e) => {
        console.log('Track received from server');
        if (audioRef.current && e.streams && e.streams[0]) {
          console.log('Setting audio source and playing');
          audioRef.current.srcObject = e.streams[0];
          
          // Play audio immediately
          audioRef.current.play()
            .catch(err => console.error('Error playing WebRTC audio:', err));
        }
      };
      
      // Get microphone access
      console.log('Requesting microphone access');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(mediaStream.getTracks()[0]);
      
      // Set up data channel
      console.log('Creating data channel');
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      dc.onmessage = handleDataChannelEvent;
      
      // Add event listener for data channel open event to trigger AI response
      dc.onopen = () => {
        console.log('Data channel is now open');
        // Wait a short moment for the connection to stabilize before triggering AI
        setTimeout(() => {
          console.log('Will now trigger AI to start conversation');
          triggerAIToStartConversation();
        }, 1000);
      };
      
      // Create and set offer
      console.log('Creating and setting local description');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-mini-realtime-preview';
      
      console.log('Sending offer to OpenAI');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });
      
      // Set answer
      console.log('Setting remote description');
      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      
      console.log('WebRTC connection established successfully');
      setIsConnected(true);
      setAudioInitialized(true);
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      // Clean up any partial resources that might have been created
      cleanupAudioResources();
      setIsConnected(false);
    }
  };

  const startConversation = async () => {
    // This function is triggered by a user gesture, 
    // which allows us to properly initialize audio
    setAudioInitialized(true);
    setActive(true);
    
    // Start WebRTC connection
    initWebRTC();
    setIsListening(true);
  };

  const stopConversation = () => {
    console.log('Stopping conversation and cleaning up');
    
    // If we're in the middle of a session, show results instead of closing
    if (isConnected && !showResults) {
      finishSession();
      return;
    }
    
    // Reset all state
    setIsListening(false);
    setActive(false);
    
    // Clear all transcript buffers
    setUserTranscript('');
    setAiTranscript('');
    setSubtitleBuffer('');
    setAiSpeaking(false);
    
    // Clean up all audio resources
    cleanupAudioResources();
    
    // Reset everything else
    setIsConnected(false);
    
    // Call onClose if provided
    if (onClose) {
      onClose();
    }
  };

  // Calculate background color based on dark mode
  const getBgColor = () => {
    return isDarkMode ? '#3a0178' : '#3e02a6';
  };

  // Always scroll to bottom when subtitles change
  useEffect(() => {
    if (subtitleContainerRef.current) {
      // Force scroll to bottom with a small delay to ensure content is rendered
      setTimeout(() => {
        if (subtitleContainerRef.current) {
          subtitleContainerRef.current.scrollTop = subtitleContainerRef.current.scrollHeight;
        }
      }, 10);
    }
  }, [subtitleBuffer]);

  // Initialize component and set up debug logging
  useEffect(() => {
    console.log('==== VoiceChat component mounted ====');
    
    // Clean up all resources when component unmounts
    return () => {
      console.log('==== VoiceChat component unmounting ====');
      cleanupAudioResources();
    };
  }, []);

  // Start conversation once when component is ready
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (active && !isConnected && !peerConnectionRef.current) {
        console.log('Starting conversation from delayed useEffect');
        startConversation();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Function to finish the session and show results
  const finishSession = () => {
    console.log('Finishing session, conversation history:', conversationHistory);
    
    // If no conversation recorded yet but we have text in the buffers, save them
    if (conversationHistory.length === 0) {
      const newHistory: ConversationMessage[] = [];
      
      if (userTranscript.trim()) {
        newHistory.push({
          role: 'user',
          text: userTranscript.trim(),
          timestamp: Date.now() - 1000 // Slightly earlier timestamp
        });
      }
      
      if (subtitleBuffer.trim()) {
        newHistory.push({
          role: 'assistant',
          text: subtitleBuffer.trim(),
          timestamp: Date.now()
        });
      }
      
      if (newHistory.length > 0) {
        setConversationHistory(newHistory);
      }
    }
    
    // Clean up WebRTC and audio resources
    cleanupAudioResources();
    
    // Wait a moment to ensure state is updated
    setTimeout(() => {
      // Show results screen
      setShowResults(true);
    }, 500);
  };

  // Detect when AI stops speaking during wrap-up to finish the session
  useEffect(() => {
    if (isWrappingUp) {
      // If we're wrapping up, set a timer to force finish the session after a delay
      // This is a fallback in case other detection mechanisms fail
      const forceFinishTimer = setTimeout(() => {
        console.log('Force finishing session after wrap-up delay');
        finishSession();
      }, 10000); // Force finish after 10 seconds max
      
      // If AI is not speaking during wrap-up, finish sooner
      if (!aiSpeaking) {
        const quickFinishTimer = setTimeout(() => {
          console.log('AI stopped speaking during wrap-up, finishing session');
          finishSession();
        }, 1500); // Shorter delay when AI stops speaking
        
        return () => {
          clearTimeout(quickFinishTimer);
          clearTimeout(forceFinishTimer);
        };
      }
      
      return () => clearTimeout(forceFinishTimer);
    }
  }, [isWrappingUp, aiSpeaking]);

  // Function to send a wrapping up message through the data channel
  const sendWrappingUpMessage = () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      console.log('Sending wrapping up message');
      
      // Create a message to notify the user that time is up
      const wrappingUpMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Time is up. Please wrap up our conversation in ${language} and say goodbye. Keep it brief.`
            }
          ]
        }
      };
      
      // Send the message
      dataChannelRef.current.send(JSON.stringify(wrappingUpMessage));
      
      // Follow with a response create to get the AI to speak
      const responseCreate = {
        type: 'response.create',
        response: {
          modalities: ['text', 'audio'],
          instructions: `The session is now over. Very briefly say goodbye in ${language} only.`
        }
      };
      
      dataChannelRef.current.send(JSON.stringify(responseCreate));
      
      // Set a timer to finish the session regardless of AI response
      setTimeout(() => {
        console.log('Finishing session after wrap-up message sent');
        finishSession();
      }, 8000); // Give AI 8 seconds to respond
    }
  };

  // Log whenever conversation history changes
  useEffect(() => {
    console.log('Conversation history updated:', conversationHistory);
  }, [conversationHistory]);

  // Final modified return statement with timer and conditional rendering for results
  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col">
      {!showResults ? (
        // Active session UI
        <>
          {/* Header with back button */}
          <div className="w-full p-4 flex items-center justify-between">
            <button
              onClick={stopConversation}
              className="w-10 h-10 rounded-lg border border-amber-800/20 flex items-center justify-center bg-amber-50"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="ml-4 flex-1">
              <h2 className="text-lg font-medium text-[#422006]">Speaking Practice</h2>
            </div>
            
            {/* Timer display */}
            <div className={`px-4 py-2 rounded-lg ${isWrappingUp ? 'bg-amber-400' : 'bg-amber-50'} border border-amber-800/20 flex items-center justify-center`}>
              <span className="text-[#422006] font-medium">
                {isWrappingUp ? 'Wrapping up...' : formatTimeRemaining()}
              </span>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10">
            {/* Status indicator */}
            <div className="w-full text-center mb-4">
              <p className="text-[#422006] opacity-60">
                {isConnected ? 
                  (aiSpeaking ? 'Nacho is speaking...' : (isListening ? 'Listening...' : 'Connected and ready')) : 
                  'Connecting...'}
              </p>
            </div>
            
            {/* Animated Nacho */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatedNacho isSpeaking={aiSpeaking} size="lg" level={difficultyLevel} />
            </div>
            
            {/* User's transcript */}
            {userTranscript && (
              <div className="w-full max-w-xl bg-amber-50 rounded-lg p-4 mb-4 shadow-sm">
                <p className="text-[#422006] text-sm mb-1 opacity-60">You said:</p>
                <p className="text-[#422006]">{userTranscript}</p>
              </div>
            )}
            
            {/* AI response transcript with fixed height and scrolling */}
            {subtitleBuffer && (
              <div 
                className="w-full max-w-xl bg-amber-100 rounded-lg p-4 shadow-sm"
              >
                <p className="text-[#422006] text-sm mb-1 opacity-60">Nacho says:</p>
                <div 
                  ref={subtitleContainerRef}
                  className="max-h-36 overflow-y-auto"
                  style={{
                    scrollBehavior: 'smooth',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 1) 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 1) 100%)'
                  }}
                >
                  <div className="text-[#422006]">
                    <TypingAnimation text={subtitleBuffer} typingSpeed={5} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // Use our new session results component
        <SessionResults 
          conversationHistory={conversationHistory}
          onClose={onClose}
          language={language}
        />
      )}
    </div>
  );
} 