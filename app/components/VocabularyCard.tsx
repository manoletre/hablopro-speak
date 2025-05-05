'use client';

import BookmarkButton from './BookmarkButton';

interface VocabularyCardProps {
  id: string;
  term: string;
  wordType: string;
  definition: string;
  example: string;
}

export default function VocabularyCard({ id, term, wordType, definition, example }: VocabularyCardProps) {
  // Create a unique ID if not provided
  const vocabId = id || `vocab-${Date.now()}`;
  
  const content = {
    term,
    wordType,
    definition,
    example
  };

  return (
    <div className="w-full rounded-xl bg-[#422006]/[0.05] p-5 mb-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-[#422006]">{term}</h2>
          <span className="ml-2 text-sm text-[#422006]/60 italic">{wordType}</span>
        </div>
        <BookmarkButton 
          type="vocabulary" 
          content={content} 
          contentId={vocabId} 
        />
      </div>
      
      <div className="mt-4">
        <div className="mb-3">
          <p className="text-sm text-[#422006]/60 mb-1">Definition:</p>
          <p className="text-[#422006]">{definition}</p>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-[#422006]/60 mb-1">Example:</p>
          <p className="text-[#422006] italic">{example}</p>
        </div>
      </div>
    </div>
  );
} 