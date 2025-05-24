'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import GrammarCard from './GrammarCard';
import VocabularyCard from './VocabularyCard';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';

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
}

// Define the feedback data interface
interface GrammarCorrection {
  youSaid: string;
  better: string;
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
  grammar: GrammarCorrection[];
  vocabulary: VocabularyItem[];
}

// Loading Animation Component
function LoadingAnimation({ t }: { t: (key: any) => string }) {
  const loadingMessages = [
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
  ];

  const initialMessageIndex = Math.floor(Math.random() * loadingMessages.length);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(initialMessageIndex);
  const [isVisible, setIsVisible] = useState(true);
  const [usedIndices, setUsedIndices] = useState<number[]>([initialMessageIndex]);

  const getRandomMessageIndex = () => {
    const availableIndices = loadingMessages
      .map((_, index) => index)
      .filter(index => !usedIndices.includes(index));
    
    // If all messages have been used, reset the used indices
    if (availableIndices.length === 0) {
      setUsedIndices([]);
      return Math.floor(Math.random() * loadingMessages.length);
    }
    
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  };

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
  }, [usedIndices]);

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

export default function SessionResults({ conversationHistory, onClose }: SessionResultsProps) {
  const { t, language } = useLanguage();
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
  
  // Add immediate console log to debug received props
  console.log('SessionResults received conversation history:', conversationHistory);
  
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
        if (conversationHistory.length === 0) {
          console.log('No conversation history to analyze');
          setLoading(false);
          return;
        }
        
        // Sort by timestamp to ensure proper conversation order
        const sortedHistory = [...conversationHistory].sort((a, b) => a.timestamp - b.timestamp);
        
        // Convert conversation history to transcript format
        const transcript = sortedHistory
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n\n');
        
        // Only send if transcript is not empty (should usually be the case if history has length > 0)
        if (!transcript.trim()) {
          console.log('Generated transcript is empty, skipping API call');
          setLoading(false);
          return;
        }
        
        console.log('Sending transcript to API:', transcript);
        console.log('Using language code for feedback:', getLanguageCode(language));
        apiCalledRef.current = true; // Set here, after all early returns
        
        // Call the feedback API once
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript,
            language: getLanguageCode(language),
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        
        const feedbackData: FeedbackData = await response.json();
        console.log('Received feedback data:', feedbackData);
        
        setGrammarCorrections(feedbackData.grammar);
        setVocabulary(feedbackData.vocabulary);
        setError(null);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to analyze conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (conversationHistory.length > 0 && !apiCalledRef.current) {
      fetchFeedback();
    } else if (conversationHistory.length === 0) {
      setLoading(false);
    }
    
    // Ensure any active API connections are terminated when viewing results
    console.log('SessionResults mounted, ensuring connections are closed');
    console.log('Conversation history in useEffect:', JSON.stringify(conversationHistory));
    
    // Return cleanup function
    return () => {
      console.log('SessionResults unmounting');
    };
  }, [conversationHistory, language]);
  
  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col overflow-y-auto">
      {/* Loading Animation Overlay */}
      {loading && <LoadingAnimation t={t} />}
      
      {/* Fixed New Session Button - Only show when not loading */}
      {!loading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#fffaed]/80 backdrop-blur-sm p-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-[#422006] text-white font-medium hover:bg-[#422006]/90 transition-colors"
          >
            {t('sessionResults.newSession')}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="w-full p-4 mt-16">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-[#422006]">{t('sessionResults.title')}</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-4 pb-8"> 
        {/* Vocabulary */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#422006] mb-2">{t('sessionResults.vocabulary')}</h3>
          {error ? (
            <p className="text-red-500 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
              {t('sessionResults.failedToAnalyze')}
            </p>
          ) : vocabulary.length > 0 ? (
            <div className="space-y-4">
              {vocabulary.map((word, index) => (
                <VocabularyCard
                  key={index}
                  id={`vocab-${index}-${uniqueSessionId}`}
                  term={word.word}
                  wordType={word.type}
                  definition={word.meaning}
                  example={word.example}
                />
              ))}
            </div>
          ) : (
            <p className="text-[#422006]/60 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
              {t('sessionResults.noVocabularyItems')}
            </p>
          )}
        </div>

        {/* Grammar Corrections */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#422006] mb-2">{t('sessionResults.grammarAndStyle')}</h3>
          {error ? (
            <p className="text-red-500 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
              {t('sessionResults.failedToAnalyze')}
            </p>
          ) : grammarCorrections.length > 0 ? (
            <div className="space-y-4">
              {grammarCorrections.map((correction, index) => (
                <GrammarCard
                  key={index}
                  id={`grammar-${index}-${uniqueSessionId}`}
                  userSaid={correction.youSaid}
                  better={correction.better}
                  explanation={correction.explanation}
                />
              ))}
            </div>
          ) : (
            <p className="text-[#422006]/60 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
              {t('sessionResults.noGrammarCorrections')}
            </p>
          )}
        </div>

        <br />

        {/* Conversation Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#422006] mb-2">{t('sessionResults.conversationSummary')}</h3>
          <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
            {conversationHistory.length > 0 ? (
              <div className="space-y-4">
                {[...conversationHistory]
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex flex-col">
                        <div className={`max-w-3/4 rounded-lg p-3 ${
                          message.role === 'user' ? 'bg-amber-100 text-[#422006]' : 'bg-[#422006] text-white'
                        }`}>
                          {message.text}
                        </div>
                        <span className={`text-xs mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'} text-[#422006]/60`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[#422006]/60 text-center">{t('sessionResults.noConversation')}</p>
            )}
          </div>
        </div>
      </div>

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