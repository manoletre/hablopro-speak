'use client';

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface GrammarCardProps {
  id: string;
  userSaid: string;
  better: string;
  explanation: string;
}

export default function GrammarCard({ userSaid, better, explanation }: GrammarCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-[#422006]">{t('grammarCard.grammarSuggestion')}</h4>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-[#422006]">{t('grammarCard.youSaid')}</span>
          <span className="text-sm text-[#422006]">{userSaid}</span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-[#422006]">{t('grammarCard.better')}</span>
          <span className="text-sm text-[#422006]">{better}</span>
        </div>
        
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-sm text-[#422006] hover:text-[#422006]/80 transition-colors"
          >
            <span>{t('grammarCard.why')}</span>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-2 p-3 bg-amber-50 rounded border border-amber-200">
              <p className="text-sm text-[#422006]">{explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 