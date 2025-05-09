'use client';

import { useState, useEffect } from 'react';

interface Language {
  name: string;
  emoji: string;
  code: string; // For fallback images
}

// Cross-platform compatible language data
const languages: Language[] = [
  { name: 'spanish', emoji: '🇪🇸', code: 'es' },
  { name: 'french', emoji: '🇫🇷', code: 'fr' },
  { name: 'italian', emoji: '🇮🇹', code: 'it' },
  { name: 'german', emoji: '🇩🇪', code: 'de' },
  { name: 'portuguese', emoji: '🇵🇹', code: 'pt' },
  { name: 'chinese', emoji: '🇨🇳', code: 'cn' },
  { name: 'japanese', emoji: '🇯🇵', code: 'jp' },
  { name: 'korean', emoji: '🇰🇷', code: 'kr' },
  { name: 'english', emoji: '🇬🇧', code: 'gb' },
  { name: 'dutch', emoji: '🇳🇱', code: 'nl' },
];

export default function LanguageTypingAnimation() {
  const [displayText, setDisplayText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);
  
  useEffect(() => {
    const currentLanguage = languages[currentLanguageIndex];
    const fullText = currentLanguage.name;
    
    // Handle typing and deleting
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Show emoji immediately when we start typing a new language
        if (displayText.length === 0) {
          setShowEmoji(true);
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
        // Deleting text but keeping emoji until the end
        if (displayText.length === 1) {
          // When deleting the last character, also remove the emoji
          setDisplayText('');
          setShowEmoji(false);
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
  }, [displayText, isDeleting, currentLanguageIndex, typingSpeed]);
  
  const currentLanguage = languages[currentLanguageIndex];
  
  return (
    <span 
      className="inline-flex items-baseline h-auto text-amber-700"
      style={{ minWidth: '200px', minHeight: '1.2em', display: 'inline-flex', alignItems: 'center' }}
    >
      {showEmoji && (
        <span 
          className="inline-block"
          role="img" 
          aria-label={`${currentLanguage.name} flag`}
          style={{ 
            fontSize: '1.2em',
            marginRight: '0.2em',
            transform: 'translateY(0.12em)'
          }}
        >
          {currentLanguage.emoji}
        </span>
      )}
      <span className="whitespace-nowrap">{displayText}</span>
      <span className="ml-1 animate-pulse opacity-70 font-light">|</span>
    </span>
  );
} 