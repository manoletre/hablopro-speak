'use client';

import { useState, useEffect } from 'react';

interface Language {
  name: string;
  code: string;
}

// Default language data (English)
const defaultLanguages: Language[] = [
  { name: 'spanish', code: 'es' },
  { name: 'french', code: 'fr' },
  { name: 'italian', code: 'it' },
  { name: 'german', code: 'de' },
  { name: 'portuguese', code: 'br' },
  { name: 'chinese', code: 'cn' },
  { name: 'japanese', code: 'jp' },
  { name: 'korean', code: 'kr' },
  { name: 'english', code: 'gb' },
  { name: 'dutch', code: 'nl' },
];

interface LanguageTypingAnimationProps {
  languages?: Language[];
}

export default function LanguageTypingAnimation({ languages = defaultLanguages }: LanguageTypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [showFlag, setShowFlag] = useState(false);
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  
  useEffect(() => {
    const currentLanguage = languages[currentLanguageIndex];
    const fullText = currentLanguage.name;
    
    // Handle typing and deleting
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Show flag immediately when we start typing a new language
        if (displayText.length === 0) {
          setShowFlag(true);
        }
        
        // Typing forward
        setDisplayText(fullText.substring(0, displayText.length + 1));
        
        // If we've completed typing the word
        if (displayText.length === fullText.length) {
          // Pause at the end of the word before deleting
          setTypingSpeed(1500);
          setIsDeleting(true);
        } else {
          setTypingSpeed(100);
        }
      } else {
        // Deleting text but keeping flag until the end
        if (displayText.length === 1) {
          // When deleting the last character, also remove the flag
          setDisplayText('');
          setShowFlag(false);
          setIsDeleting(false);
          setCurrentLanguageIndex((currentLanguageIndex + 1) % languages.length);
          setTypingSpeed(300); // Pause before typing next word
        } else {
          setDisplayText(fullText.substring(0, displayText.length - 1));
          setTypingSpeed(50); // Delete faster than typing
        }
      }
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentLanguageIndex, typingSpeed, languages]);
  
  const currentLanguage = languages[currentLanguageIndex];
  
  return (
    <span 
      className="inline-flex items-baseline h-auto text-amber-700"
      style={{ minWidth: '200px', minHeight: '1.2em', display: 'inline-flex', alignItems: 'center' }}
    >
      {showFlag && (
        <span 
          className="inline-block mr-2 rounded border border-gray-300"
          role="img" 
          aria-label={`${currentLanguage.name} flag`}
          style={{ 
            width: '1.2em',
            height: '0.9em',
            transform: 'translateY(0.05em)',
            overflow: 'hidden'
          }}
        >
          <span 
            className={`fi fi-${currentLanguage.code}`}
            style={{
              fontSize: '1.2em',
              lineHeight: '0.75',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
        </span>
      )}
      <span className="whitespace-nowrap">{displayText}</span>
      <span className="ml-1 animate-pulse opacity-70 font-light">|</span>
    </span>
  );
} 