'use client';

import { useLanguage } from '../context/LanguageContext';

interface VocabularyCardProps {
  id: string;
  term: string;
  wordType: string;
  definition: string;
  example: string;
}

export default function VocabularyCard({ term, wordType, definition, example }: VocabularyCardProps) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-[#422006] text-lg">{term}</h4>
          <span className="text-sm text-[#422006]/60 italic">{wordType}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-[#422006]">{t('vocabularyCard.definition')}</span>
          <span className="text-sm text-[#422006]">{definition}</span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-[#422006]">{t('vocabularyCard.example')}</span>
          <span className="text-sm text-[#422006]">{example}</span>
        </div>
      </div>
    </div>
  );
} 