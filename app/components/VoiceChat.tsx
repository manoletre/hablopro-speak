'use client';

import { useState, useRef, useEffect } from 'react';
import AnimatedNacho from './AnimatedNacho';
import TypingAnimation from './TypingAnimation';

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

export default function VoiceChat({ onClose }: { onClose?: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [subtitleBuffer, setSubtitleBuffer] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [active, setActive] = useState(true); // Set to true since we're starting directly in the session
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  // Keep references separate to avoid interference
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Add a ref for the subtitle container
  const subtitleContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Handle AI response with proper formatting and handling response.done events
  const handleDataChannelEvent = (event: MessageEvent) => {
    try {
      console.log('Received event:', event.data);
      const data: RealtimeEvent = JSON.parse(event.data);
      
      // Log session ID to help with debugging
      if (data.type === 'session.created' && data.session?.id) {
        console.log(`Active session ID: ${data.session.id}`);
      }
      
      // Handle response.done event - add a new line for the next response
      if (data.type === 'response.done') {
        console.log('Response completed, adding new line for next response');
        setSubtitleBuffer(prev => prev + '\n');
        return;
      }
      
      // Handle user transcription
      if (data.type === 'transcription' && data.text && data.role === 'user') {
        setUserTranscript(data.text);
        if (data.is_final) {
          console.log('Final user transcription:', data.text);
        }
      }
      
      // Handle AI response - different event types based on API behavior
      if (
        // Handle OpenAI Realtime audio transcript delta events
        (data.type === 'response.audio_transcript.delta' && data.delta) ||
        // Other potential event types
        (data.type === 'assistant_message' && data.content) || 
        (data.type === 'speech' && data.text) ||
        (data.type === 'transcription' && data.text && data.role === 'assistant') ||
        (data.type === 'message_delta' && data.content) ||
        (data.type === 'speech_delta' && data.text)
      ) {
        // Get the text from the appropriate field based on event type
        const text = data.delta || data.content || data.text || '';
        if (text) {
          if (data.type.includes('delta')) {
            // For delta events, append to subtitle buffer
            setSubtitleBuffer(prev => prev + text);
            setAiTranscript(prev => prev + text);
          } else {
            // For full events, replace the transcript
            setSubtitleBuffer(text);
            setAiTranscript(text);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing event:', error);
    }
  };

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
      const tokenResponse = await fetch('/api/session', { method: 'POST' });
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

  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col">
      {/* Header with back button */}
      <div className="w-full p-4 flex items-center">
        <button
          onClick={stopConversation}
          className="w-10 h-10 rounded-lg border border-amber-800/20 flex items-center justify-center bg-amber-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="ml-4">
          <h2 className="text-lg font-medium text-[#422006]">Speaking Practice</h2>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 pb-10">
        {/* Status indicator */}
        <div className="w-full text-center mb-4">
          <p className="text-[#422006] opacity-60">
            {isConnected ? 
              (isListening ? 'Listening...' : 'Connected and ready') : 
              'Connecting...'}
          </p>
        </div>
        
        {/* Animated Nacho */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatedNacho isSpeaking={aiSpeaking} size="lg" />
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
    </div>
  );
} 