'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Suggestion {
  type: 'vocabulary' | 'phrase' | 'encouragement';
  content: string;
  translation: string | null;
}

interface AnimatedStatusDisplayProps {
  isConnected: boolean;
  isListening: boolean;
  aiSpeaking: boolean;
  conversationHistory: Array<{ role: string; text: string; timestamp: number }>;
  targetLanguage: string;
  difficultyLevel: number;
}

export default function AnimatedStatusDisplay({
  isConnected,
  isListening,
  conversationHistory,
  targetLanguage,
  difficultyLevel
}: AnimatedStatusDisplayProps) {
  const { t, language: uiLanguage } = useLanguage();
  const [currentMessage, setCurrentMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [usedSuggestionIndices, setUsedSuggestionIndices] = useState<Set<number>>(new Set());
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [connectionPhase, setConnectionPhase] = useState<'connecting' | 'connected' | 'ready'>('connecting');
  const [apiCallCount, setApiCallCount] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's native language based on UI language
  const getUserNativeLanguage = useCallback(() => {
    return uiLanguage === 'español' ? 'spanish' : 'english';
  }, [uiLanguage]);

  // Hardcoded encouragement messages
  const getEncouragementMessages = useCallback(() => {
    const messages = {
      english: [
        "You're doing great!",
        "Keep it up!",
        "Nice work!",
        "You're improving!",
        "Well done!",
        "Great job!",
        "You've got this!",
        "Excellent progress!",
        "Keep practicing!",
        "You're on fire!"
      ],
      español: [
        "¡Lo estás haciendo genial!",
        "¡Sigue así!",
        "¡Buen trabajo!",
        "¡Estás mejorando!",
        "¡Bien hecho!",
        "¡Excelente trabajo!",
        "¡Tú puedes!",
        "¡Progreso excelente!",
        "¡Sigue practicando!",
        "¡Vas con toda!"
      ]
    };
    return messages[uiLanguage] || messages.english;
  }, [uiLanguage]);

  // Fetch suggestions from API (limited to 3 calls per conversation)
  const fetchSuggestions = useCallback(async () => {
    if (apiCallCount >= 3) {
      return;
    }

    try {
      setApiCallCount(prev => prev + 1);
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          targetLanguage,
          userNativeLanguage: getUserNativeLanguage(),
          difficultyLevel,
          vocabularyOnly: true // Request only vocabulary suggestions
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const vocabularySuggestions = data.suggestions?.filter((s: Suggestion) => s.type === 'vocabulary') || [];
        
        // Add new suggestions to existing ones (don't replace to avoid animation disruption)
        setSuggestions(prev => {
          const combined = [...prev, ...vocabularySuggestions];
          // Remove duplicates based on content
          const unique = combined.filter((suggestion, index, self) => 
            index === self.findIndex(s => s.content === suggestion.content)
          );
          return unique;
        });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, [apiCallCount, conversationHistory, targetLanguage, difficultyLevel, getUserNativeLanguage]);

  // Listening status messages
  const getListeningMessages = useCallback(() => {
    const messages = [
      t('voiceChat.canSpeak'),
      t('voiceChat.canSpeakNative')
    ];
    return messages;
  }, [t]);

  // Format suggestion message
  const formatSuggestionMessage = (suggestion: Suggestion) => {
    if (suggestion.type === 'vocabulary') {
      return suggestion.translation 
        ? `💡 ${suggestion.content} = ${suggestion.translation}`
        : `💡 ${suggestion.content}`;
    }
    return suggestion.content;
  };

  // Get a random encouragement message
  const getRandomEncouragement = useCallback(() => {
    const encouragements = getEncouragementMessages();
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    return `✨ ${encouragements[randomIndex]}`;
  }, [getEncouragementMessages]);

  // Get next message based on current state
  const getNextMessage = useCallback(() => {
    if (!isConnected || connectionPhase === 'connecting') {
      return t('voiceChat.connecting');
    } else if (connectionPhase === 'connected') {
      // When just connected, show the first message
      return t('voiceChat.canSpeakNative');
    } else if (connectionPhase === 'ready') {
      // For the first message after ready phase, always show "you can also speak in english"
      if (messageIndex === 0) {
        return t('voiceChat.canSpeakNative');
      }
      
      // After first message, randomly choose between listening messages and encouragements
      const shouldShowEncouragement = Math.random() < 0.6; // 60% chance for encouragement
      
      if (shouldShowEncouragement) {
        return getRandomEncouragement();
      } else {
        // Cycle through listening messages
        const listeningMessages = getListeningMessages();
        const adjustedIndex = (messageIndex - 1) % listeningMessages.length; // -1 because first message is special
        return listeningMessages[adjustedIndex];
      }
    } else {
      // Show encouragement as backup
      return getRandomEncouragement();
    }
  }, [isConnected, connectionPhase, messageIndex, t, getListeningMessages, getRandomEncouragement]);

  // Get next suggestion
  const getNextSuggestion = useCallback(() => {
    if (connectionPhase === 'ready' && suggestions.length > 0) {
      const availableSuggestions = suggestions.filter((_, index) => !usedSuggestionIndices.has(index));
      
      if (availableSuggestions.length > 0) {
        // Get the actual suggestion from the available pool
        const suggestionFromPool = availableSuggestions[currentSuggestionIndex % availableSuggestions.length];
        return formatSuggestionMessage(suggestionFromPool);
      } else {
        // All suggestions used, reset and start over
        setUsedSuggestionIndices(new Set());
        setCurrentSuggestionIndex(0);
        if (suggestions.length > 0) {
          return formatSuggestionMessage(suggestions[0]);
        }
      }
    }
    return '';
  }, [connectionPhase, suggestions, usedSuggestionIndices, currentSuggestionIndex]);

  // Handle connection phase transitions
  useEffect(() => {
    if (!isConnected) {
      setConnectionPhase('connecting');
    } else if (isConnected && connectionPhase === 'connecting') {
      // Show "connected" briefly, then transition to "ready"
      setConnectionPhase('connected');
      
      // Immediately trigger animation to show the connected message
      setIsVisible(false);
      setTimeout(() => {
        // Explicitly get the connected message since state hasn't updated yet
        const newMessage = t('voiceChat.canSpeakNative');
        const newSuggestion = getNextSuggestion();
        setCurrentMessage(newMessage);
        setCurrentSuggestion(newSuggestion);
        setIsVisible(true);
      }, 300);
      
      setTimeout(() => {
        setConnectionPhase('ready');
      }, 800); // Faster transition to ready state
    }
  }, [isConnected, connectionPhase, getNextMessage, getNextSuggestion, t]);

  // Main animation cycle - runs every 10 seconds
  useEffect(() => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }

    const performAnimation = () => {
      console.log('🔄 Starting 10-second animation cycle');
      
      // Fade out
      setIsVisible(false);
      
      setTimeout(() => {
        // Update content
        const newMessage = getNextMessage();
        const newSuggestion = getNextSuggestion();
        
        console.log('📝 Updating to:', { message: newMessage, suggestion: newSuggestion });
        
        setCurrentMessage(newMessage);
        setCurrentSuggestion(newSuggestion);
        
                 // Advance indices for next cycle
         setMessageIndex(prev => prev + 1);
         
         // Advance suggestion index if we have suggestions
         if (suggestions.length > 0) {
           setCurrentSuggestionIndex(prev => {
             const availableSuggestions = suggestions.filter((_, index) => !usedSuggestionIndices.has(index));
             
             if (availableSuggestions.length > 0) {
               const currentIndex = prev % availableSuggestions.length;
               
               // Mark the current suggestion as used
               const currentSuggestion = availableSuggestions[currentIndex];
               const actualIndex = suggestions.findIndex(s => s === currentSuggestion);
               if (actualIndex !== -1) {
                 setUsedSuggestionIndices(prevUsed => new Set([...prevUsed, actualIndex]));
               }
               
               // Move to next suggestion
               return prev + 1;
             } else {
               // All suggestions used, reset
               setUsedSuggestionIndices(new Set());
               return 0;
             }
           });
         }
        
        // Fade in
        setIsVisible(true);
      }, 300);
    };

         // Initial content setup - only set if not already set
     if (!currentMessage) {
       const initialMessage = getNextMessage();
       const initialSuggestion = getNextSuggestion();
       setCurrentMessage(initialMessage);
       setCurrentSuggestion(initialSuggestion);
     }

    // Set up 10-second interval (slightly faster during connection phase but not too fast)
    const intervalTime = connectionPhase === 'connecting' ? 5000 : 10000;
    animationIntervalRef.current = setInterval(performAnimation, intervalTime);

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [connectionPhase, suggestions.length, usedSuggestionIndices, t, isConnected, isListening, currentMessage, getNextMessage, getNextSuggestion, suggestions]);

  // Fetch suggestions when conversation progresses
  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // Strategic suggestion fetching: beginning (1-2 messages), middle (4-6 messages), end (8+ messages)
    const shouldFetchSuggestions = () => {
      const historyLength = conversationHistory.length;
      if (apiCallCount >= 3) return false;
      
      // Fetch at strategic points in the conversation
      if (apiCallCount === 0 && historyLength >= 1 && historyLength <= 2) return true; // Beginning
      if (apiCallCount === 1 && historyLength >= 4 && historyLength <= 6) return true; // Middle
      if (apiCallCount === 2 && historyLength >= 8) return true; // Later in conversation
      
      return false;
    };

    if (isConnected && connectionPhase === 'ready' && shouldFetchSuggestions()) {
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchSuggestions();
      }, 1000);
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [conversationHistory.length, isConnected, connectionPhase, targetLanguage, difficultyLevel, apiCallCount, fetchSuggestions]);

  return (
    <div className="w-full text-center mb-4 flex-shrink-0">
      {/* Main status message */}
      <div className="relative">
        <p 
          className={`text-[#422006] transition-all duration-300 min-h-[1.5rem] px-4 py-2 rounded-lg ${
            isVisible ? 'opacity-60 transform scale-100' : 'opacity-0 transform scale-95'
          }`}
        >
          {currentMessage}
        </p>
        
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="flex justify-center mt-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions display - matches subtitles box width and styling */}
      {currentSuggestion && (
        <div className="w-full max-w-[550px] mx-auto mt-2">
          <div 
            className={`bg-amber-100/95 backdrop-blur-sm rounded-lg shadow-sm border border-amber-200 relative transition-all duration-300 ${
              isVisible ? 'opacity-80 transform scale-100' : 'opacity-0 transform scale-95'
            }`}
          >
            <div className="px-4 py-3">
              <p className="text-[#422006] text-sm">
                {currentSuggestion}
              </p>
            </div>
            
            {/* Suggestion indicator */}
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 