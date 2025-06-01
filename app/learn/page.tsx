'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import HomeScreen from '../components/HomeScreen';
import VoiceChat from '../components/VoiceChat';

export default function LearnPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  
  const { user } = useAuth();
  const { setLanguage: setUiLanguage } = useLanguage();
  
  // Track session state at page level to persist across VoiceChat remounts
  const sessionCounterRef = useRef(0); // Tracks how many sessions have started
  const currentSessionIdRef = useRef<string | null>(null);

  // Load user preferences when user is available
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Load saved language preference
          const savedLanguage = data.lastSelectedLanguage;
          if (savedLanguage) {
            setSelectedLanguage(savedLanguage);
          }
          
          // Load saved proficiency level
          const savedDifficultyLevel = data.lastSelectedDifficultyLevel;
          if (savedDifficultyLevel) {
            setDifficultyLevel(savedDifficultyLevel);
          }
          
          // Load saved UI language
          const savedUiLanguage = data.uiLanguage;
          if (savedUiLanguage && (savedUiLanguage === 'english' || savedUiLanguage === 'español')) {
            setUiLanguage(savedUiLanguage);
            // Also update localStorage to keep them in sync
            localStorage.setItem('uiLanguage', savedUiLanguage);
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, [user, setUiLanguage]);

  const startSession = (level: number, language: string) => {
    setDifficultyLevel(level);
    setSelectedLanguage(language);
    setSessionStarted(true);
    
    // Increment session counter - each session gets a unique ID
    sessionCounterRef.current++;
    currentSessionIdRef.current = `session-${sessionCounterRef.current}-${Date.now()}`;
    
    console.log(`Starting new session: ${currentSessionIdRef.current}`);
  };

  const endSession = () => {
    console.log(`Ending session: ${currentSessionIdRef.current}`);
    setSessionStarted(false);
    // Keep the session counter - don't reset it
  };

  return (
    <div className="absolute inset-0 w-full h-full max-h-screen bg-[#fffaed] overflow-hidden">
      <main className="w-full h-full">
        {!sessionStarted ? (
          <HomeScreen onStartSession={startSession} />
        ) : (
          <VoiceChat 
            onClose={endSession} 
            difficultyLevel={difficultyLevel}
            language={selectedLanguage}
            sessionKey={currentSessionIdRef.current} // Pass unique session key
          />
        )}
      </main>
    </div>
  );
} 