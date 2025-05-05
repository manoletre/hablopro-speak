'use client';

import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';

export default function LocationDisplay() {
  const { country } = useLocation();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="p-4 bg-white shadow rounded-md">
      <h2 className="text-xl font-semibold mb-2">Location Information</h2>
      <p className="mb-2">
        <span className="font-medium">Detected Country:</span> {country}
      </p>
      <p className="mb-2">
        <span className="font-medium">Current Language:</span> {language}
      </p>
      <div className="mt-4">
        <p className="font-medium mb-2">Change Language:</p>
        <div className="flex space-x-2">
          <button 
            onClick={() => setLanguage('english')} 
            className={`px-3 py-1 rounded ${language === 'english' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            English
          </button>
          <button 
            onClick={() => setLanguage('español')} 
            className={`px-3 py-1 rounded ${language === 'español' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Español
          </button>
        </div>
      </div>
    </div>
  );
} 