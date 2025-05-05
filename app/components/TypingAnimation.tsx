'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  typingSpeed?: number;
}

export default function TypingAnimation({ text, typingSpeed = 10 }: TypingAnimationProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const previousTextRef = useRef('');
  
  // Reset animation when text changes completely
  useEffect(() => {
    // Check if this is a new text or just an addition
    if (!text.startsWith(previousTextRef.current)) {
      // Complete reset for new text
      setDisplayText('');
      setCurrentIndex(0);
    } else if (text !== previousTextRef.current) {
      // Calculate where we need to start typing from
      setCurrentIndex(displayText.length);
      previousTextRef.current = text;
    }
    
    previousTextRef.current = text;
  }, [text, displayText.length]);
  
  // Typing animation effect
  useEffect(() => {
    if (!text || currentIndex >= text.length) return;
    
    const timer = setTimeout(() => {
      setDisplayText(text.slice(0, currentIndex + 1));
      setCurrentIndex(prev => prev + 1);
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [currentIndex, text, typingSpeed, displayText.length]);
  
  return (
    <span className="whitespace-pre-wrap">
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
} 