'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getUserBookmarks, Bookmark } from '../services/bookmarkService';
import GrammarCard from '../components/GrammarCard';
import VocabularyCard from '../components/VocabularyCard';

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'grammar' | 'vocabulary'>('all');

  useEffect(() => {
    // Redirect to home if not logged in
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userBookmarks = await getUserBookmarks(user);
        setBookmarks(userBookmarks);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [user]);

  const filteredBookmarks = activeTab === 'all' 
    ? bookmarks 
    : bookmarks.filter(bookmark => bookmark.type === activeTab);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#fffaed] font-poppins flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fffaed] font-poppins flex flex-col">
      {/* Header */}
      <div className="w-full p-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="w-10 h-10 rounded-lg border border-amber-800/20 flex items-center justify-center bg-amber-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="ml-4 flex-1">
          <h2 className="text-lg font-medium text-[#422006]">{t('bookmarks.title')}</h2>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="w-full px-4 mb-4">
        <div className="flex space-x-2 bg-amber-50 rounded-lg p-1 border border-amber-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-md text-center text-sm font-medium ${
              activeTab === 'all' 
                ? 'bg-amber-500 text-white' 
                : 'text-[#422006]'
            }`}
          >
            {t('bookmarks.all')}
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`flex-1 py-2 rounded-md text-center text-sm font-medium ${
              activeTab === 'grammar' 
                ? 'bg-amber-500 text-white' 
                : 'text-[#422006]'
            }`}
          >
            {t('bookmarks.grammar')}
          </button>
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex-1 py-2 rounded-md text-center text-sm font-medium ${
              activeTab === 'vocabulary' 
                ? 'bg-amber-500 text-white' 
                : 'text-[#422006]'
            }`}
          >
            {t('bookmarks.vocabulary')}
          </button>
        </div>
      </div>
      
      {/* Bookmarks Content */}
      <div className="flex-1 px-4 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {filteredBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#422006"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 opacity-40"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <p className="text-[#422006] opacity-60 text-center">
                  {activeTab === 'all' 
                    ? t('bookmarks.noBookmarks')
                    : activeTab === 'grammar'
                    ? t('bookmarks.noGrammarBookmarks')
                    : t('bookmarks.noVocabularyBookmarks')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookmarks.map(bookmark => (
                  <div key={bookmark.id} className="relative">
                    {bookmark.type === 'grammar' && (
                      <GrammarCard
                        id={bookmark.id || ''}
                        userSaid={bookmark.content.userSaid}
                        better={bookmark.content.better}
                        explanation={bookmark.content.explanation}
                      />
                    )}
                    {bookmark.type === 'vocabulary' && (
                      <VocabularyCard
                        id={bookmark.id || ''}
                        term={bookmark.content.term}
                        wordType={bookmark.content.wordType}
                        definition={bookmark.content.definition}
                        example={bookmark.content.example}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 