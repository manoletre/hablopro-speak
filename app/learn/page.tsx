'use client';

import { useState, useRef } from 'react';
import HomeScreen from '../components/HomeScreen';
import VoiceChat from '../components/VoiceChat';

export default function LearnPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  
  // Track session state at page level to persist across VoiceChat remounts
  const sessionCounterRef = useRef(0); // Tracks how many sessions have started
  const currentSessionIdRef = useRef<string | null>(null);

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