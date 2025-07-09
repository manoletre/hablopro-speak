'use client';

import { useState, useRef, useEffect, useCallback, MouseEvent } from 'react';
import AnimatedNacho from './AnimatedNacho';
import AnimatedStatusDisplay from './AnimatedStatusDisplay';
import SessionResults from './SessionResults';
import AuthDialog from './AuthDialog';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { usePostHog } from 'posthog-js/react';
import { trackSessionCompleted, trackSessionStarted } from '../lib/analytics';
import { pinyin } from 'pinyin-pro';
import { useBilling } from '../hooks/useBilling';
import InsufficientMinutesDialog from './InsufficientMinutesDialog';
import { formatSecondsToMinutesAndSeconds } from '../lib/timeUtils';

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
  sessionKey?: string | null; // Unique key for each session to track state
}

// Helper function to detect CJK languages
const isCJKLanguage = (language: string): boolean => {
  const cjkLanguages = ['japanese', 'chinese', 'korean', 'mandarin', 'cantonese', 'ja', 'zh', 'ko'];
  return cjkLanguages.some(lang => language.toLowerCase().includes(lang));
};

// Helper function to detect Chinese language specifically
const isChineseLanguage = (language: string): boolean => {
  const chineseLanguages = ['chinese', 'mandarin', 'cantonese', 'zh'];
  return chineseLanguages.some(lang => language.toLowerCase().includes(lang));
};

  // Helper function to check if a character is Chinese
  const isChineseCharacter = (char: string): boolean => {
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(char);
  };

