'use client';

import BookmarkButton from './BookmarkButton';

interface GrammarCardProps {
  id: string;
  userSaid: string;
  better: string;
  explanation: string;
}

export default function GrammarCard({ id, userSaid, better, explanation }: GrammarCardProps) {
  // Create a unique ID if not provided
  const grammarId = id || `grammar-${Date.now()}`;
  
  const content = {
    userSaid,
    better,
    explanation
  };

  return (
    <div className="w-full rounded-xl bg-[#422006]/[0.05] p-5 mb-4">
      <div className="flex justify-between items-start">

        
      
      <div className="mt-4">
        <div className="mb-3">
          <p className="text-sm text-[#422006]/60 mb-1">You said:</p>
          <p className="text-[#422006]">{userSaid}</p>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-[#422006]/60 mb-1">Better:</p>
          <p className="text-[#422006] font-medium">{better}</p>
        </div>
        
        <div className="mt-5">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-[#422006] mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[#422006] text-sm">{explanation}</p>
          </div>
        </div>
      </div>
      <BookmarkButton 
          type="grammar" 
          content={content} 
          contentId={grammarId} 
        />
      </div>
    </div>
  );
} 