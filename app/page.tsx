'use client';

import { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import VoiceChat from './components/VoiceChat';

export default function Home() {
  const [sessionStarted, setSessionStarted] = useState(false);

  const startSession = () => {
    setSessionStarted(true);
  };

  const endSession = () => {
    setSessionStarted(false);
  };

  return (
    <main className="min-h-screen">
      {!sessionStarted ? (
        <HomeScreen onStartSession={startSession} />
      ) : (
        <VoiceChat onClose={endSession} />
      )}
    </main>
  );
}
