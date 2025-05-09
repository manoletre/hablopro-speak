'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AnimatedNacho from './AnimatedNacho';
import TypingAnimation from './TypingAnimation';
import SessionResults from './SessionResults';
import AuthDialog from './AuthDialog';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePostHog } from 'posthog-js/react';
import { trackSessionCompleted, trackSessionStarted } from '../lib/analytics';

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
  transcript?: string;
  output_index?: number;
  content_index?: number;
  item_id?: string;
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
  usePostHog();

  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [subtitleBuffer, setSubtitleBuffer] = useState<string>('');
  const [active, setActive] = useState(true); // Set to true since we're starting directly in the session
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  // Session timer state
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Update the conversation history initialization to avoid hardcoded messages
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  // Keep references separate to avoid interference
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Add a ref for the subtitle container
  const subtitleContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add a flag to track if wrap-up message has been sent
  const [wrapUpMessageSent, setWrapUpMessageSent] = useState(false);

  // Create placeholder for finishSession to prevent circular dependency
  // This will be properly defined later
  const finishSessionRef = useRef<() => void>(() => {
    console.log('finishSession placeholder called');
  });

  // Clean up function to properly release all audio resources
  const cleanupAudioResources = useCallback(() => {
    console.log('Cleaning up all audio resources');
    
    // Set states to indicate disconnection
    setIsListening(false);
    setIsConnected(false);
    setAiSpeaking(false);
    setIsWrappingUp(false);
    setWrapUpMessageSent(false);
    
    // Clean up WebRTC peer connection
    if (peerConnectionRef.current) {
      try {
        console.log('Closing WebRTC peer connection');
        // Close data channel first
        if (dataChannelRef.current) {
          dataChannelRef.current.close();
          dataChannelRef.current = null;
        }
        
        // Stop all tracks on the peer connection
        peerConnectionRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        
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
  }, []);

  // Start timer when connected, handle when time is up
  useEffect(() => {
    if (isConnected && !isWrappingUp && !showResults) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            console.log('Timer reached zero, wrapping up conversation');
            // Clear interval and trigger wrap-up
            clearInterval(timerIntervalRef.current!);
            setIsWrappingUp(true);
            return 0;
          }
          return newTime;
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
  }, [cleanupAudioResources]);

  // Modified handleDataChannelEvent to properly track conversation messages in sequence
  const handleDataChannelEvent = useCallback((event: MessageEvent) => {
    try {
      console.log('Received event:', event.data);
      const data: RealtimeEvent = JSON.parse(event.data);
      
      // Log session ID to help with debugging
      if (data.type === 'session.created' && data.session?.id) {
        console.log(`Active session ID: ${data.session.id}`);
        // Reset wrap-up state when a new session is created
        setWrapUpMessageSent(false);
        setIsWrappingUp(false);
      }
      
      // Log more details about the first events to help debug conversation start
      if (data.type === 'session.created') {
        console.log('Session created event received');
      }
      
      // Reset buffers when a new AI response is being created
      if (data.type === 'response.created') {
        console.log('Response created event received - clearing buffers');
        setSubtitleBuffer(''); // Clear subtitle buffer for new response
        setAiTranscript(''); // Clear transcript buffer for new response
      }
      
      // Handle AI response audio transcript deltas
      if (data.type === 'response.audio_transcript.delta' && data.delta) {
        // For all delta events, append to subtitle buffer and AI transcript
        setSubtitleBuffer(prev => prev + data.delta);
        setAiTranscript(prev => prev + data.delta);
      }
      
      // Handle AI response audio transcript complete - this contains the full transcript for each response
      if (data.type === 'response.audio_transcript.done' && data.transcript) {
        console.log('Complete AI transcript received:', data.transcript);
        
        // Use the complete transcript instead of the accumulated deltas for accuracy
        const completeTranscript = data.transcript;
        
        if (completeTranscript && completeTranscript.trim()) {
          console.log('Saving complete AI transcript to history:', completeTranscript);
          
          // Add this as a discrete message in the conversation
          setConversationHistory(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'assistant' && msg.text === completeTranscript.trim()
            );
            if (!isDuplicate) {
              return [...prev, {
                role: 'assistant',
                text: completeTranscript.trim(),
                timestamp: Date.now()
              }];
            }
            return prev;
          });
          
          // Update subtitle buffer with the complete transcript
          setSubtitleBuffer(completeTranscript);
          
          // Clear the accumulated transcript for next response
          setAiTranscript('');
        }
      }
      
      // Handle end of AI response (response.done)
      if (data.type === 'response.done') {
        console.log('Response completed, adding new line for next response');
        setSubtitleBuffer(prev => prev + '\n');
        
        // We now rely on response.audio_transcript.done for saving AI messages,
        // so this is mainly for clearing the temporary buffer
        setAiTranscript('');
        
        // Check if we should end the conversation after AI response
        // Only finish if we're wrapping up AND this is a response to our wrap-up message
        if (isWrappingUp && wrapUpMessageSent) {
          console.log('AI finished response during wrap-up, ending session in 2 seconds');
          // Give a little time for the audio to complete playing
          setTimeout(() => finishSessionRef.current(), 2000);
        }
        
        return; // Stop processing this event here
      }
      
      // Handle completed user transcription - clear subtitle buffer for clean slate
      if (data.type === 'conversation.item.input_audio_transcription.completed') {
        // Check both "text" and "transcript" fields since the API might use either
        const userText = data.text || data.transcript || '';
        
        if (userText.trim()) {
          console.log('Final user transcription received:', userText);
          
          // Save user message to conversation history
          console.log('Saving user message to history:', userText);
          setConversationHistory(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'user' && msg.text === userText.trim()
            );
            if (!isDuplicate) {
              return [...prev, {
                role: 'user',
                text: userText.trim(),
                timestamp: Date.now() // Use current time when event is received
              }];
            }
            return prev;
          });
        }
      }
      
      // Also handle this alternative event type for user transcription
      if (data.type === 'conversation.item.transcript' && data.content) {
        console.log('Received conversation.item.transcript event:', data.content);
        // Make sure this is actually user content (should have a way to verify this)
        // For now, we'll assume anything in this format that's not from the assistant is from the user
        const transcriptText = data.content;
        
        if (transcriptText && typeof transcriptText === 'string' && transcriptText.trim()) {
          console.log('Additional user transcript content found:', transcriptText);
          setConversationHistory(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'user' && msg.text === transcriptText.trim()
            );
            if (!isDuplicate) {
              return [...prev, {
                role: 'user',
                text: transcriptText.trim(),
                timestamp: Date.now()
              }];
            }
            return prev;
          });
        }
      }
      
    } catch (error) {
      console.error('Error parsing event:', error);
    }
  }, [setWrapUpMessageSent, setIsWrappingUp, setSubtitleBuffer, setAiTranscript, setConversationHistory, isWrappingUp, wrapUpMessageSent]);

  // Modify the initWebRTC function to add the data channel onopen event handler
  const initWebRTC = useCallback(async () => {
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
    
    // Function to trigger the AI to start the conversation without overriding server-side prompts
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
          // Reset conversation history if this is a new connection
          setConversationHistory([]);
          // Clear any previous AI transcript
          setAiTranscript('');
          setSubtitleBuffer('');
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
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      // Clean up any partial resources that might have been created
      cleanupAudioResources();
      setIsConnected(false);
    }
  }, [cleanupAudioResources, difficultyLevel, language, isConnected, peerConnectionRef, audioRef, dataChannelRef, handleDataChannelEvent, setConversationHistory, setAiTranscript, setSubtitleBuffer, setIsConnected]);

  // Wrap the startConversation function with useCallback (at line ~458)
  const startConversation = useCallback(async () => {
    // This function is triggered by a user gesture, 
    // which allows us to properly initialize audio
    setActive(true);
    
    // Start WebRTC connection
    initWebRTC();
    setIsListening(true);
  }, [initWebRTC]);

  // Function to stop the conversation
  const stopConversation = () => {
    if (isConnected) {
      // If we're already connected, check session duration
      console.log('Stopping active conversation');
      
      // If session was longer than 1 minute, show results
      if (5 * 60 - timeRemaining > 60) {
        console.log('Session longer than 1 minute, showing results');
        finishSessionRef.current();
      } else {
        // Just close without showing results if session was shorter than 1 minute
        console.log('Session shorter than 1 minute, closing without results');
        cleanupAudioResources();
        
        // Ensure timers are cleared
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        if (onClose) onClose();
      }
    } else {
      // Just close without showing results if never connected
      console.log('Closing chat without results (never connected)');
      cleanupAudioResources();
      
      // Ensure timers are cleared
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      if (onClose) onClose();
    }
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
      // Force cleanup of all connections
      cleanupAudioResources();
      
      // Ensure timers are cleared
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Explicitly clear event listeners from dataChannel if it exists
      if (dataChannelRef.current) {
        dataChannelRef.current.onmessage = null;
        dataChannelRef.current.onopen = null;
        dataChannelRef.current.onclose = null;
        dataChannelRef.current.onerror = null;
      }
    };
  }, [cleanupAudioResources]);

  // Only start conversation automatically if the user is authenticated
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (active && !isConnected && !peerConnectionRef.current && user) {
        console.log('Starting conversation from delayed useEffect');
        startConversation();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [active, isConnected, user, startConversation]);

  // Effect to track session start
  useEffect(() => {
    // Track session start when the component mounts
    trackSessionStarted(
      user?.uid || null, 
      { 
        language, 
        difficulty_level: difficultyLevel
      }
    );
  }, [user, language, difficultyLevel]);

  // Function to finish session and show results
  const finishSession = useCallback(async () => {
    console.log('Finishing session - cleaning up and preparing results');
    
    // Reset wrap-up state
    setIsWrappingUp(false);
    setWrapUpMessageSent(false);
    
    // Create a local copy of the conversation history that we'll use for the results
    const finalConversationHistory = [...conversationHistory];
    
    // If we have an ongoing AI transcript that hasn't been saved yet, add it
    if (aiTranscript.trim() && !finalConversationHistory.some(msg => msg.text === aiTranscript.trim())) {
      console.log('Adding final AI transcript to history:', aiTranscript.trim());
      finalConversationHistory.push({
        role: 'assistant',
        text: aiTranscript.trim(),
        timestamp: Date.now()
      });
    }
    
    // Ensure the conversation history is in correct chronological order
    finalConversationHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Debug log the final conversation history
    console.log('Final conversation history:', finalConversationHistory);

    // Save session to Firestore if user is logged in
    if (user) {
      try {
        const sessionsRef = collection(db, `users/${user.uid}/sessions`);
        
        // Get the user's timezone offset in minutes
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();
        
        await addDoc(sessionsRef, {
          startedAt: serverTimestamp(),
          transcript: finalConversationHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n'),
          language,
          difficultyLevel,
          timezoneOffsetMinutes
        });
        
        // Track session completion with analytics utility
        trackSessionCompleted(
          user.uid,
          {
            language,
            difficulty_level: difficultyLevel,
            conversation_length: finalConversationHistory.length,
            duration_minutes: 5 - Math.floor(timeRemaining / 60)
          },
          {
            email: user.email || undefined,
            name: user.displayName || undefined
          }
        );
      } catch (error) {
        console.error('Error saving session:', error);
      }
    } else {
      // Even for anonymous users, track session completion
      trackSessionCompleted(
        null,
        {
          language,
          difficulty_level: difficultyLevel,
          conversation_length: finalConversationHistory.length,
          duration_minutes: 5 - Math.floor(timeRemaining / 60)
        }
      );
    }
    
    // Clean up WebRTC and audio resources
    cleanupAudioResources();
    
    // Ensure timers are cleared to prevent ongoing connections
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Stop active polling/connections
    setActive(false);
    
    // Show results screen with the finalized conversation history
    setTimeout(() => {
      setConversationHistory(finalConversationHistory);
      setShowResults(true);
    }, 500);
  }, [conversationHistory, aiTranscript, cleanupAudioResources, user, language, difficultyLevel, timeRemaining]);

  // Update the reference after definition
  useEffect(() => {
    finishSessionRef.current = finishSession;
  }, [finishSession]);

  // Function to send a wrapping up message through the data channel
  const sendWrappingUpMessage = useCallback(() => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open' && !wrapUpMessageSent) {
      console.log('Sending wrapping up message');
      
      // Mark that we've sent the wrap-up message to prevent duplicates
      setWrapUpMessageSent(true);
      
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
      
      // Set a timer to finish the session regardless of AI response, but make it longer
      // to give the AI time to generate and say the goodbye message
      setTimeout(() => {
        console.log('Finishing session after wrap-up message sent (timeout)');
        finishSessionRef.current();
      }, 4000); // Give AI 10 seconds to respond
    } else if (wrapUpMessageSent) {
      console.log('Wrap-up message already sent, skipping duplicate');
    }
  }, [language, wrapUpMessageSent, dataChannelRef]);

  // Simplify the timing logic for detecting when AI stops speaking
  useEffect(() => {
    // Only run this effect if we're wrapping up and the wrap-up message has been sent
    if (isWrappingUp && wrapUpMessageSent) {
      // If AI has stopped speaking after the wrap-up message was sent,
      // we can finish the session more quickly
      if (!aiSpeaking) {
        // Give a short delay to make sure AI is really done (not just a pause)
        const quickFinishTimer = setTimeout(() => {
          console.log('AI stopped speaking during wrap-up, finishing session');
          finishSessionRef.current();
        }, 2000); // Slightly longer delay to ensure AI is really done
        
        return () => clearTimeout(quickFinishTimer);
      }
    }
  }, [isWrappingUp, aiSpeaking, wrapUpMessageSent]);

  // Simplified useEffect to trigger the wrap-up message when isWrappingUp changes
  useEffect(() => {
    if (isWrappingUp && !wrapUpMessageSent) {
      console.log('Starting wrap-up process');
      sendWrappingUpMessage();
    }
  }, [isWrappingUp, sendWrappingUpMessage, wrapUpMessageSent]);

  // Log whenever conversation history changes
  useEffect(() => {
    console.log('Conversation history updated:', conversationHistory);
  }, [conversationHistory]);

  // Final modified return statement with timer and conditional rendering for results
  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col">
      {/* Show auth dialog if no user is authenticated and loading is complete */}
      {!loading && !user && <AuthDialog />}
      
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
              <h2 className="text-lg font-medium text-[#422006]">{t('voiceChat.title')}</h2>
            </div>
            
            {/* Timer display */}
            <div className={`px-4 py-2 rounded-lg ${isWrappingUp ? 'bg-amber-400' : 'bg-amber-50'} border border-amber-800/20 flex items-center justify-center`}>
              <span className="text-[#422006] font-medium">
                {isWrappingUp ? t('voiceChat.wrappingUp') : formatTimeRemaining()}
              </span>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10">
            {/* Status indicator */}
            <div className="w-full text-center mb-4">
              <p className="text-[#422006] opacity-60">
                {isConnected ? 
                  (aiSpeaking ? t('voiceChat.nachoSpeaking') : (isListening ? t('voiceChat.listening') : t('voiceChat.connected'))) : 
                  t('voiceChat.connecting')}
              </p>
            </div>
            
            {/* Animated Nacho */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatedNacho isSpeaking={aiSpeaking} size="lg" level={difficultyLevel} />
            </div> 
            
            {/* AI response transcript with fixed height and scrolling */}
            {subtitleBuffer && (
              <div className="w-full max-w-xl relative">
                {/* Stop session button - repositioned to the red area */}
                <button
                  onClick={stopConversation}
                  className="absolute -top-10 right-0 px-3 py-1 text-xs rounded-md border border-amber-800/30 bg-amber-50 text-[#422006] hover:bg-amber-100"
                >
                  Stop session
                </button>
                
                <div className="bg-amber-100 rounded-lg p-4 shadow-sm">
                  <p className="text-[#422006] text-sm mb-1 opacity-60">Nacho says:</p>
                  <div 
                    ref={subtitleContainerRef}
                    className="max-h-36 overflow-y-auto"
                    style={{
                      scrollBehavior: 'smooth'
                    }}
                  >
                    <div className="text-[#422006]">
                      <TypingAnimation text={subtitleBuffer} typingSpeed={5} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // Use our SessionResults component with fixed conversation history
        <SessionResults 
          conversationHistory={conversationHistory}
          onClose={onClose}
          language={language}
        />
      )}
    </div>
  );
} 