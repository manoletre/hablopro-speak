'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface HomeScreenProps {
  onStartSession: (level: number, language: string) => void;
}

export default function HomeScreen({ onStartSession }: HomeScreenProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('french');
  const [difficultyLevel, setDifficultyLevel] = useState(1); // Default level is 1
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // No functionality for sidebar and config buttons for now
  const handleSidebarClick = () => {
    // Will be implemented later
  };

  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
  };

  const selectLanguage = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageMenu(false);
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

  return (
    <div className="w-full h-screen bg-[#fffaed] font-poppins flex flex-col" suppressHydrationWarning>
      {/* Top Bar */}
      <div className="w-full p-4 flex justify-between items-center">
        {/* Sidebar Button (Left) */}
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
                className={`flex items-center p-2 rounded-md cursor-pointer ${selectedLanguage === 'english' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                onClick={() => selectLanguage('english')}
              >
                <span className="mr-2">🇬🇧</span>
                <span>english</span>
              </div>
              <div 
                className={`flex items-center p-2 rounded-md cursor-pointer ${selectedLanguage === 'español' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                onClick={() => selectLanguage('español')}
              >
                <span className="mr-2">🇪🇸</span>
                <span>español</span>
              </div>
              <div 
                className={`flex items-center p-2 rounded-md cursor-pointer ${selectedLanguage === 'french' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                onClick={() => selectLanguage('french')}
              >
                <span className="mr-2">🇫🇷</span>
                <span>french</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-[#422006] text-3xl md:text-4xl font-medium text-center mb-6">
          the best time to learn is now.
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
                edit proficiency:
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
          <div className="mb-4">
            <h2 className="text-[#422006] text-lg font-light mb-1">
              edit language:
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
                    onClick={() => selectLanguage('english')}
                  >
                    <span className="mr-2 text-xl">🇬🇧</span>
                    <span>english</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'español' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('español')}
                  >
                    <span className="mr-2 text-xl">🇪🇸</span>
                    <span>español</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'french' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('french')}
                  >
                    <span className="mr-2 text-xl">🇫🇷</span>
                    <span>french</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'portuguese' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('portuguese')}
                  >
                    <span className="mr-2 text-xl">🇵🇹</span>
                    <span>portuguese</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'italian' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('italian')}
                  >
                    <span className="mr-2 text-xl">🇮🇹</span>
                    <span>italian</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'german' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('german')}
                  >
                    <span className="mr-2 text-xl">🇩🇪</span>
                    <span>german</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'dutch' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('dutch')}
                  >
                    <span className="mr-2 text-xl">🇳🇱</span>
                    <span>dutch</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'chinese' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('chinese')}
                  >
                    <span className="mr-2 text-xl">🇨🇳</span>
                    <span>chinese</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'japanese' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('japanese')}
                  >
                    <span className="mr-2 text-xl">🇯🇵</span>
                    <span>japanese</span>
                  </div>
                  <div 
                    className={`flex items-center p-3 rounded-md cursor-pointer ${selectedLanguage === 'korean' ? 'bg-amber-50' : 'hover:bg-amber-50'}`}
                    onClick={() => selectLanguage('korean')}
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
            onClick={() => onStartSession(difficultyLevel, selectedLanguage)}
            className="w-full h-12 bg-[#422006] text-white rounded-xl text-lg font-medium"
          >
            begin session
          </button>
        </div>
      </div>
    </div>
  );
} 