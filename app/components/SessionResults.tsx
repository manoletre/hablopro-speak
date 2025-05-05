'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import GrammarCard from './GrammarCard';
import VocabularyCard from './VocabularyCard';

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

export default function SessionResults({ conversationHistory, onClose }: SessionResultsProps) {
  const { t, getLanguageCode } = useLanguage();
  const [grammarCorrections, setGrammarCorrections] = useState<GrammarCorrection[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiCalled, setApiCalled] = useState<boolean>(false);
  const [uniqueSessionId] = useState<string>(() => Date.now().toString());
  
  // Add immediate console log to debug received props
  console.log('SessionResults received conversation history:', conversationHistory);
  
  useEffect(() => {
    const fetchFeedback = async () => {
      // Only call the API once
      if (apiCalled) {
        console.log('Feedback API already called, skipping');
        return;
      }
      
      try {
        setLoading(true);
        // Only set apiCalled to true after starting the fetch
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
        console.log('Using UI language code for feedback:', getLanguageCode());
        setApiCalled(true); // Set here, after all early returns
        
        // Call the feedback API once
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript,
            language: getLanguageCode(),
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
    
    if (conversationHistory.length > 0 && !apiCalled) {
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
  }, [conversationHistory, apiCalled, getLanguageCode]);
  
  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="w-full p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-lg border border-amber-800/20 flex items-center justify-center bg-amber-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="ml-4 flex-1">
          <h2 className="text-lg font-medium text-[#422006]">{t('sessionResults.title')}</h2>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-4 pb-8"> 
        {/* Grammar Corrections */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#422006] mb-2">{t('sessionResults.grammarCorrections')}</h3>
          {loading ? (
            <p className="text-[#422006]/60 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
              {t('sessionResults.analyzingGrammar')}
            </p>
          ) : error ? (
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
        
        {/* Vocabulary */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-[#422006] mb-2">{t('sessionResults.vocabulary')}</h3>
          {loading ? (
            <p className="text-[#422006]/60 text-center p-4 bg-white/70 rounded-lg border border-amber-100">
              {t('sessionResults.analyzingVocabulary')}
            </p>
          ) : error ? (
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
    </div>
  );
} 