'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookmarkType, saveBookmark, deleteBookmark, isItemBookmarked } from '../services/bookmarkService';

interface BookmarkContent {
  [key: string]: string | number | boolean | object;
}

interface BookmarkButtonProps {
  type: BookmarkType;
  content: BookmarkContent;
  contentId: string;
}

export default function BookmarkButton({ type, content, contentId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if this item is already bookmarked when component mounts
    // or when user changes (login/logout)
    const checkBookmarkStatus = async () => {
      if (!user) {
        setIsBookmarked(false);
        setBookmarkId(undefined);
        return;
      }

      try {
        const result = await isItemBookmarked(user, type, contentId);
        setIsBookmarked(result.isBookmarked);
        setBookmarkId(result.bookmarkId);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    checkBookmarkStatus();
  }, [user, type, contentId]);

  const toggleBookmark = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        await deleteBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(undefined);
      } else {
        // Add bookmark
        const newBookmarkId = await saveBookmark(user, type, {
          ...content,
          id: contentId
        });
        setIsBookmarked(true);
        setBookmarkId(newBookmarkId);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading || !user}
      className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
        isLoading ? 'opacity-50' : ''
      }`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Save to bookmarks'}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={isBookmarked ? "#f59e0b" : "none"}
          stroke={isBookmarked ? "#f59e0b" : "#422006"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      )}
    </button>
  );
} 