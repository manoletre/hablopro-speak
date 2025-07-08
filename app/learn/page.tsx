'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import HomeScreen from '../components/HomeScreen';
import VoiceChat from '../components/VoiceChat';
import UpgradeSuccessDialog from '../components/UpgradeSuccessDialog';

// Declare global types for Sleekplan
declare global {
  interface Window {
    $sleek: unknown[];
    SLEEK_PRODUCT_ID?: number;
  }
}

export default function LearnPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(3);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  
  const { user } = useAuth();
  const { language: uiLanguage, setLanguage: setUiLanguage } = useLanguage();
  
  // Track session state at page level to persist across VoiceChat remounts
  const sessionCounterRef = useRef(0); // Tracks how many sessions have started
  const currentSessionIdRef = useRef<string | null>(null);

  // Check for checkout success in URL and refresh billing data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('checkout') === 'success') {
        setShowUpgradeSuccess(true);
        
        // Clean up the URL parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('checkout');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, []);

  // Sleekplan feature board - only show before session starts
  useEffect(() => {
    if (sessionStarted) {
      // Hide Sleekplan button and widget during session
      const hideStyle = document.createElement('style');
      hideStyle.id = 'sleek-hide-style';
      hideStyle.textContent = `
        #sleek-button { display: none !important; }
        #sleek-widget-wrap { display: none !important; }
      `;
      document.head.appendChild(hideStyle);

      // Remove Sleekplan script when session starts
      const existingScript = document.querySelector('script[src="https://client.sleekplan.com/sdk/e.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      // Clean up window variables
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete window.$sleek;
        } catch {
          /* noop */
        }
        delete window.SLEEK_PRODUCT_ID;
      }
      return;
    }

    // Remove hide styles when session ends
    const existingHideStyle = document.getElementById('sleek-hide-style');
    if (existingHideStyle) {
      existingHideStyle.remove();
    }

    // Add Sleekplan script before session starts
    const productId = uiLanguage === 'español' ? 614634707 : 514633702;
    
    // Clean up any existing script first
    const existingScript = document.querySelector('script[src="https://client.sleekplan.com/sdk/e.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Set up Sleekplan – make sure we never load the SDK twice
    if (typeof window !== 'undefined') {
      // Remove any previous Sleekplan instance that might still be hanging
      try {
        // Deleting the global prevents the SDK from thinking it was already initialised
        //  (it throws if it finds an existing value)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore – we need to reach into the window object
        delete window.$sleek;
      } catch {
        /* noop */
      }

      // Stub expected globals before the script loads
      window.$sleek = [];
      window.SLEEK_PRODUCT_ID = productId;

      // Only add the <script> tag once per page lifecycle
      if (!document.getElementById('sleek-sdk')) {
        const script = document.createElement('script');
        script.id = 'sleek-sdk';
        script.type = 'text/javascript';
        script.src = 'https://client.sleekplan.com/sdk/e.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }

    // Cleanup function
    return () => {
      const script = document.getElementById('sleek-sdk');
      if (script) {
        script.remove();
      }
      const hideStyle = document.getElementById('sleek-hide-style');
      if (hideStyle) {
        hideStyle.remove();
      }
      if (typeof window !== 'undefined') {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete window.$sleek;
        } catch {
          /* noop */
        }
        delete window.SLEEK_PRODUCT_ID;
      }
    };
  }, [sessionStarted, uiLanguage]);

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
      
      {/* Upgrade Success Dialog */}
      <UpgradeSuccessDialog
        isOpen={showUpgradeSuccess}
        onClose={() => setShowUpgradeSuccess(false)}
      />
    </div>
  );
} 