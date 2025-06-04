'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RomanizationContextType {
  showRomanization: boolean;
  toggleRomanization: () => void;
}

const RomanizationContext = createContext<RomanizationContextType | undefined>(undefined);

export function RomanizationProvider({ children }: { children: ReactNode }) {
  const [showRomanization, setShowRomanization] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('showRomanization');
      if (stored === 'true') {
        setShowRomanization(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showRomanization', showRomanization.toString());
    }
  }, [showRomanization]);

  const toggleRomanization = () => {
    setShowRomanization(prev => !prev);
  };

  return (
    <RomanizationContext.Provider value={{ showRomanization, toggleRomanization }}>
      {children}
    </RomanizationContext.Provider>
  );
}

export function useRomanization() {
  const context = useContext(RomanizationContext);
  if (context === undefined) {
    throw new Error('useRomanization must be used within a RomanizationProvider');
  }
  return context;
}
