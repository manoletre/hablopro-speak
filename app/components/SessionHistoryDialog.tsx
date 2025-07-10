'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import SessionResults from './SessionResults';

// Helper function to get country code for flag display
const getCountryCode = (language: string): string => {
  const languageToCountryMap: { [key: string]: string } = {
    'english': 'gb',
    'español': 'es',
    'french': 'fr',
    'portuguese': 'br',
    'italian': 'it',
    'german': 'de',
    'dutch': 'nl',
    'chinese': 'cn',
    'japanese': 'jp',
    'korean': 'kr'
  };
  return languageToCountryMap[language] || 'gb';
};

// Helper component for flag display
const FlagIcon = ({ language, className = "" }: { language: string; className?: string }) => {
  const countryCode = getCountryCode(language);
  return (
    <span 
      className={`fi fi-${countryCode} inline-block rounded border border-[#422006] ${className}`}
      style={{
        width: '1.44em',
        height: '1.08em',
        fontSize: '1em',
        verticalAlign: 'middle',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    />
  );
};

interface SessionData {
  id: string;
  startedAt: any; // Firestore timestamp (matches what's saved in SessionResults)
  language: string;
  difficultyLevel: number;
  transcript?: string;
  keyTakeaway?: string;
}

interface SessionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSelected?: () => void; // Callback to close sidebar when session is selected
}

export default function SessionHistoryDialog({ isOpen, onClose, onSessionSelected }: SessionHistoryDialogProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);

  // Fetch sessions from Firebase
  useEffect(() => {
    if (!user || !isOpen) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const sessionsRef = collection(db, `users/${user.uid}/sessions`);
    const q = query(sessionsRef, orderBy('startedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData: SessionData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          startedAt: data.startedAt,
          language: data.language || 'Unknown',
          difficultyLevel: data.difficultyLevel || 1,
          transcript: data.transcript,
          keyTakeaway: data.keyTakeaway,
        });
      });
      setSessions(sessionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle session selection
  const handleSessionClick = async (session: SessionData) => {
    // Close the sidebar when a session is selected
    if (onSessionSelected) {
      onSessionSelected();
    }
    
    // If transcript is not in the initial data, fetch the full session document
    if (!session.transcript) {
      try {
        const sessionDoc = await getDoc(doc(db, `users/${user!.uid}/sessions/${session.id}`));
        if (sessionDoc.exists()) {
          const fullData = sessionDoc.data();
          setSelectedSession({
            ...session,
            transcript: fullData.transcript || '',
            keyTakeaway: fullData.keyTakeaway
          });
        } else {
          setSelectedSession(session);
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
        setSelectedSession(session);
      }
    } else {
      setSelectedSession(session);
    }
  };

  // Close session review and go back to list
  const handleCloseSessionReview = () => {
    setSelectedSession(null);
  };

  // If showing a specific session's review
  if (selectedSession) {
    // Parse the transcript into conversation history format for SessionResults
    const conversationHistory = selectedSession.transcript ? 
      (() => {
        const messages: Array<{role: 'user' | 'assistant', text: string, timestamp: number}> = [];
        const baseTimestamp = selectedSession.startedAt?.toDate()?.getTime() || Date.now();
        
        // Parse transcript format (assuming it's stored as "role: text\nrole: text\n...")
        const lines = selectedSession.transcript.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
          if (line.toLowerCase().startsWith('user:')) {
            messages.push({
              role: 'user',
              text: line.substring(5).trim(),
              timestamp: baseTimestamp + (index * 30000) // 30 seconds between messages
            });
          } else if (line.toLowerCase().startsWith('assistant:')) {
            messages.push({
              role: 'assistant', 
              text: line.substring(10).trim(),
              timestamp: baseTimestamp + (index * 30000)
            });
          }
        });
        
        return messages;
      })() : [];

    return (
      <SessionResults
        conversationHistory={conversationHistory}
        onClose={handleCloseSessionReview}
        language={selectedSession.language}
        transcript={selectedSession.transcript}
        sessionId={selectedSession.id}
        difficultyLevel={selectedSession.difficultyLevel}
        billingHandled={true} // Don't charge for viewing old sessions
        isHistoricalSession={true} // Load existing feedback instead of generating new
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#422006]">
            {t('sessionHistory.title')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-[#422006]/60">{t('sessionHistory.loadingSessions')}</div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[#422006]/60">{t('sessionHistory.noSessions')}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-amber-200 rounded-lg p-4 hover:bg-amber-50 transition-colors cursor-pointer"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FlagIcon language={session.language} className="mr-1" />
                        <span className="text-sm font-medium text-[#422006] capitalize">
                          {session.language}
                        </span>
                        <span className="text-xs bg-amber-100 text-[#422006] px-2 py-1 rounded">
                          Level {session.difficultyLevel}
                        </span>
                      </div>
                      <div className="text-sm text-[#422006]/70">
                        {formatDate(session.startedAt)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button className="text-sm text-[#422006] hover:text-[#5a3108] font-medium">
                        {t('sessionHistory.viewReview')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 