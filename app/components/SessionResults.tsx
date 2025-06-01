'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../context/LanguageContext';
import VocabularyCard from './VocabularyCard';
import { getAuth } from 'firebase/auth';
import { doc, getFirestore, onSnapshot, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';

/*
 * Usage examples:
 * 
 * 1. With live conversation history (current usage in VoiceChat):
 *    <SessionResults conversationHistory={conversationHistory} onClose={onClose} language={language} sessionId={sessionId} difficultyLevel={difficultyLevel} />
 * 
 * 2. With Firestore session transcript:
 *    const sessionDoc = await getDoc(doc(db, `users/${userId}/sessions/${sessionId}`));
 *    const sessionData = sessionDoc.data();
 *    <SessionResults transcript={sessionData.transcript} onClose={onClose} language={sessionData.language} sessionId={sessionId} difficultyLevel={sessionData.difficultyLevel} />
 */

// Define the conversation message structure
interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface SessionResultsProps {
  conversationHistory: ConversationMessage[];
  onClose?: () => void;
  language: string;
  // Add optional transcript prop for when we receive raw transcript strings
  transcript?: string;
  // Add sessionId and difficultyLevel for Firebase storage
  sessionId?: string | null;
  difficultyLevel?: number;
  // Add clicked words from VoiceChat
  clickedWords?: Array<{
    word: string;
    translation: string;
    context: string;
    timestamp: number;
  }>;
}

// Define the feedback data interface
interface GrammarCorrection {
  category: string;
  youSaid: string;
  problemHighlight: string;
  better: string;
  improvementHighlight: string;
  explanation: string;
}

interface VocabularyItem {
  word: string;
  type: string;
  meaning: string;
  usage: string;
  example: string;
}

interface FeedbackData {
  keyTakeaway: string;
  grammar: GrammarCorrection[];
  vocabulary: VocabularyItem[];
}

// Enhanced Grammar Card Component
function EnhancedGrammarCard({ correction }: { correction: GrammarCorrection }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  // Function to highlight text
  const highlightText = (text: string, highlight: string, color: 'red' | 'green') => {
    if (!highlight || highlight.trim() === '') return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <u key={index} style={{ color: color === 'red' ? '#dc2626' : '#16a34a', textDecoration: 'underline' }}>
          {part}
        </u>
      ) : part
    );
  };

  return (
    <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
      <div className="space-y-3">
        <div>
          <span className="text-base font-medium text-[#422006]">{t('sessionResults.youSaid')}</span>
          <span className="text-base text-[#422006]">
            {highlightText(correction.youSaid, correction.problemHighlight, 'red')}
          </span>
        </div>
        
        <div>
          <span className="text-base font-medium text-[#422006]">{t('sessionResults.better')}</span>
          <span className="text-base text-[#422006]">
            {highlightText(correction.better, correction.improvementHighlight, 'green')}
          </span>
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1.5 text-xs text-[#422006] bg-amber-100 border border-amber-200 hover:bg-amber-200 transition-all duration-200 cursor-pointer hover:scale-105 px-2 py-1.5 rounded-md"
          >
            <span>{t('sessionResults.why')}</span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="text-[#422006]/60 transition-transform duration-200 hover:scale-110"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-2 p-3 bg-amber-50 rounded border border-amber-200">
              <p className="text-sm text-[#422006]">{correction.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Animation Component
function LoadingAnimation({ t }: { t: (key: TranslationKey, params?: Record<string, string | number>) => string }) {
  const loadingMessages: TranslationKey[] = useMemo(() => [
    'sessionResults.loadingMessage1',
    'sessionResults.loadingMessage2',
    'sessionResults.loadingMessage3',
    'sessionResults.loadingMessage4',
    'sessionResults.loadingMessage5',
    'sessionResults.loadingMessage6',
    'sessionResults.loadingMessage7',
    'sessionResults.loadingMessage8',
    'sessionResults.loadingMessage9',
    'sessionResults.loadingMessage10',
  ], []);

  const initialMessageIndex = Math.floor(Math.random() * loadingMessages.length);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(initialMessageIndex);
  const [isVisible, setIsVisible] = useState(true);
  const [usedIndices, setUsedIndices] = useState<number[]>([initialMessageIndex]);

  const getRandomMessageIndex = useCallback(() => {
    const availableIndices = loadingMessages
      .map((_, index) => index)
      .filter(index => !usedIndices.includes(index));
    
    // If all messages have been used, reset the used indices
    if (availableIndices.length === 0) {
      setUsedIndices([]);
      return Math.floor(Math.random() * loadingMessages.length);
    }
    
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }, [usedIndices, loadingMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        const newIndex = getRandomMessageIndex();
        setCurrentMessageIndex(newIndex);
        setUsedIndices(prev => [...prev, newIndex]);
        setIsVisible(true);
      }, 500); // Wait for fade out before changing message
    }, 4000); // Changed from 5000 to 4000 (4 seconds)

    return () => clearInterval(interval);
  }, [usedIndices, getRandomMessageIndex]);

  return (
    <div className="fixed inset-0 bg-[#fffaed] flex items-center justify-center z-50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Nacho analyzing image */}
        <div className="mb-6">
          <Image 
            src="/images/nacho_analyzing.png"
            alt="Nacho analyzing"
            width={200}
            height={200}
            className="w-48 h-48 mx-auto object-contain"
          />
        </div>
        
        {/* Animated loading dots */}
        <div className="flex justify-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        {/* Cycling message */}
        <p 
          className={`text-lg text-[#422006] transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {t(loadingMessages[currentMessageIndex])}
        </p>
      </div>
    </div>
  );
}

// Utility function to parse transcript string into ConversationMessage array
function parseTranscriptToConversationHistory(transcript: string): ConversationMessage[] {
  if (!transcript || typeof transcript !== 'string') {
    return [];
  }

  const messages: ConversationMessage[] = [];
  
  // Normalize the transcript by replacing various role markers
  const normalizedTranscript = transcript
    .replace(/\bA:/gi, 'assistant:') // Replace "A:" with "assistant:"
    .replace(/\bassistant\s*:/gi, 'assistant:') // Normalize spacing
    .replace(/\buser\s*:/gi, 'user:') // Normalize spacing
    .trim();

  // Split on role markers while keeping the markers
  const parts = normalizedTranscript.split(/(?=(?:user:|assistant:))/i).filter(part => part.trim());
  
  const baseTimestamp = Date.now() - 3600000; // Start 1 hour ago for consistent ordering
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    
    if (part.toLowerCase().startsWith('user:')) {
      const text = part.substring(5).trim(); // Remove "user:" and trim
      if (text.length > 0) {
        messages.push({
          role: 'user',
          text: text,
          timestamp: baseTimestamp + (messages.length * 30000) // 30 seconds between messages
        });
      }
    } else if (part.toLowerCase().startsWith('assistant:')) {
      const text = part.substring(10).trim(); // Remove "assistant:" and trim
      if (text.length > 0) {
        messages.push({
          role: 'assistant',
          text: text,
          timestamp: baseTimestamp + (messages.length * 30000) // 30 seconds between messages
        });
      }
    }
  }
  
  return messages;
}

// Helper function to get meaningful context around a clicked word
const getRelevantContext = (word: string, fullContext: string, maxLength: number = 100) => {
  // Find where the word appears in the context (case insensitive)
  const lowerWord = word.toLowerCase();
  const lowerContext = fullContext.toLowerCase();
  const wordIndex = lowerContext.indexOf(lowerWord);
  
  if (wordIndex === -1) {
    // Word not found, return the beginning of the context
    return fullContext.substring(0, maxLength) + (fullContext.length > maxLength ? '...' : '');
  }
  
  // Calculate how much context to show before and after the word
  const beforeContext = Math.floor((maxLength - word.length) / 2);
  const afterContext = maxLength - word.length - beforeContext;
  
  const startIndex = Math.max(0, wordIndex - beforeContext);
  const endIndex = Math.min(fullContext.length, wordIndex + word.length + afterContext);
  
  let relevantContext = fullContext.substring(startIndex, endIndex);
  
  // Add ellipsis if we truncated
  if (startIndex > 0) {
    relevantContext = '...' + relevantContext;
  }
  if (endIndex < fullContext.length) {
    relevantContext = relevantContext + '...';
  }
  
  return relevantContext;
};

export default function SessionResults({ conversationHistory, onClose, language, transcript, sessionId, clickedWords }: SessionResultsProps) {
  const { t, language: languageContext } = useLanguage();
  const [keyTakeaway, setKeyTakeaway] = useState<string>('');
  const [grammarCorrections, setGrammarCorrections] = useState<GrammarCorrection[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uniqueSessionId] = useState<string>(() => Date.now().toString());
  const [showStreakDialog, setShowStreakDialog] = useState<boolean>(false);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [randomStreakImage, setRandomStreakImage] = useState<string>('');
  
  // Use useRef to track if API has been called to prevent duplicate calls in React Strict Mode
  const apiCalledRef = useRef<boolean>(false);
  
  // Use useRef to store the stable conversation history once processed
  const stableConversationHistoryRef = useRef<ConversationMessage[]>([]);
  
  // Process conversation history - use transcript if provided, otherwise use conversationHistory
  // Store it in ref to prevent re-parsing on every render
  const processedConversationHistory = useMemo(() => {
    let processed: ConversationMessage[];
    
    if (transcript) {
      console.log('Parsing transcript:', transcript.substring(0, 100) + '...');
      processed = parseTranscriptToConversationHistory(transcript);
      console.log('Parsed conversation history:', processed.length, 'messages');
    } else {
      processed = conversationHistory;
    }
    
    // Store in ref for stability
    stableConversationHistoryRef.current = processed;
    return processed;
  }, [transcript, conversationHistory]);
  
  // Add immediate console log to debug received props
  console.log('SessionResults received conversation history:', processedConversationHistory);
  console.log('SessionResults received transcript:', transcript);
  console.log('SessionResults received clickedWords:', clickedWords);
  console.log('===== SessionResults MOUNTED - Should have NO active audio/WebRTC connections =====');
  
  // Create a stable conversation display that won't change when feedback loads
  const stableConversationDisplay = useMemo(() => {
    const conversationToDisplay = stableConversationHistoryRef.current.length > 0 
      ? stableConversationHistoryRef.current 
      : processedConversationHistory;
    
    return conversationToDisplay.length > 0 ? (
      <div className="space-y-4">
        {[...conversationToDisplay]
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user' 
                    ? 'bg-amber-100 text-[#422006] rounded-br-md border border-amber-200' 
                    : 'bg-[#fffaed] text-[#422006] rounded-bl-md border border-[#422006]/20'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    ) : (
      <p className="text-[#422006]/60 text-center">{t('sessionResults.noConversation')}</p>
    );
  }, [processedConversationHistory, t]); // Only depend on the initial processed conversation and translation function
  
  // Function to get a random streak image
  const getRandomStreakImage = () => {
    const totalImages = 15; // Based on the number of streak images in the folder
    const randomIndex = Math.floor(Math.random() * totalImages) + 1;
    return `/images/streaks/streak${randomIndex}.png`;
  };

  // Check if this is the first session of the day to show streak dialog
  useEffect(() => {
    const checkUserStreak = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) return;
        
        const db = getFirestore();
        
        // Get user's timezone offset for consistent date calculations
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();
        
        // Get today's date in user's local timezone (same logic as Firebase function)
        const today = new Date();
        const localDate = new Date(today.getTime() - (timezoneOffsetMinutes * 60 * 1000));
        const todayString = localDate.toISOString().substring(0, 10); // YYYY-MM-DD format
        
        console.log('Checking streak for local date:', todayString);
        
        // Set up real-time listeners for both user and day documents
        const userRef = doc(db, 'users', user.uid);
        const dayRef = doc(db, `users/${user.uid}/days/${todayString}`);
        
        let userUnsubscribe: (() => void) | null = null;
        let dayUnsubscribe: (() => void) | null = null;
        let hasShownDialog = false;
        
        // Listen for changes to the day document
        dayUnsubscribe = onSnapshot(dayRef, (daySnap) => {
          if (hasShownDialog) return;
          
          const dayData = daySnap.data();
          const sessionCount = dayData?.count || 0;
          
          console.log(`Day document updated: count = ${sessionCount}`);
          
          // If this is the first session of the day, set up user listener for streak
          if (sessionCount === 1) {
            console.log('First session detected, setting up user listener for streak update');
            
            // Listen for changes to the user document to get the updated streak
            userUnsubscribe = onSnapshot(userRef, (userSnap) => {
              if (hasShownDialog) return;
              
              const userData = userSnap.data();
              const currentStreak = userData?.currentStreak || 0;
              const lastActive = userData?.lastActive;
              
              // Verify the lastActive timestamp is recent (within last 30 seconds)
              // This ensures we're showing the dialog for the current session
              if (lastActive) {
                const lastActiveTime = lastActive.toDate();
                const now = new Date();
                const timeDiff = now.getTime() - lastActiveTime.getTime();
                
                console.log(`User document updated: streak = ${currentStreak}, time diff = ${timeDiff}ms`);
                
                // Show dialog if streak was updated recently (within 30 seconds)
                if (timeDiff < 30000 && currentStreak > 0) {
                  console.log('Showing streak dialog immediately after Firebase function completion');
                  hasShownDialog = true;
                  setStreakCount(currentStreak);
                  setRandomStreakImage(getRandomStreakImage());
                  setShowStreakDialog(true);
                  
                  // Clean up listeners
                  if (userUnsubscribe) userUnsubscribe();
                  if (dayUnsubscribe) dayUnsubscribe();
                }
              }
            });
          }
        });
        
        // Clean up listeners after 10 seconds to prevent memory leaks
        const cleanup = setTimeout(() => {
          console.log('Cleaning up streak listeners after timeout');
          if (userUnsubscribe) userUnsubscribe();
          if (dayUnsubscribe) dayUnsubscribe();
        }, 10000);
        
        // Return cleanup function
        return () => {
          clearTimeout(cleanup);
          if (userUnsubscribe) userUnsubscribe();
          if (dayUnsubscribe) dayUnsubscribe();
        };
        
      } catch (err) {
        console.error('Error setting up streak listeners:', err);
      }
    };
    
    // Only start checking after the session analysis is complete
    if (!loading && !error) {
      const cleanup = checkUserStreak();
      
      // Return cleanup function
      return () => {
        if (cleanup && typeof cleanup.then === 'function') {
          cleanup.then(cleanupFn => cleanupFn && cleanupFn());
        }
      };
    }
  }, [loading, error]);

  // Get language code mapping
  const getLanguageCode = (lang: string) => {
    const languageCodes: Record<string, string> = {
      'english': 'en',
      'español': 'es'
    };
    return languageCodes[lang] || 'en';
  };

  // Function to save feedback data to Firebase
  const saveFeedbackToFirebase = async (feedbackData: FeedbackData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !sessionId) {
        console.log('User not authenticated or sessionId not available, skipping Firebase save');
        return;
      }

      const db = getFirestore();
      const sessionRef = doc(db, `users/${user.uid}/sessions`, sessionId);
      
      // Update session with key takeaway
      await updateDoc(sessionRef, {
        keyTakeaway: feedbackData.keyTakeaway || ''
      });
      
      console.log('Updated session with key takeaway');

      // Save vocabulary items as subcollection
      if (feedbackData.vocabulary && feedbackData.vocabulary.length > 0) {
        const vocabularyRef = collection(db, `users/${user.uid}/sessions/${sessionId}/vocabulary`);
        
        for (const vocabItem of feedbackData.vocabulary) {
          await addDoc(vocabularyRef, {
            phrase: vocabItem.word || '',
            definition: vocabItem.meaning || '',
            example: vocabItem.example || '',
            type: vocabItem.type || '',
            source: 'ai_generated',
            createdAt: serverTimestamp()
          });
        }
        
        console.log(`Saved ${feedbackData.vocabulary.length} AI-generated vocabulary items to Firebase`);
      }

      // Save clicked words as vocabulary items
      if (clickedWords && clickedWords.length > 0) {
        const vocabularyRef = collection(db, `users/${user.uid}/sessions/${sessionId}/vocabulary`);
        
        for (const clickedWord of clickedWords) {
          await addDoc(vocabularyRef, {
            phrase: clickedWord.word,
            definition: clickedWord.translation,
            example: `${t('sessionResults.fromContext')} "${getRelevantContext(clickedWord.word, clickedWord.context)}"`,
            type: 'clicked_word',
            source: 'user_clicked',
            clickedAt: new Date(clickedWord.timestamp),
            createdAt: serverTimestamp()
          });
        }
        
        console.log(`Saved ${clickedWords.length} user-clicked vocabulary items to Firebase`);
      }

      // Save grammar corrections as subcollection
      if (feedbackData.grammar && feedbackData.grammar.length > 0) {
        const grammarRef = collection(db, `users/${user.uid}/sessions/${sessionId}/grammar`);
        
        for (const grammarItem of feedbackData.grammar) {
          await addDoc(grammarRef, {
            category: grammarItem.category || '',
            original: grammarItem.youSaid || '',
            corrected: grammarItem.better || '',
            why: grammarItem.explanation || '',
            problemHighlight: grammarItem.problemHighlight || '',
            improvementHighlight: grammarItem.improvementHighlight || '',
            createdAt: serverTimestamp()
          });
        }
        
        console.log(`Saved ${feedbackData.grammar.length} grammar items to Firebase`);
      }

      console.log('Successfully saved all feedback data to Firebase');
    } catch (error) {
      console.error('Error saving feedback to Firebase:', error);
      // Don't throw the error - we don't want to break the UI if Firebase save fails
    }
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      // Only call the API once using ref to prevent issues with React Strict Mode
      if (apiCalledRef.current) {
        console.log('Feedback API already called, skipping');
        return;
      }
      
      try {
        setLoading(true);
        
        // Check if there's any conversation history to analyze
        if (processedConversationHistory.length === 0) {
          console.log('No conversation history to analyze');
          setLoading(false);
          return;
        }
        
        // Use the original transcript if provided, otherwise reconstruct it
        // This ensures we send the exact same transcript that was saved to Firestore
        let transcriptToSend: string;
        
        if (transcript) {
          // Use the original transcript from Firestore - this ensures consistency
          transcriptToSend = transcript;
          console.log('Using original transcript from Firestore for feedback API');
        } else {
          // Reconstruct transcript using the same format as saved to Firestore
          // (lowercase roles, single newline separator)
          const sortedHistory = [...processedConversationHistory].sort((a, b) => a.timestamp - b.timestamp);
          transcriptToSend = sortedHistory
            .map(msg => `${msg.role}: ${msg.text}`)
            .join('\n');
          console.log('Reconstructed transcript for feedback API');
        }
        
        // Only send if transcript is not empty
        if (!transcriptToSend.trim()) {
          console.log('Generated transcript is empty, skipping API call');
          setLoading(false);
          return;
        }
        
        console.log('Sending transcript to API (first 200 chars):', transcriptToSend.substring(0, 200) + '...');
        console.log('Using UI language for feedback:', getLanguageCode(languageContext));
        console.log('Using target language for content:', language);
        apiCalledRef.current = true; // Set here, after all early returns
        
        // Call the feedback API once
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: transcriptToSend,
            language: getLanguageCode(languageContext), // UI language for prompt selection
            targetLanguage: language, // Target language being learned for content
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        
        const feedbackData: FeedbackData = await response.json();
        console.log('Received feedback data:', feedbackData);
        
        setKeyTakeaway(feedbackData.keyTakeaway || '');
        setGrammarCorrections(feedbackData.grammar || []);
        setVocabulary(feedbackData.vocabulary || []);
        setError(null);

        // Save feedback data to Firebase if user is authenticated and sessionId is available
        await saveFeedbackToFirebase(feedbackData);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to analyze conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (processedConversationHistory.length > 0 && !apiCalledRef.current) {
      fetchFeedback();
    } else if (processedConversationHistory.length === 0) {
      setLoading(false);
    }
    
    // Ensure any active API connections are terminated when viewing results
    console.log('SessionResults mounted, ensuring connections are closed');
    console.log('Conversation history in useEffect:', JSON.stringify(processedConversationHistory));
    
    // Return cleanup function
    return () => {
      console.log('SessionResults unmounting');
    };
  }, [processedConversationHistory, language, languageContext, saveFeedbackToFirebase, transcript]);  

  return (
    <div className="absolute inset-0 bg-[#fffaed] font-poppins overflow-y-auto">
      {/* Loading Animation Overlay */}
      {loading && <LoadingAnimation t={t} />}
      
      {/* Main Container with max width */}
      {!loading && (
        <div className="w-full max-w-[800px] mx-auto min-h-full">
          {/* Header Section */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                {/* Nacho taking notes image */}
                <div className="flex-shrink-0">
                  <Image 
                    src="/images/nacho_taking_notes.png"
                    alt="Nacho taking notes"
                    width={60}
                    height={60}
                    className="w-15 h-15 object-contain"
                  />
                </div>
                
                {/* Title and description */}
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-[#422006] mb-2">
                    {t('sessionResults.reviewTitle')}
                  </h1>
                  <p className="text-sm text-[#422006]/70">
                    {t('sessionResults.reviewDescription')}
                  </p>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-[#422006]/10 rounded-full transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6">
            {/* Key Takeaway */}
            {keyTakeaway && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-[#422006] mb-4">{t('sessionResults.keyTakeaway')}</h3>
                <div className="bg-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
                      </svg>
                    </div>
                    <p className="text-[#422006] leading-relaxed">{keyTakeaway}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Vocabulary */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-[#422006] mb-4">{t('sessionResults.vocabulary')}</h3>
              {error ? (
                <p className="text-red-500 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
                  {t('sessionResults.failedToAnalyze')}
                </p>
              ) : (vocabulary.length > 0 || (clickedWords && clickedWords.length > 0)) ? (
                <div className="space-y-4">
                  {/* AI-generated vocabulary */}
                  {vocabulary.map((word, index) => (
                    <div key={`ai-vocab-${index}-${uniqueSessionId}`} className="relative">
                      <VocabularyCard
                        id={`ai-vocab-${index}-${uniqueSessionId}`}
                        term={word.word}
                        wordType={word.type}
                        definition={word.meaning}
                        example={word.example}
                      />
                    </div>
                  ))}
                  
                  {/* User-clicked words */}
                  {clickedWords && clickedWords.map((clickedWord, index) => (
                    <div key={`clicked-vocab-${index}-${uniqueSessionId}`} className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                          {t('sessionResults.youLookedThisUp')}
                        </span>
                      </div>
                      <VocabularyCard
                        id={`clicked-vocab-${index}-${uniqueSessionId}`}
                        term={clickedWord.word}
                        wordType={t('sessionResults.wordYouLookedUp')}
                        definition={clickedWord.translation}
                        example={`${t('sessionResults.fromContext')} "${getRelevantContext(clickedWord.word, clickedWord.context)}"`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#422006]/60 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
                  {t('sessionResults.noVocabularyItems')}
                </p>
              )}
            </div>

            {/* Grammar & Style */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-[#422006] mb-4">{t('sessionResults.grammarAndStyle')}</h3>
              {error ? (
                <p className="text-red-500 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
                  {t('sessionResults.failedToAnalyze')}
                </p>
              ) : grammarCorrections.length > 0 ? (
                <div className="space-y-4">
                  {grammarCorrections.map((correction, index) => (
                    <EnhancedGrammarCard
                      key={index}
                      correction={correction}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[#422006]/60 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
                  {t('sessionResults.noGrammarCorrections')}
                </p>
              )}
            </div>

            {/* Conversation Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-[#422006] mb-4">{t('sessionResults.conversationSummary')}</h3>
              <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
                {stableConversationDisplay}
              </div>
            </div>

            {/* New Session Button - Now at the bottom */}
            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg bg-[#422006] text-white font-medium hover:bg-[#422006]/90 transition-colors"
              >
                {t('sessionResults.newSession')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Dialog */}
      {showStreakDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-xl transform transition-all">
            <div className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#422006] mb-2">
                  {t('sessionResults.streakCongrats')}
                </h3>
                <div className="my-4">
                  <Image 
                    src={randomStreakImage}
                    alt={t('sessionResults.streakImage')}
                    width={400}
                    height={300}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <p className="text-xl font-medium text-[#422006] mb-4">
                  {t('sessionResults.dayStreak', { count: streakCount })}
                </p>
                <p className="text-sm text-[#422006]/70 mb-6">
                  {t('sessionResults.keepPracticing')}
                </p>
                <button
                  onClick={() => setShowStreakDialog(false)}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                >
                  {t('sessionResults.awesome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 