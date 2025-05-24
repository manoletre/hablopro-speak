'use client';

import { useState } from 'react';
import HomeScreen from '../components/HomeScreen';
import VoiceChat from '../components/VoiceChat';

export default function LearnPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const startSession = (level: number, language: string) => {
    setDifficultyLevel(level);
    setSelectedLanguage(language);
    setSessionStarted(true);
  };

  const endSession = () => {
    setSessionStarted(false);
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
          />
        )}
      </main>
    </div>
  );
} 