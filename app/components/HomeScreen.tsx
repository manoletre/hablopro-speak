'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import StreakDisplay from './StreakDisplay';
import { trackSessionStarted } from '../lib/analytics';
import { usePostHog } from 'posthog-js/react';

interface HomeScreenProps {
  onStartSession: (level: number, language: string) => void;
}

export default function HomeScreen({ onStartSession }: HomeScreenProps) {
  const { user, signOut } = useAuth();
  const { language: uiLanguage, setLanguage: setUiLanguage, t } = useLanguage();
  const posthog = usePostHog();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('french');
  const [difficultyLevel, setDifficultyLevel] = useState(1); // Default level is 1
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showStreakDisplay, setShowStreakDisplay] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    const fetchStreakData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentStreak(data.currentStreak || 0);
          setLongestStreak(data.longestStreak || 0);
        }
      } catch (error) {
        console.error('Error fetching streak data:', error);
      }
    };

    fetchStreakData();
  }, [user]);

  // Toggle sidebar visibility
  const handleSidebarClick = () => {
    setShowSidebar(!showSidebar);
  };

  const handleLogout = async () => {
    await signOut();
    setShowSidebar(false);
  };

  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
  };

  const selectUiLanguage = (language: 'english' | 'español') => {
    setUiLanguage(language);
    setShowLanguageMenu(false);
  };

  const selectConversationLanguage = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  // Get Nacho image based on current difficulty level
  const getNachoImage = () => {
    switch (difficultyLevel) {
      case 1:
        return "/images/nacho_level1.png";
      case 2:
        return "/images/nacho_level2.png";
      case 3:
        return "/images/nacho_transparent.png";
      case 4:
        return "/images/nacho_level4.png";
      case 5:
        return "/images/nacho_level5.png";
      default:
        return "/images/nacho_transparent.png";
    }
  };

  // Wrap the onStartSession callback to include analytics
  const handleStartSession = (level: number, language: string) => {
    // Track session start
    trackSessionStarted(
      user?.uid || null,
      {
        language,
        difficulty_level: level
      }
    );
    
    // Call the original onStartSession prop
    onStartSession(level, language);
  };

  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col" suppressHydrationWarning>
      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 flex flex-col">
            {/* Top section with close button */}
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setShowSidebar(false)}
                className="w-8 h-8 rounded-lg border border-amber-200 flex items-center justify-center bg-amber-50/80 hover:bg-amber-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {/* Navigation links */}
            <div className="p-4">
              <a 
                href="/bookmarks" 
                className="flex items-center p-3 rounded-md hover:bg-amber-50 text-[#422006] transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mr-3"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                {t('home.myBookmarks')}
              </a>
              
              {/* Admin link - only visible to admin user */}
              {user && user.uid === 'IlLapv9gGqY7gKlDozNtDztbdkz1' && (
                <a 
                  href="/admin" 
                  className="flex items-center p-3 mt-2 rounded-md hover:bg-amber-50 text-[#422006] transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-3"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  Admin Dashboard
                </a>
              )}
            </div>
            
            {/* Empty top area */}
            <div className="flex-grow"></div>
            
            {/* User info and logout at bottom */}
            <div className="p-4 border-t border-amber-100">
              {user && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    {user.photoURL ? (
                      <div className="w-10 h-10 rounded-full bg-amber-100 overflow-hidden mr-3 flex-shrink-0">
                        <Image 
                          src={user.photoURL} 
                          alt="Profile" 
                          width={40} 
                          height={40}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            // Fallback to initials on image load error
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            const initialsEl = document.createElement('span');
                            initialsEl.className = 'text-[#422006] font-medium';
                            initialsEl.textContent = user.displayName?.charAt(0) || user.email?.charAt(0) || '?';
                            e.currentTarget.parentElement?.appendChild(initialsEl);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-[#422006] font-medium">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-medium text-[#422006] truncate">{user.displayName || 'User'}</p>
                      <p className="text-sm text-[#422006]/60 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="w-full py-2 border border-amber-200 text-[#422006] rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="#422006" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('home.logout')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Top Bar */}
      <div className="w-full p-4 flex justify-between items-center">
        {/* Sidebar Button (Left) - only show if user is signed in */}
        {user ? (
          <button 
            onClick={handleSidebarClick}
            className="w-10 h-10 rounded-lg border border-amber-800/20 flex items-center justify-center bg-amber-50"
          >
            <svg suppressHydrationWarning width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect suppressHydrationWarning x="4" y="6" width="16" height="2" rx="1" fill="#422006" />
              <rect suppressHydrationWarning x="4" y="11" width="16" height="2" rx="1" fill="#422006" />
              <rect suppressHydrationWarning x="4" y="16" width="16" height="2" rx="1" fill="#422006" />
            </svg>
          </button>
        ) : (
          <div className="w-10 h-10"></div> /* Empty div to preserve layout spacing */
        )}

        {/* Language Selection (Right) */}
        <div className="relative">
          <button 
            onClick={toggleLanguageMenu}
            className="w-10 h-10 rounded-lg border border-amber-800/20 flex items-center justify-center bg-amber-50"
          >
            <svg suppressHydrationWarning width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path suppressHydrationWarning d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#422006" strokeWidth="2" />
              <path suppressHydrationWarning d="M2 12H22" stroke="#422006" strokeWidth="2" />
              <path suppressHydrationWarning d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22" stroke="#422006" strokeWidth="2" />
              <path suppressHydrationWarning d="M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22" stroke="#422006" strokeWidth="2" />
            </svg>
          </button>

          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 w-32 rounded-lg shadow-lg bg-white border border-amber-800/10 p-2 z-10">
              <div 
                className={`flex items-center p-2 rounded-md cursor-pointer ${uiLanguage === 'english' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                onClick={() => selectUiLanguage('english')}
              >
                <span className="mr-2">🇬🇧</span>
                <span>{t('home.english')}</span>
              </div>
              <div 
                className={`flex items-center p-2 rounded-md cursor-pointer ${uiLanguage === 'español' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                onClick={() => selectUiLanguage('español')}
              >
                <span className="mr-2">🇪🇸</span>
                <span>{t('home.spanish')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-[#422006] text-3xl md:text-4xl font-medium text-center mb-6">
          {t('home.title')}
        </h1>
        
        <div className="w-64 h-64 relative mb-8" suppressHydrationWarning>
          <Image
            src={getNachoImage()}
            alt="Nacho the sloth"
            fill
            style={{ 
              objectFit: 'contain' 
            }}
            priority
            suppressHydrationWarning
          />
        </div>
        
        {/* Settings Section */}
        <div className="w-full max-w-md mb-6">
          {/* Proficiency Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[#422006] text-lg font-light">
                {t('home.editProficiency')}
              </h2> 
            </div>
            
            <div className="w-full h-12 rounded-xl border border-amber-200 bg-amber-50/80 p-2 flex items-center px-4">
              <div className="w-full relative">
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={difficultyLevel} 
                  onChange={(e) => setDifficultyLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#FCEAC4] rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    // Dynamically set background gradient for the track
                    background: `linear-gradient(to right, #FBBF24 ${((difficultyLevel - 1) / 4) * 100}%, #FCEAC4 ${((difficultyLevel - 1) / 4) * 100}%)`,
                  }}
                />
                {/* Custom thumb with level number */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-[#422006] border-2 border-[#FBBF24] flex items-center justify-center text-white font-medium pointer-events-none"
                  style={{
                    left: `calc(${((difficultyLevel - 1) / 4) * 100}% + ${-8 - (difficultyLevel - 1) * 4}px)`
                  }}
                >
                  {difficultyLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div className="mb-6">
            <h2 className="text-[#422006] text-lg font-light mb-1">
              {t('home.editLanguage')}
            </h2>
            
            <div className="relative w-full">
              <button 
                className="w-full h-12 rounded-xl border border-amber-200 bg-amber-50/80 px-4 flex items-center justify-between"
                onClick={toggleLanguageDropdown}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">
                    {selectedLanguage === 'english' ? '🇬🇧' : 
                     selectedLanguage === 'español' ? '🇪🇸' : 
                     selectedLanguage === 'french' ? '🇫🇷' :
                     selectedLanguage === 'portuguese' ? '🇵🇹' :
                     selectedLanguage === 'italian' ? '🇮🇹' :
                     selectedLanguage === 'german' ? '🇩🇪' :
                     selectedLanguage === 'dutch' ? '🇳🇱' :
                     selectedLanguage === 'chinese' ? '🇨🇳' :
                     selectedLanguage === 'japanese' ? '🇯🇵' :
                     selectedLanguage === 'korean' ? '🇰🇷' : '🌐'}
                  </span>
                  <span className="text-lg text-[#422006]">{selectedLanguage}</span>
                </div>
                <span className="text-amber-800 text-lg">›</span>
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute left-0 right-0 mt-2 rounded-lg shadow-lg bg-white border border-amber-800/10 p-2 z-20">
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'english' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('english')}
                  >
                    <span className="mr-2 text-xl">🇬🇧</span>
                    <span>english</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'español' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('español')}
                  >
                    <span className="mr-2 text-xl">🇪🇸</span>
                    <span>spanish</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'french' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('french')}
                  >
                    <span className="mr-2 text-xl">🇫🇷</span>
                    <span>french</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'portuguese' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('portuguese')}
                  >
                    <span className="mr-2 text-xl">🇵🇹</span>
                    <span>portuguese</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'italian' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('italian')}
                  >
                    <span className="mr-2 text-xl">🇮🇹</span>
                    <span>italian</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'german' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('german')}
                  >
                    <span className="mr-2 text-xl">🇩🇪</span>
                    <span>german</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'dutch' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('dutch')}
                  >
                    <span className="mr-2 text-xl">🇳🇱</span>
                    <span>dutch</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'chinese' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('chinese')}
                  >
                    <span className="mr-2 text-xl">🇨🇳</span>
                    <span>chinese</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'japanese' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('japanese')}
                  >
                    <span className="mr-2 text-xl">🇯🇵</span>
                    <span>japanese</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'korean' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectConversationLanguage('korean')}
                  >
                    <span className="mr-2 text-xl">🇰🇷</span>
                    <span>korean</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Begin Session Button */}
          <button
            onClick={() => handleStartSession(difficultyLevel, selectedLanguage)}
            className="w-full py-3 bg-[#422006] text-white rounded-lg flex items-center justify-center hover:bg-[#5a3108] transition-colors text-lg"
          >
            {t('home.beginSession')}
          </button>

          {/* Streak Display */}
          {user && (
            <button
              onClick={() => setShowStreakDisplay(true)}
              className="mt-4 w-full py-2 border border-amber-200 text-[#422006] rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors"
            >
              <span className="mr-2">🔥</span>
              {t('home.streak', { days: currentStreak })}
              {longestStreak > 0 && (
                <span className="ml-2 text-[#422006]/60">
                  {t('home.longestStreak', { days: longestStreak })}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Streak Display Modal */}
      {showStreakDisplay && (
        <StreakDisplay onClose={() => setShowStreakDisplay(false)} />
      )}
    </div>
  );
} 