// Component to render Chinese text with pinyin
const ChineseTextWithPinyin = ({ text, onWordClick, popupWordIndex, showPinyin }: { 
  text: string; 
  onWordClick: (word: string, idx: number, e: MouseEvent<HTMLSpanElement>) => void;
  popupWordIndex: number | null;
  showPinyin: boolean;
}) => {
  const characters = text.split('');
  let chineseCharIndex = 0; // Track index for Chinese characters only
  
  return (
    <div className="inline-block">
      {characters.map((char, idx) => {
        if (isChineseCharacter(char)) {
          // Get pinyin for this character
          const charPinyin = pinyin(char, { toneType: 'symbol', type: 'array' });
          const pinyinText = charPinyin[0] || '';
          const currentChineseIndex = chineseCharIndex++;
          
          return (
            <div key={idx} className={`inline-block text-center ${showPinyin ? 'mx-0.5' : 'mx-0'}`}>
              <div 
                className={`cursor-pointer rounded px-0.5 ${popupWordIndex === currentChineseIndex ? 'bg-amber-300' : 'hover:bg-amber-200'}`}
                onClick={(e) => onWordClick(char, currentChineseIndex, e)}
              >
                {char}
              </div>
              {showPinyin && pinyinText && (
                <div className="text-xs text-[#422006] opacity-70 leading-tight mt-0.5">
                  {pinyinText}
                </div>
              )}
            </div>
          );
        } else {
          // For non-Chinese characters (spaces, punctuation, etc.)
          // These should appear at character level, not pinyin level
          return (
            <span key={idx} className="inline-block align-top" style={{ lineHeight: '1.25' }}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        }
      })}
    </div>
  );
};

export default function VoiceChat({ onClose, difficultyLevel, language, sessionKey }: VoiceChatProps) {
  usePostHog();

  const { user, loading } = useAuth();
  const { t, language: uiLanguage } = useLanguage();
  const { billing, hasEnoughMinutes } = useBilling();
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Debug logging for isConnected changes
  useEffect(() => {
    console.log('🔌 isConnected state changed:', isConnected);
  }, [isConnected]);
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [subtitleBuffer, setSubtitleBuffer] = useState<string>('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  // Session timer state - will be adjusted based on available minutes
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // Default 5 minutes, adjusted below
  const [maxSessionTime, setMaxSessionTime] = useState(0); // Track the actual session limit - start at 0 until billing data loads
  const [isWrappingUp, setIsWrappingUp] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false); // Track when session is being finished
  
  // Add session tracking for second-by-second billing
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [totalSessionDuration, setTotalSessionDuration] = useState(0); // Total duration in seconds
  const [showInsufficientMinutesDialog, setShowInsufficientMinutesDialog] = useState(false);
  
  // Batched billing state
  const [lastBillingUpdate, setLastBillingUpdate] = useState<number | null>(null);
  const batchUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update the conversation history initialization to avoid hardcoded messages
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Generate unique session ID for billing deduplication
  useEffect(() => {
    if (!sessionId && user) {
      const newSessionId = `${user.uid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      setBillingHandled(false); // Reset billing status for new session
      console.log(`💰 Generated session ID for billing deduplication: ${newSessionId}`);
    }
  }, [user, sessionId]);
  
  // Use sessionKey-based tracking to persist across component remounts

  // CJK language support - store deltas as individual translatable units
  const [subtitleDeltas, setSubtitleDeltas] = useState<string[]>([]);
  const isCJK = isCJKLanguage(language);

  // Keep references separate to avoid interference
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  
  // Add audio context ref for better audio management
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Add initialization flag to prevent concurrent WebRTC setups
  const initializingRef = useRef(false);
  
  // Add mounted ref to prevent state updates after unmount
  const mountedRef = useRef(true);

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

  // State and handlers for word translation
  const [popupWordIndex, setPopupWordIndex] = useState<number | null>(null);
  const [translatingWord, setTranslatingWord] = useState<string | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Track clicked words for vocabulary review
  const [clickedWords, setClickedWords] = useState<Array<{
    word: string;
    translation: string;
    context: string;
    timestamp: number;
  }>>([]);

  // State for pinyin visibility toggle
  const [showPinyin, setShowPinyin] = useState(false);
  
  // Track billing status
  const [billingHandled, setBillingHandled] = useState<boolean>(false);
  
  // Debug logging for billingHandled changes
  useEffect(() => {
    console.log('💰 billingHandled state changed:', billingHandled);
  }, [billingHandled]);

  // Add state for audio device management (for future use)
  // const [currentAudioDevice, setCurrentAudioDevice] = useState<string | null>(null);

  // Detect if we're on mobile
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Helper function to get optimal audio constraints for different platforms
  const getOptimalAudioConstraints = useCallback(() => {
    const baseConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1
    };

    if (isMobile) {
      // Mobile-optimized constraints
      return {
        ...baseConstraints,
        sampleRate: { ideal: 16000, min: 8000, max: 48000 }, // More flexible for mobile
        sampleSize: { ideal: 16 },
        latency: { ideal: 0.02, max: 0.15 }, // Target low latency but allow higher for stability
        // Remove volume and gain control that can cause issues on mobile
        autoGainControl: false, // Disable AGC on mobile as it can cause issues with Bluetooth
        googAutoGainControl: false,
        googNoiseSuppression: true,
        googEchoCancellation: true,
        googHighpassFilter: false,
        googTypingNoiseDetection: false
      };
    } else {
      // Desktop constraints
      return {
        ...baseConstraints,
        sampleRate: 24000,
        latency: { ideal: 0.01, max: 0.1 }
      };
    }
  }, [isMobile]);

  // Enhanced audio context initialization with mobile support
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        // Use webkitAudioContext for older mobile browsers
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        
        const contextOptions: AudioContextOptions = {
          latencyHint: isMobile ? 'balanced' : 'interactive',
          sampleRate: isMobile ? 16000 : 24000
        };

        audioContextRef.current = new AudioContextClass(contextOptions);
        
        // Create gain node for volume control
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        console.log('Audio context initialized:', {
          sampleRate: audioContextRef.current.sampleRate,
          state: audioContextRef.current.state,
          outputLatency: (audioContextRef.current as unknown as { outputLatency?: number }).outputLatency || 'unavailable'
        });

        // Handle audio context state changes
        audioContextRef.current.addEventListener('statechange', () => {
          console.log('AudioContext state changed to:', audioContextRef.current?.state);
        });

      } catch (error) {
        console.warn('Failed to initialize AudioContext:', error);
      }
    }

    // Resume audio context if it's suspended (common on mobile)
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed successfully');
      }).catch(error => {
        console.warn('Failed to resume AudioContext:', error);
      });
    }
  }, [isMobile]);

  // Enhanced device change detection
  const handleAudioDeviceChange = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Audio devices changed:', {
        outputs: audioOutputs.map(d => ({ label: d.label, deviceId: d.deviceId })),
        inputs: audioInputs.map(d => ({ label: d.label, deviceId: d.deviceId }))
      });

      // If we have an active audio element and the device changed, we might need to restart
      if (audioRef.current && isConnected) {
        console.log('Audio device changed during active session, monitoring for issues...');
        
        // On mobile/Bluetooth, we might need to restart the WebRTC connection
        if (isMobile && audioOutputs.some(device => 
          device.label.toLowerCase().includes('bluetooth') || 
          device.label.toLowerCase().includes('wireless')
        )) {
          console.log('Bluetooth device detected, applying mobile optimizations');
          
          // Add a small delay before restarting to allow device to stabilize
          setTimeout(() => {
            if (isConnected && mountedRef.current) {
              console.log('Restarting connection for Bluetooth device stability');
              // cleanupAudioResources();
              // initWebRTC();
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.warn('Error handling audio device change:', error);
    }
  }, [isConnected, isMobile]);

  // Register for audio device changes
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleAudioDeviceChange);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleAudioDeviceChange);
      };
    }
  }, [handleAudioDeviceChange]);

  // Animate dots for translating message
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (translatingWord && translation === null) {
      interval = setInterval(() => {
        // Animation logic can be handled via CSS or other means if needed
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [translatingWord, translation]);

  // Clear translation popup when subtitles change
  useEffect(() => {
    setPopupWordIndex(null);
    setTranslatingWord(null);
    setTranslation(null);
    setTooltipPosition(null);
  }, [subtitleBuffer]);

  const handleWordClick = useCallback(async (word: string, idx: number, e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({ top: rect.top, left: rect.left, width: rect.width });
    setPopupWordIndex(idx);
    setTranslatingWord(word);
    setTranslation(null);

    // Don't translate if the word is empty or just whitespace
    if (!word.trim()) {
      setTranslation(null);
      return;
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word, 
          context: subtitleBuffer, 
          sourceLanguage: language, 
          targetLanguage: uiLanguage 
        })
      });
      const data = await res.json();
      
      // If source and target languages are the same, format the translation as a definition
      const finalTranslation = language.toLowerCase() === uiLanguage.toLowerCase() ? 
        (data.translation.startsWith('Definition:') ? 
          data.translation : 
          `Definition: ${data.translation}`) :
        data.translation;
      
      setTranslation(finalTranslation);

      // Store the clicked word for vocabulary review
      // Only store if it's not already in the list (avoid duplicates)
      setClickedWords(prev => {
        const isAlreadyClicked = prev.some(item => 
          item.word.toLowerCase() === word.toLowerCase() && 
          item.context === subtitleBuffer
        );
        
        if (!isAlreadyClicked && finalTranslation) {
          return [...prev, {
            word: word.trim(),
            translation: finalTranslation,
            context: subtitleBuffer,
            timestamp: Date.now()
          }];
        }
        return prev;
      });
      
    } catch (error) {
      console.error('Translation error', error);
      const errorMessage = language.toLowerCase() === uiLanguage.toLowerCase() ? 
        'Error getting definition' : 
        'Error translating';
      setTranslation(errorMessage);
    }
  }, [language, uiLanguage, subtitleBuffer]);

  // Close tooltip when clicking anywhere outside word spans
  useEffect(() => {
    const handleDocumentClick = () => {
      if (tooltipPosition) {
        setPopupWordIndex(null);
        setTranslatingWord(null);
        setTranslation(null);
        setTooltipPosition(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [tooltipPosition]);

  // Enhanced cleanup function with audio context and billing cleanup
  const cleanupAudioResources = useCallback(() => {
    console.log('Cleaning up all audio resources');
    
    // Reset initialization flag
    initializingRef.current = false;
    
    // Set states to indicate disconnection
    setIsListening(false);
    setIsConnected(false);
    setAiSpeaking(false);
    setIsWrappingUp(false);
    setWrapUpMessageSent(false);
    setIsFinishing(false); // Reset finishing state
    
    // Clear billing intervals
    if (batchUpdateIntervalRef.current) {
      clearInterval(batchUpdateIntervalRef.current);
      batchUpdateIntervalRef.current = null;
    }
    
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

    // Clean up audio context (but don't close it completely as it might be needed later)
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      } catch (error) {
        console.error('Error cleaning up gain node:', error);
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
            console.log('⏰ Timer reached zero, wrapping up conversation');
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

  // Enhanced audio initialization with mobile and Bluetooth optimizations
  useEffect(() => {
    // Initialize audio context first
    initializeAudioContext();
    
    // Create separate audio elements with different handling
    if (typeof Audio !== 'undefined') {
      // Create audio element for OpenAI's response audio
      audioRef.current = new Audio();
      
      // Enhanced audio element configuration for mobile/Bluetooth
      audioRef.current.autoplay = true;
      audioRef.current.muted = false;
      audioRef.current.preload = 'auto';
      
             // Mobile-specific optimizations
       if (isMobile) {
         (audioRef.current as unknown as { playsInline: boolean }).playsInline = true;
         // Set lower buffer sizes for better responsiveness on mobile
         audioRef.current.crossOrigin = 'anonymous';
       }
      
      // Add event listeners to detect AI speaking with better error handling
      if (audioRef.current) {
        // When audio starts playing, set aiSpeaking to true
        audioRef.current.onplaying = () => {
          console.log('Audio playing started');
          setAiSpeaking(true);
        };
        
        // When audio pauses or ends, set aiSpeaking to false
        audioRef.current.onpause = () => {
          console.log('Audio paused');
          setAiSpeaking(false);
        };
        
        audioRef.current.onended = () => {
          console.log('Audio ended');
          setAiSpeaking(false);
        };
        
        // Add error handling for audio playback issues
        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          setAiSpeaking(false);
        };
        
        // Add event for when audio is ready to play
        audioRef.current.oncanplay = () => {
          console.log('Audio can play');
        };
        
        // Handle audio stalling (common with Bluetooth)
        audioRef.current.onstalled = () => {
          console.warn('Audio stalled - common with Bluetooth devices');
        };
        
        // Handle waiting for data
        audioRef.current.onwaiting = () => {
          console.log('Audio waiting for data');
        };
      }
    }
    
    // Clean up all audio resources on unmount
    return () => {
      cleanupAudioResources();
    };
  }, [cleanupAudioResources, initializeAudioContext, isMobile]);

  // Modified handleDataChannelEvent to properly track conversation messages in sequence
  const handleDataChannelEvent = useCallback((event: MessageEvent) => {
    // IMPORTANT: Ignore all data channel events when showing results
    if (showResults) {
      console.log('Ignoring data channel event - SessionResults is active');
      return;
    }
    
    // Define helper functions inside the callback to avoid dependency issues
    const hasStoredFirstQuestion = () => {
      if (!sessionKey) return false;
      return localStorage.getItem(`firstQuestionStored_${sessionKey}`) === 'true';
    };
    const markFirstQuestionStored = () => {
      if (!sessionKey) return;
      localStorage.setItem(`firstQuestionStored_${sessionKey}`, 'true');
    };

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
        // Clear deltas for CJK languages when starting new response
        if (isCJK) {
          setSubtitleDeltas([]);
        }
      }
      
      // Handle AI response audio transcript deltas
      if (data.type === 'response.audio_transcript.delta' && data.delta) {
        // For all delta events, append to subtitle buffer and AI transcript
        setSubtitleBuffer(prev => prev + data.delta);
        setAiTranscript(prev => prev + data.delta);
        
        // For CJK languages, store each delta as a separate translatable unit
        if (isCJK && data.delta.trim()) {
          setSubtitleDeltas(prev => [...prev, data.delta!]);
        }
      }
      
      // Handle AI response audio transcript complete - this contains the full transcript for each response
      if (data.type === 'response.audio_transcript.done' && data.transcript) {
        console.log('Complete AI transcript received:', data.transcript);
        
        // Use the complete transcript instead of the accumulated deltas for accuracy
        const completeTranscript = data.transcript;
        
        if (completeTranscript && completeTranscript.trim()) {
          console.log('Saving complete AI transcript to history:', completeTranscript);
          
          // Check if we have already stored the first question for this session
          const alreadyStoredFirstQuestion = hasStoredFirstQuestion();
          
          // Enhanced debugging logs for question storage
          console.log('=== QUESTION STORAGE DEBUG ===');
          console.log('user exists:', !!user);
          console.log('user.uid:', user?.uid);
          console.log('sessionId exists:', !!sessionId);
          console.log('alreadyStoredFirstQuestion:', alreadyStoredFirstQuestion);
          console.log('sessionKey:', sessionKey);
          console.log('completeTranscript:', completeTranscript);
          console.log('==============================');
          
          // Persist the **very first** assistant message (conversation opener)
          if (user && !alreadyStoredFirstQuestion) {
            console.log('Storing first assistant message as conversation opener');
            // Always ensure there's a session and then store the opener
            const createSessionAndStoreOpener = async () => {
              try {
                // Ensure session exists
                let activeSessionId = sessionId;
                if (!activeSessionId) {
                  const sessionsRef = collection(db, `users/${user.uid}/sessions`);
                  const timezoneOffsetMinutes = new Date().getTimezoneOffset();

                  const sessionDoc = await addDoc(sessionsRef, {
                    startedAt: serverTimestamp(),
                    transcript: '',
                    language,
                    difficultyLevel,
                    timezoneOffsetMinutes
                  });

                  activeSessionId = sessionDoc.id;
                  setSessionId(activeSessionId);
                  console.log(`Session created with ID: ${activeSessionId}`);
                }

                // Store the opener
                const questionsRef = collection(db, `users/${user.uid}/questions`);
                const questionDoc = await addDoc(questionsRef, {
                  question: completeTranscript.trim(),
                  sessionId: activeSessionId,
                  language,
                  difficultyLevel,
                  createdAt: serverTimestamp(),
                  date: new Date().toISOString().substring(0, 10)
                });

                console.log(`Conversation opener stored (doc ${questionDoc.id}) for session ${sessionKey}`);
                markFirstQuestionStored();
              } catch (err) {
                console.error('Error storing conversation opener:', err);
              }
            };

            createSessionAndStoreOpener();
          } else {
            // This session has already stored its first question or this is a subsequent response
            console.log(`Session ${sessionKey} - NOT storing question (already processed: ${alreadyStoredFirstQuestion}, sessionId exists: ${!!sessionId})`);
          }
          
          // Add this as a discrete message in the conversation history (this happens for all AI responses)
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
  }, [isWrappingUp, wrapUpMessageSent, isCJK, user, sessionId, language, difficultyLevel, sessionKey, showResults]);

  // Modify the initWebRTC function to add the data channel onopen event handler
  const initWebRTC = useCallback(async () => {
    // Enhanced guards to prevent multiple initializations
    if (initializingRef.current) {
      console.log('WebRTC initialization already in progress, skipping');
      return;
    }
    
    if (peerConnectionRef.current) {
      console.log('WebRTC connection already exists (peerConnectionRef), skipping initialization');
      return;
    }
    
    if (isConnected) {
      console.log('Already connected according to state, skipping initialization');
      return;
    }
    
    // IMPORTANT: Don't initialize WebRTC when finishing or showing results
    if (isFinishing || showResults) {
      console.log('Session is finishing or showing results, skipping WebRTC initialization');
      return;
    }
    
    // Set flag to prevent concurrent initializations
    console.log('Initializing new WebRTC connection');
    initializingRef.current = true;
    
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
      const calculatedMaxSessionMinutes = Math.ceil(maxSessionTime / 60);
      
      const sessionParams = {
        difficultyLevel,
        language,
        userId: user?.uid, // Include userId to fetch previous questions
        maxSessionMinutes: calculatedMaxSessionMinutes // Send the session limit
      };
      
      console.log('Fetching session token with params:', sessionParams);
      console.log('User billing info:', { 
        secondsRemaining: billing?.secondsRemaining,
        minutesRemaining: billing ? Math.floor(billing.secondsRemaining / 60) : 0,
        maxSessionTime: maxSessionTime,
        maxSessionMinutes: calculatedMaxSessionMinutes,
        calculationBreakdown: `Math.ceil(${maxSessionTime} / 60) = ${calculatedMaxSessionMinutes}`
      });
      
      // Extra validation to catch any issues
      if (calculatedMaxSessionMinutes > 5) {
        console.error('WARNING: Calculated session minutes exceeds 5!', {
          maxSessionTime,
          calculatedMaxSessionMinutes,
          billing: billing?.secondsRemaining
        });
      }
      
      const tokenResponse = await fetch('/api/session', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionParams)
      });
      
      if (!tokenResponse.ok) {
        console.error('Session API failed with status:', tokenResponse.status);
        let errorData;
        try {
          errorData = await tokenResponse.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { error: 'Failed to parse error response' };
        }
        console.error('Session API error data:', errorData);
        console.error('Response headers:', Object.fromEntries(tokenResponse.headers.entries()));
        
        if (tokenResponse.status === 402) {
          // Insufficient minutes - show dialog
          console.log('User has insufficient minutes according to server');
          console.log('Billing check details:', {
            remainingMinutes: errorData.remainingMinutes,
            remainingSeconds: errorData.remainingSeconds,
            requiredMinutes: errorData.requiredMinutes
          });
          setShowInsufficientMinutesDialog(true);
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${tokenResponse.status}: Failed to create session`);
      }
      
      const data = await tokenResponse.json();
      
      if (!data.client_secret?.value) {
        console.error('Invalid session response:', data);
        throw new Error('Invalid session token received');
      }
      
      const EPHEMERAL_KEY = data.client_secret.value;
      
      // Create peer connection
      console.log('Creating new RTCPeerConnection');
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Set up audio handling for WebRTC with enhanced error handling
      pc.ontrack = (e) => {
        console.log('Track received from server');
        if (audioRef.current && e.streams && e.streams[0]) {
          console.log('Setting audio source and playing');
          audioRef.current.srcObject = e.streams[0];
          
          // Enhanced audio playback with better error handling and mobile support
          const playAudio = async () => {
            try {
              // Initialize audio context if suspended (required for mobile)
              if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
                console.log('Resumed audio context for playback');
              }
              
              await audioRef.current!.play();
              console.log('WebRTC audio playback started successfully');
            } catch (err) {
              console.error('Error playing WebRTC audio:', err);
              
              // Retry with a small delay for mobile/Bluetooth issues
              if (isMobile || (err as Error)?.name === 'NotAllowedError') {
                setTimeout(async () => {
                  try {
                    await audioRef.current!.play();
                    console.log('Audio playback retry successful');
                  } catch (retryErr) {
                    console.error('Audio playback retry failed:', retryErr);
                  }
                }, 500);
              }
            }
          };
          
          playAudio();
        }
      };
      
      // Get microphone access with optimized audio constraints
      console.log('Requesting microphone access with optimized constraints for platform:', isMobile ? 'mobile' : 'desktop');
      const audioConstraints = getOptimalAudioConstraints();
      console.log('Using audio constraints:', audioConstraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      pc.addTrack(mediaStream.getTracks()[0]);
      
      // Set up data channel
      console.log('Creating data channel');
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      dc.onmessage = handleDataChannelEvent;
      
      // Add event listener for data channel open event to trigger AI response
      dc.onopen = () => {
        console.log('Data channel is now open');
        
        console.log(`Starting new session: ${sessionKey}`);
        
        // Wait a short moment for the connection to stabilize before triggering AI
        setTimeout(() => {
          console.log('Will now trigger AI to start conversation');
          // Reset conversation history if this is a new connection
          setConversationHistory([]);
          // Clear any previous AI transcript
          setAiTranscript('');
          setSubtitleBuffer('');
          // Clear deltas for CJK languages
          if (isCJK) {
            setSubtitleDeltas([]);
          }
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
      // Only update state if component is still mounted
      if (mountedRef.current) {
        console.log('🔌 Setting isConnected to true');
        setIsConnected(true);
      } else {
        console.log('🔌 Component unmounted, not setting isConnected');
      }
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      // Clean up any partial resources that might have been created
      if (typeof cleanupAudioResources === 'function') {
        cleanupAudioResources();
      }
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setIsConnected(false);
      }
    } finally {
      // Always reset the initialization flag
      initializingRef.current = false;
    }
  }, [handleDataChannelEvent, cleanupAudioResources, difficultyLevel, language, isCJK, user?.uid, sessionKey, isConnected, isFinishing, showResults, getOptimalAudioConstraints, isMobile, billing, maxSessionTime]);

   // Function to stop the conversation
  const stopConversation = async () => {
    if (isConnected) {
      // If we're already connected, check session duration
      console.log('🛑 Stopping active conversation');
      console.log('🛑 Session context:', {
        totalSessionDuration: totalSessionDuration,
        sessionStartTime: sessionStartTime,
        calculatedDuration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : null
      });
      
      // If session was longer than 30 seconds, show results and deduct minutes
      if (totalSessionDuration > 30) {
        console.log('🛑 Session longer than 30 seconds, showing results');
        finishSessionRef.current();
              } else {
          // For short sessions, still process billing but don't show results screen
          console.log('🛑 Session shorter than 30 seconds, processing billing and closing');
          
          // Process final billing for short sessions
          if (user && sessionStartTime) {
            try {
              // Calculate actual session duration at billing time
              const currentTime = Date.now();
              const actualSessionDuration = Math.floor((currentTime - sessionStartTime) / 1000);
              
              console.log(`Final billing for short session: ${actualSessionDuration} seconds (closure: ${totalSessionDuration}s)`);
              
              if (actualSessionDuration >= 5 && !billingHandled) {
                console.log(`💰 Billing short session for user ${user.uid} with session ID ${sessionId}`);
                const response = await fetch('/api/session/end', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.uid,
                    sessionDuration: actualSessionDuration,
                    sessionId: sessionId
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.alreadyBilled) {
                    console.log(`💰 ⚠️ Short session ${sessionId} was already billed, skipping duplicate charge`);
                  } else {
                    console.log(`💰 ✅ Successfully deducted ${result.secondsUsed} seconds for short session`);
                  }
                  setBillingHandled(true);
                  // Firebase real-time listener will automatically update billing data
                }
              } else if (billingHandled) {
                console.log(`💰 ⚠️ Short session billing already handled, skipping duplicate attempt`);
              } else {
                console.log(`Short session too brief (${actualSessionDuration}s), not billing`);
              }
            } catch (error) {
              console.error('Error billing short session:', error);
            }
          }
          
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
    mountedRef.current = true;
    
    // Clean up all resources when component unmounts
    return () => {
      console.log('==== VoiceChat component unmounting ====');
      mountedRef.current = false;
      
      // Force cleanup of all connections
      cleanupAudioResources();
      
      // Ensure timers are cleared
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Reset initialization flag
      initializingRef.current = false;
      
      // Explicitly clear event listeners from dataChannel if it exists
      if (dataChannelRef.current) {
        dataChannelRef.current.onmessage = null;
        dataChannelRef.current.onopen = null;
        dataChannelRef.current.onclose = null;
        dataChannelRef.current.onerror = null;
      }
    };
  }, [cleanupAudioResources]);

  // Set session time limit based on available seconds
  useEffect(() => {
    if (billing) {
      // Calculate max session time based on available time and subscription status
      const availableSeconds = billing.secondsRemaining;
      
      // Check if user is premium (has active subscription)
      const isPremium = billing.subscriptionStatus === 'active' && 
                       (billing.planType === 'monthly' || billing.planType === 'annual');
      
      // Premium users get 15 minutes (900 seconds), free/payg users get 5 minutes (300 seconds)
      const baseLimit = isPremium ? 900 : 300; // 15 minutes for premium, 5 minutes for free/payg
      
      // If user has less than the base limit, limit session to their available time
      const maxSessionSeconds = Math.min(baseLimit, availableSeconds);
      const maxTimeInSeconds = Math.max(60, maxSessionSeconds); // Minimum 1 minute
      
      console.log(`Setting session limit: ${maxTimeInSeconds} seconds (${Math.floor(maxTimeInSeconds / 60)}m ${maxTimeInSeconds % 60}s) based on ${availableSeconds} available seconds`);
      console.log('Billing data:', billing);
      console.log(`User premium status: ${isPremium} (subscriptionStatus: ${billing.subscriptionStatus}, planType: ${billing.planType})`);
      console.log(`Base limit: ${baseLimit} seconds (${Math.floor(baseLimit / 60)} minutes) for ${isPremium ? 'premium' : 'free/payg'} user`);
      
      setMaxSessionTime(maxTimeInSeconds);
      setTimeRemaining(maxTimeInSeconds);
    } else {
      console.log('No billing data available yet');
    }
  }, [billing]);

  // Add effect to track session duration for billing with batched updates
  useEffect(() => {
    if (isConnected && sessionStartTime) {
      const interval = setInterval(() => {
        const currentDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        setTotalSessionDuration(currentDuration);
        

      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, sessionStartTime, lastBillingUpdate]);

  // Disabled batched billing - we'll bill the full session duration at the end
  // This ensures accurate billing and prevents double-charging issues
  // useEffect(() => {
  //   if (isConnected && user && pendingSecondsToDeduct > 0) {
  //     if (batchUpdateIntervalRef.current) {
  //       clearInterval(batchUpdateIntervalRef.current);
  //     }
  //     
  //     batchUpdateIntervalRef.current = setInterval(async () => {
  //       if (pendingSecondsToDeduct >= 15) { // Update every 15 seconds to capture shorter sessions better
  //         try {
  //           console.log(`Batched billing update: deducting ${pendingSecondsToDeduct} seconds`);
  //           const response = await fetch('/api/session/billing-update', {
  //             method: 'POST',
  //             headers: {
  //               'Content-Type': 'application/json',
  //             },
  //             body: JSON.stringify({
  //               userId: user.uid,
  //               secondsUsed: pendingSecondsToDeduct
  //             })
  //           });
  //           
  //           if (response.ok) {
  //             const result = await response.json();
  //             console.log(`Successfully deducted ${result.secondsUsed} seconds. Remaining: ${result.remainingSeconds}`);
  //             
  //             // Reset pending seconds and update last billing time
  //             setPendingSecondsToDeduct(0);
  //             setLastBillingUpdate(Date.now());
  //             
  //             // Refresh billing data to reflect the changes
  //             await refreshBilling();
  //           } else {
  //             console.error('Failed to update billing:', await response.text());
  //           }
  //         } catch (error) {
  //           console.error('Error updating billing:', error);
  //         }
  //       }
  //     }, 15000); // Every 15 seconds
  //     
  //     return () => {
  //       if (batchUpdateIntervalRef.current) {
  //         clearInterval(batchUpdateIntervalRef.current);
  //       }
  //     };
  //   }
  // }, [isConnected, user, pendingSecondsToDeduct, refreshBilling]);

  // Handle page unload/refresh/close to save session duration
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user && sessionStartTime && totalSessionDuration >= 5 && !billingHandled && sessionId) {
        // Calculate current session duration in case totalSessionDuration isn't up to date
        const currentDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        
        // Use sendBeacon for reliable delivery during page unload
        const data = JSON.stringify({
          userId: user.uid,
          sessionDuration: currentDuration,
          sessionId: sessionId
        });
        
        navigator.sendBeacon('/api/session/end', data);
        console.log(`💰 Emergency billing update: ${currentDuration} seconds via sendBeacon for session ${sessionId}`);
      } else if (billingHandled) {
        console.log(`💰 ⚠️ Skipping emergency billing - session already billed`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, sessionStartTime, totalSessionDuration, billingHandled, sessionId]);

  // Check minutes before starting session
  const checkMinutesBeforeSession = useCallback(async () => {
    console.log('checkMinutesBeforeSession called with:', {
      user: !!user,
      billing: billing,
      hasEnoughMinutes: typeof hasEnoughMinutes,
      hasEnoughMinutes1: user && billing ? hasEnoughMinutes(1) : 'no user/billing'
    });
    
    if (!user || !billing) {
      console.log('No user or billing data available');
      return false;
    }
    
    // Check if user has at least 1 minute available
    if (!hasEnoughMinutes(1)) {
      console.log('User has insufficient minutes for conversation', {
        secondsRemaining: billing.secondsRemaining,
        minutesRemaining: Math.floor(billing.secondsRemaining / 60),
        hasEnoughMinutes1: hasEnoughMinutes(1)
      });
      setShowInsufficientMinutesDialog(true);
      return false;
    }
    
    console.log('User has enough minutes, proceeding with session');
    return true;
  }, [user, billing, hasEnoughMinutes]);

  // Modified conversation start with minute checking
  useEffect(() => {
    console.log('🔄 Auto-start useEffect triggered');
    // Only trigger once when component mounts and ALL prerequisites are available
    // IMPORTANT: Do not start WebRTC when showing results or finishing
    // Wait for billing data and maxSessionTime to be properly set
    if (user && billing && maxSessionTime > 0 && mountedRef.current && !isConnected && !peerConnectionRef.current && !initializingRef.current && !showResults && !isFinishing) {
      console.log('🚀 Auto-starting conversation on mount - all prerequisites ready (user, billing, session limits)');
      console.log('🚀 Auto-start state check:', {
        user: !!user,
        billing: !!billing,
        maxSessionTime: maxSessionTime,
        mounted: mountedRef.current,
        isConnected: isConnected,
        peerConnection: !!peerConnectionRef.current,
        initializing: initializingRef.current,
        showResults: showResults,
        isFinishing: isFinishing,
        billingHandled: billingHandled
      });
      
      // For mobile devices, we need a user gesture to initialize audio properly
      const startConversation = async () => {
        // Double-check conditions before starting to prevent race conditions
        // IMPORTANT: Also check showResults and isFinishing to prevent starting during results display or finishing
        if (mountedRef.current && !peerConnectionRef.current && !isConnected && !initializingRef.current && !showResults && !isFinishing) {
          console.log('Starting conversation from delayed useEffect - checking minutes');
          
          // Check if user has enough minutes before starting
          console.log('About to check minutes before session, current state:', {
            billing: billing,
            maxSessionTime: maxSessionTime,
            hasEnoughMinutes: typeof hasEnoughMinutes
          });
          
          const canStart = await checkMinutesBeforeSession();
          if (!canStart) {
            console.log('Cannot start session - insufficient minutes from checkMinutesBeforeSession');
            return;
          }
          
          console.log('checkMinutesBeforeSession passed, proceeding with session start');
          
          // Initialize audio context with user gesture (required for mobile)
          if (isMobile && audioContextRef.current?.state === 'suspended') {
            try {
              await audioContextRef.current.resume();
              console.log('Audio context resumed with user gesture');
            } catch (error) {
              console.warn('Failed to resume audio context:', error);
            }
          }
          
          // Set session start time for billing tracking
          const startTime = Date.now();
          setSessionStartTime(startTime);
          setLastBillingUpdate(startTime); // Initialize billing update timestamp
          
          // Reset billing status for new session
          setBillingHandled(false);
          console.log(`💰 Reset billing status for new session ${sessionId}`);
          
          setIsListening(true);
          initWebRTC();
        } else {
          console.log('Skipping auto-start - already initialized, in progress, showing results, or finishing');
        }
      };
      
      const timer = setTimeout(startConversation, 100);
      
      return () => clearTimeout(timer);
    } else if (user && mountedRef.current && !isConnected && !peerConnectionRef.current && !initializingRef.current && !showResults && !isFinishing) {
      // Log why we're not starting yet
      console.log('Auto-start conditions not met yet:', {
        user: !!user,
        billing: !!billing,
        maxSessionTime: maxSessionTime,
        mounted: mountedRef.current,
        connected: isConnected,
        peerConnection: !!peerConnectionRef.current,
        initializing: initializingRef.current,
        showResults: showResults,
        isFinishing: isFinishing
      });
    }
  }, [user, billing, maxSessionTime, isConnected, showResults, isFinishing, isMobile, checkMinutesBeforeSession, billingHandled, hasEnoughMinutes, initWebRTC]); // Removed initWebRTC from dependencies to prevent re-creation loops

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
  }, [user, language, difficultyLevel]); // Removed isConnected and initWebRTC to prevent re-triggering

  // Function to finish session and show results
  const finishSession = useCallback(async () => {
    console.log('🏁 Finishing session - cleaning up and preparing results');
    console.log('🏁 Session context:', {
      user: !!user,
      sessionStartTime: sessionStartTime,
      totalSessionDuration: totalSessionDuration,
      isWrappingUp: isWrappingUp,
      wrapUpMessageSent: wrapUpMessageSent
    });
    
    // Immediately set finishing state to prevent any WebRTC re-initialization
    setIsFinishing(true);
    
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

    // Process final billing - calculate current session duration to ensure accuracy
    if (user && sessionStartTime) {
      try {
        // Stop batched billing
        if (batchUpdateIntervalRef.current) {
          clearInterval(batchUpdateIntervalRef.current);
          batchUpdateIntervalRef.current = null;
        }
        
        // Calculate session duration at the time of billing to avoid closure issues
        const currentTime = Date.now();
        const actualSessionDuration = Math.floor((currentTime - sessionStartTime) / 1000);
        
        console.log(`💰 Final billing for session - Calculated duration: ${actualSessionDuration}s, Closure duration: ${totalSessionDuration}s`);
        
        // Only bill if session was at least 5 seconds and not already billed
        if (actualSessionDuration >= 5 && !billingHandled) {
          console.log(`💰 Attempting to bill ${actualSessionDuration} seconds for user ${user.uid} with session ID ${sessionId}`);
          
          // Update totalSessionDuration to match what we're billing
          setTotalSessionDuration(actualSessionDuration);
          const response = await fetch('/api/session/end', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.uid,
              sessionDuration: actualSessionDuration,
              sessionId: sessionId
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.alreadyBilled) {
              console.log(`💰 ⚠️ Session ${sessionId} was already billed, skipping duplicate charge`);
            } else {
              console.log(`💰 ✅ Successfully deducted ${result.secondsUsed} seconds (${result.minutesUsed} minutes). Remaining: ${result.remainingSeconds} seconds`);
            }
            setBillingHandled(true); // Mark billing as successful
            // Firebase real-time listener will automatically update billing data
          } else {
            const errorText = await response.text();
            console.error(`💰 ❌ Failed to deduct time (${response.status}):`, errorText);
            setBillingHandled(false); // Mark billing as failed
          }
        } else if (billingHandled) {
          console.log(`💰 ⚠️ Session billing already handled, skipping duplicate attempt`);
        } else {
          console.log(`💰 ⏭️ Session too short (${actualSessionDuration}s), not billing`);
        }
      } catch (error) {
        console.error('Error deducting time:', error);
      }
    }

    // Save session to Firestore if user is logged in
    if (user) {
      try {
        if (sessionId) {
          // Update existing session with final transcript
          const sessionRef = doc(db, `users/${user.uid}/sessions`, sessionId);
          await updateDoc(sessionRef, {
            transcript: finalConversationHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n'),
            finishedAt: serverTimestamp()
          });
          console.log(`Updated session ${sessionId} with final transcript`);
        } else {
          // Fallback: create new session if sessionId is not available
          const sessionsRef = collection(db, `users/${user.uid}/sessions`);
          const timezoneOffsetMinutes = new Date().getTimezoneOffset();
          
          await addDoc(sessionsRef, {
            startedAt: serverTimestamp(),
            transcript: finalConversationHistory.map(msg => `${msg.role}: ${msg.text}`).join('\n'),
            language,
            difficultyLevel,
            timezoneOffsetMinutes
          });
          console.log('Created fallback session document');
        }
        
        // Track session completion with analytics utility
        trackSessionCompleted(
          user.uid,
          {
            language,
            difficulty_level: difficultyLevel,
            conversation_length: finalConversationHistory.length,
            duration_minutes: Math.ceil(totalSessionDuration / 60) // Use actual session duration
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
          duration_minutes: Math.ceil(totalSessionDuration / 60) // Use actual session duration
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
    
    // Show results screen with the finalized conversation history immediately
    // No delay needed - this prevents race conditions with WebRTC re-initialization
    setConversationHistory(finalConversationHistory);
    setShowResults(true);
    
    console.log('Session finished and results shown immediately');
  }, [conversationHistory, aiTranscript, cleanupAudioResources, user, language, difficultyLevel, sessionId, sessionStartTime, totalSessionDuration, isWrappingUp, wrapUpMessageSent]);

  // Update the reference after definition
  useEffect(() => {
    finishSessionRef.current = finishSession;
  }, [finishSession]);

  // Function to send a wrapping up message through the data channel
  const sendWrappingUpMessage = useCallback(() => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open' && !wrapUpMessageSent) {
      console.log('⏰ Sending wrapping up message to AI');
      
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
        console.log('⏰ Finishing session after wrap-up message sent (timeout - 4 seconds elapsed)');
        finishSessionRef.current();
      }, 4000); // Give AI 4 seconds to respond
    } else if (wrapUpMessageSent) {
      console.log('Wrap-up message already sent, skipping duplicate');
    }
  }, [language, wrapUpMessageSent]);

  // Simplify the timing logic for detecting when AI stops speaking
  useEffect(() => {
    // Only run this effect if we're wrapping up and the wrap-up message has been sent
    if (isWrappingUp && wrapUpMessageSent) {
      console.log(`⏰ Wrap-up active: aiSpeaking=${aiSpeaking}`);
      // If AI has stopped speaking after the wrap-up message was sent,
      // we can finish the session more quickly
      if (!aiSpeaking) {
        // Give a short delay to make sure AI is really done (not just a pause)
        const quickFinishTimer = setTimeout(() => {
          console.log('⏰ AI stopped speaking during wrap-up, finishing session');
          finishSessionRef.current();
        }, 2000); // Slightly longer delay to ensure AI is really done
        
        return () => clearTimeout(quickFinishTimer);
      }
    }
  }, [isWrappingUp, aiSpeaking, wrapUpMessageSent]);

  // Simplified useEffect to trigger the wrap-up message when isWrappingUp changes
  useEffect(() => {
    if (isWrappingUp && !wrapUpMessageSent) {
      console.log('⏰ Starting wrap-up process (isWrappingUp=true, wrapUpMessageSent=false)');
      sendWrappingUpMessage();
    }
  }, [isWrappingUp, sendWrappingUpMessage, wrapUpMessageSent]);

  // Log whenever conversation history changes
  useEffect(() => {
    console.log('Conversation history updated:', conversationHistory);
  }, [conversationHistory]);

  // Add effect to ensure complete cleanup when showing results
  useEffect(() => {
    if (showResults) {
      console.log('===== TRANSITIONING TO SESSIONRESULTS - FORCING COMPLETE CLEANUP =====');
      console.log('SessionResults is now showing - ensuring complete audio/WebRTC cleanup');
      
      // Force immediate cleanup of all audio resources
      cleanupAudioResources();
      
      // Ensure timers are cleared
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        console.log('Cleared timer interval');
      }
      
      // Explicitly close any remaining data channel connections
      if (dataChannelRef.current) {
        console.log('Force closing data channel for SessionResults');
        try {
          dataChannelRef.current.close();
          dataChannelRef.current = null;
          console.log('Data channel successfully closed');
        } catch (error) {
          console.error('Error force-closing data channel:', error);
        }
      }
      
      // Reset all connection states
      setIsConnected(false);
      setIsListening(false);
      setAiSpeaking(false);
      setIsWrappingUp(false);
      setWrapUpMessageSent(false);
      
      console.log('===== ALL VOICECHAT CONNECTIONS SHOULD NOW BE COMPLETELY DISABLED =====');
    }
  }, [showResults, cleanupAudioResources]);

  // Final modified return statement with timer and conditional rendering for results
  return (
    <div className="fixed inset-0 bg-[#fffaed] font-poppins flex flex-col">
      {/* Show auth dialog if no user is authenticated and loading is complete */}
      {!loading && !user && <AuthDialog />}
      
      {!showResults ? (
        // Active session UI
        <>
          {/* Header with back button */}
          <div className="w-full p-4 flex items-center justify-between flex-shrink-0">
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
            
            {/* Timer and Minutes Display */}
            <div className="flex items-center space-x-3">
              {/* Session Timer */}
            <div className={`px-4 py-2 rounded-lg ${isWrappingUp ? 'bg-amber-400' : 'bg-amber-50'} border border-amber-800/20 flex items-center justify-center`}>
              <span className="text-[#422006] font-medium">
                {isWrappingUp ? t('voiceChat.wrappingUp') : formatTimeRemaining()}
              </span>
              </div>
              
              {/* Total Minutes Available */}
              {billing && (
                <div className="px-3 py-2 rounded-lg bg-white border border-amber-200 flex items-center space-x-2">
                  <span className="text-sm">⏰</span>
                                     <span className="text-sm text-[#422006] font-medium">
                     {formatSecondsToMinutesAndSeconds(billing.secondsRemaining)} total
                   </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Content - Structured for proper vertical distribution */}
          <div className="flex-1 flex flex-col px-6 min-h-0">
            {/* Status indicator and Nacho - Takes remaining space */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              {/* Animated Status Display */}
              <AnimatedStatusDisplay
                isConnected={isConnected}
                isListening={isListening}
                aiSpeaking={aiSpeaking}
                conversationHistory={conversationHistory}
                targetLanguage={language}
                difficultyLevel={difficultyLevel}
                showPinyin={showPinyin}
              />
              
              {/* Audio initialization button for mobile - only show if audio context is suspended */}
              {isMobile && audioContextRef.current?.state === 'suspended' && !isConnected && (
                <div className="mb-6 p-4 bg-amber-100 rounded-lg border border-amber-200 text-center">
                  <p className="text-sm text-[#422006] mb-3">
                    Tap to enable audio for the conversation
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await audioContextRef.current?.resume();
                        console.log('Audio context manually resumed');
                        // Force re-render to hide this button
                        setIsListening(prev => prev);
                      } catch (error) {
                        console.error('Failed to resume audio context:', error);
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    🔊 Enable Audio
                  </button>
                </div>
              )}
              
              {/* Animated Nacho - centered */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <AnimatedNacho isSpeaking={aiSpeaking} size="lg" level={difficultyLevel} />
              </div>
            </div>

            {/* AI response transcript - Always at bottom with safe spacing */}
            {subtitleBuffer && (
              <div className="w-full max-w-[550px] mx-auto mb-6 sm:mb-8 pb-4 sm:pb-6 flex-shrink-0">
                <div className="bg-amber-100/95 backdrop-blur-sm rounded-lg shadow-sm border border-amber-200 relative">
                  {/* Header with press word message and buttons */}
                  <div className="flex items-center justify-between p-3 pb-2">
                    <p className="text-xs text-[#422006] opacity-70 flex-1">
                      {t('voiceChat.pressWord')}
                    </p>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Pinyin toggle button - only show for Chinese */}
                      {isChineseLanguage(language) && (
                        <button
                          onClick={() => setShowPinyin(!showPinyin)}
                          className="px-2 py-1 text-xs rounded-md border border-amber-800/30 bg-amber-50 text-[#422006] hover:bg-amber-100 flex items-center space-x-1"
                        >
                          {!showPinyin ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              <span>pinyin</span>
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>pinyin</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={stopConversation}
                        className="px-2 py-1 text-xs rounded-md border border-amber-800/30 bg-amber-50 text-[#422006] hover:bg-amber-100"
                      >
                        {t('voiceChat.stop')}
                      </button>
                    </div>
                  </div>
                  
                  {/* Subtitles content */}
                  <div className="px-3 pb-3">
                    <p className="text-[#422006] text-sm mb-1 opacity-60">Nacho says:</p>
                    <div 
                      ref={subtitleContainerRef}
                      className="max-h-40 sm:max-h-48 overflow-y-auto mb-2 relative"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      <div className="text-[#422006]">
                        <div className="flex flex-wrap">
                          {isChineseLanguage(language) ? (
                            // For Chinese languages, show pinyin below characters
                            <ChineseTextWithPinyin 
                              text={subtitleBuffer}
                              onWordClick={handleWordClick}
                              popupWordIndex={popupWordIndex}
                              showPinyin={showPinyin}
                            />
                          ) : isCJK ? (
                            // For other CJK languages, use deltas as clickable units
                            subtitleDeltas.map((delta, idx) => (
                              <span
                                key={idx}
                                className={`inline-block cursor-pointer rounded ${popupWordIndex === idx ? 'bg-amber-300' : 'hover:bg-amber-200'}`}
                                onClick={(e) => handleWordClick(delta, idx, e)}
                              >
                                {delta}
                              </span>
                            ))
                          ) : (
                            // For non-CJK languages, use space-separated tokens
                            subtitleBuffer.split(/(\s+)/).map((token, idx) =>
                              /\s+/.test(token) ? (
                                <span key={idx}>{token}</span>
                              ) : (
                                <span
                                  key={idx}
                                  className={`inline-block px-0.5 cursor-pointer rounded ${popupWordIndex === idx ? 'bg-amber-300' : 'hover:bg-amber-200'}`}
                                  onClick={(e) => handleWordClick(token, idx, e)}
                                >
                                  {token}
                                </span>
                              )
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Translation Popup */}
            {tooltipPosition && translatingWord && (
              <div
                className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs"
                style={{
                  top: tooltipPosition.top - 10,
                  left: tooltipPosition.left + tooltipPosition.width / 2,
                  transform: 'translate(-50%, -100%)',
                  minWidth: '200px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  {translation === null ? (
                    <div className="flex items-center justify-center space-x-1 text-[#422006] text-sm">
                      <span>{language.toLowerCase() === uiLanguage.toLowerCase() ? 
                        t('voiceChat.gettingDefinition') : 
                        t('voiceChat.translating')}
                      </span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-[#422006] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-[#422006] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-[#422006] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#422006] text-sm">
                      {translation}
                    </div>
                  )}
                </div>
                {/* Arrow pointing down to the word */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-[-1px] border-4 border-transparent border-t-gray-300"></div>
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
          sessionId={sessionId}
          difficultyLevel={difficultyLevel}
          clickedWords={clickedWords}
          sessionDuration={totalSessionDuration}
          sessionStartTime={sessionStartTime ?? undefined}
          billingHandled={billingHandled}
        />
      )}

      {/* Insufficient Minutes Dialog */}
      <InsufficientMinutesDialog
        isOpen={showInsufficientMinutesDialog}
        onClose={() => {
          setShowInsufficientMinutesDialog(false);
          if (onClose) onClose();
        }}
      />
    </div>
  );
} 