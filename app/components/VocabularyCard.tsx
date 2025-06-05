'use client';

import { useLanguage } from '../context/LanguageContext';
import { pinyin } from 'pinyin-pro';

// Helper function to detect Chinese language specifically
const isChineseLanguage = (language: string): boolean => {
  const chineseLanguages = ['chinese', 'mandarin', 'cantonese', 'zh'];
  return chineseLanguages.some(lang => language.toLowerCase().includes(lang));
};

// Helper function to check if a character is Chinese
const isChineseCharacter = (char: string): boolean => {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(char);
};

// Component to render Chinese text with pinyin
const ChineseTextWithPinyin = ({ text, showPinyin }: { 
  text: string; 
  showPinyin: boolean;
}) => {
  const characters = text.split('');
  
  return (
    <span className="inline-block">
      {characters.map((char, idx) => {
        if (isChineseCharacter(char)) {
          // Get pinyin for this character
          const charPinyin = pinyin(char, { toneType: 'symbol', type: 'array' });
          const pinyinText = charPinyin[0] || '';
          
          return (
            <span key={idx} className={`inline-block text-center ${showPinyin ? 'mx-0.5' : 'mx-0'}`}>
              <span className="block">
                {char}
              </span>
              {showPinyin && pinyinText && (
                <span className="block text-xs opacity-70 leading-tight mt-0.5">
                  {pinyinText}
                </span>
              )}
            </span>
          );
        } else {
          // For non-Chinese characters (spaces, punctuation, etc.)
          return (
            <span key={idx} className="inline-block align-top">
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        }
      })}
    </span>
  );
};

interface VocabularyCardProps {
  id: string;
  term: string;
  wordType: string;
  definition: string;
  example: string;
  showPinyin?: boolean;
  language?: string;
}

export default function VocabularyCard({ term, wordType, definition, example, showPinyin = false, language = '' }: VocabularyCardProps) {
  const { t } = useLanguage();
  
  return (
    <div className="bg-white/70 rounded-lg p-4 border border-amber-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-[#422006] text-lg">
            {isChineseLanguage(language) ? (
              <ChineseTextWithPinyin text={term} showPinyin={showPinyin} />
            ) : term}
          </h4>
          <span className="text-sm text-[#422006]/60 italic">
            {isChineseLanguage(language) ? (
              <ChineseTextWithPinyin text={wordType} showPinyin={showPinyin} />
            ) : wordType}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="text-sm font-medium text-[#422006]">{t('vocabularyCard.definition')}</span>
          <span className="text-sm text-[#422006]">
            {isChineseLanguage(language) ? (
              <ChineseTextWithPinyin text={definition} showPinyin={showPinyin} />
            ) : definition}
          </span>
        </div>
        
        <div>
          <span className="text-sm font-medium text-[#422006]">{t('vocabularyCard.example')}</span>
          <span className="text-sm text-[#422006]">
            {isChineseLanguage(language) ? (
              <ChineseTextWithPinyin text={example} showPinyin={showPinyin} />
            ) : example}
          </span>
        </div>
      </div>
    </div>
  );
} 