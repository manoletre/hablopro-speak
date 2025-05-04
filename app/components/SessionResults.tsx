'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Define interfaces for feedback data structure
interface GrammarFeedback {
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

interface Feedback {
  grammar: GrammarFeedback[];
  vocabulary: VocabularyItem[];
}

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

export default function SessionResults({ conversationHistory, onClose, language }: SessionResultsProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  // Add a ref to track if we've already sent a request
  const hasFetchedFeedback = useRef(false);

  useEffect(() => {
    const getFeedback = async () => {
      // If we've already fetched feedback, don't fetch again
      if (hasFetchedFeedback.current) return;
      
      try {
        setLoading(true);
        // Mark that we're fetching feedback to prevent duplicate requests
        hasFetchedFeedback.current = true;
        
        // Format conversation history as a single transcript string
        const transcript = conversationHistory
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n\n');
        
        // Call API to get feedback
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcript,
            language
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to get feedback');
        }
        
        const data = await response.json();
        setFeedback(data);
      } catch (error) {
        console.error('Error getting feedback:', error);
        // Provide fallback feedback in case of error
        setFeedback({
          grammar: [],
          vocabulary: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (conversationHistory.length > 0 && !hasFetchedFeedback.current) {
      getFeedback();
    } else if (conversationHistory.length === 0) {
      setLoading(false);
    }
  }, [conversationHistory, language]);

  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col p-4">
      {/* Header with Nacho image */}
      <div className="flex flex-col items-center justify-center mb-6">
        <Image 
          src="/images/nacho_taking_notes.png" 
          alt="Nacho taking notes" 
          width={150} 
          height={150} 
          className="mb-4"
        />
        <h1 className="text-2xl font-medium text-[#422006] text-center">
          let's review your session
        </h1>
      </div>
      
      {/* Content section */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-[#422006] opacity-60">Analyzing your conversation...</p>
          </div>
        ) : (
          <>
            {/* Grammar section */}
            {feedback && feedback.grammar.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-[#422006] mb-4">grammar</h2>
                {feedback.grammar.map((item, index) => (
                  <div key={index} className="bg-[#fef9e7] rounded-lg p-4 mb-4 border border-amber-200 relative">
                    <button className="absolute top-4 right-4 text-[#422006] opacity-60">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M19.5 5H4.5C3.67157 5 3 5.67157 3 6.5V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V6.5C21 5.67157 20.3284 5 19.5 5Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 15L9 12M12 15L15 12M12 15V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    <div className="mb-4">
                      <div className="text-[#422006] opacity-60 text-sm mb-1">you said:</div>
                      <div className="text-[#422006]">{item.youSaid}</div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-[#422006] opacity-60 text-sm mb-1">better:</div>
                      <div className="text-[#422006] font-medium">{item.better}</div>
                    </div>
                    
                    <div>
                      <div className="text-[#422006] opacity-60 text-sm mb-1">→ </div>
                      <div className="text-[#422006]">{item.explanation}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Vocabulary section */}
            {feedback && feedback.vocabulary.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-medium text-[#422006] mb-4">vocabulary</h2>
                {feedback.vocabulary.map((item, index) => (
                  <div key={index} className="bg-[#fef9e7] rounded-lg p-4 mb-4 border border-amber-200 relative">
                    <button className="absolute top-4 right-4 text-[#422006] opacity-60">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M19.5 5H4.5C3.67157 5 3 5.67157 3 6.5V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V6.5C21 5.67157 20.3284 5 19.5 5Z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 15L9 12M12 15L15 12M12 15V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    <div className="flex items-start mb-2">
                      <div className="text-[#422006] font-medium text-lg mr-2">{item.word}</div>
                      <div className="text-[#422006] opacity-60 text-sm">{item.type}</div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-[#422006] opacity-60 text-sm mb-1">"{item.meaning}" – {item.usage}</div>
                    </div>
                    
                    <div>
                      <div className="text-[#422006] opacity-60 text-sm mb-1">ex: </div>
                      <div className="text-[#422006] italic">{item.example}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Transcript section */}
            <div className="mb-8">
              <h2 className="text-xl font-medium text-[#422006] mb-4">transcript</h2>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                {conversationHistory.length === 0 ? (
                  <p className="text-[#422006] opacity-60 italic">No conversation recorded</p>
                ) : (
                  // Sort messages by timestamp
                  [...conversationHistory]
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((message, index) => {
                      // Format timestamp
                      const messageTime = new Date(message.timestamp);
                      const timeString = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={index} className={`mb-4 p-3 rounded-lg ${message.role === 'user' ? 'bg-amber-50' : 'bg-amber-100'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm text-[#422006] font-medium">
                              {message.role === 'user' ? 'You' : 'Nacho'}
                            </p>
                            <p className="text-xs text-[#422006] opacity-60">
                              {timeString}
                            </p>
                          </div>
                          <p className="text-[#422006] whitespace-pre-wrap">{message.text}</p>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Button to start another session */}
      <button
        onClick={onClose}
        className="w-full h-12 bg-[#422006] text-white rounded-xl text-lg font-medium"
      >
        start another session
      </button>
    </div>
  );
} 