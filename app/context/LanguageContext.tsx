'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from './LocationContext';

type Language = 'english' | 'español';

// ISO 639-1 language codes mapping
const languageCodes: Record<Language, string> = {
  'english': 'en',
  'español': 'es'
};

type TranslationKey = 
  | 'home.title'
  | 'home.editProficiency'
  | 'home.editLanguage'
  | 'home.beginSession'
  | 'home.myBookmarks'
  | 'home.logout'
  | 'home.english'
  | 'home.spanish'
  | 'auth.signInRequired'
  | 'auth.signInWithGoogle'
  | 'auth.termsAndPrivacy'
  | 'auth.failedToSignIn'
  | 'bookmarks.title'
  | 'bookmarks.all'
  | 'bookmarks.grammar'
  | 'bookmarks.vocabulary'
  | 'bookmarks.noBookmarks'
  | 'bookmarks.noGrammarBookmarks'
  | 'bookmarks.noVocabularyBookmarks'
  | 'sessionResults.title'
  | 'sessionResults.grammarCorrections'
  | 'sessionResults.vocabulary'
  | 'sessionResults.conversationSummary'
  | 'sessionResults.analyzingGrammar'
  | 'sessionResults.analyzingVocabulary'
  | 'sessionResults.noGrammarCorrections'
  | 'sessionResults.noVocabularyItems'
  | 'sessionResults.noConversation'
  | 'sessionResults.failedToAnalyze'
  | 'voiceChat.title'
  | 'voiceChat.listening'
  | 'voiceChat.connected'
  | 'voiceChat.connecting'
  | 'voiceChat.nachoSpeaking'
  | 'voiceChat.wrappingUp';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  getLanguageCode: () => string;
}

const translations: Record<Language, Record<TranslationKey, string>> = {
  english: {
    'home.title': 'the best time to learn is now.',
    'home.editProficiency': 'edit proficiency:',
    'home.editLanguage': 'edit language:',
    'home.beginSession': 'begin session',
    'home.myBookmarks': 'My Bookmarks',
    'home.logout': 'Logout',
    'home.english': 'english',
    'home.spanish': 'spanish',
    'auth.signInRequired': 'Sign In Required',
    'auth.signInWithGoogle': 'Sign in with Google',
    'auth.termsAndPrivacy': 'By signing in, you agree to our Terms of Service and Privacy Policy.',
    'auth.failedToSignIn': 'Failed to sign in with Google. Please try again.',
    'bookmarks.title': 'My Bookmarks',
    'bookmarks.all': 'All',
    'bookmarks.grammar': 'Grammar',
    'bookmarks.vocabulary': 'Vocabulary',
    'bookmarks.noBookmarks': "You don't have any bookmarks yet.",
    'bookmarks.noGrammarBookmarks': "You don't have any grammar bookmarks yet.",
    'bookmarks.noVocabularyBookmarks': "You don't have any vocabulary bookmarks yet.",
    'sessionResults.title': 'Session Results',
    'sessionResults.grammarCorrections': 'Grammar Corrections',
    'sessionResults.vocabulary': 'Vocabulary',
    'sessionResults.conversationSummary': 'Conversation Summary',
    'sessionResults.analyzingGrammar': 'Analyzing grammar...',
    'sessionResults.analyzingVocabulary': 'Analyzing vocabulary...',
    'sessionResults.noGrammarCorrections': 'No grammar corrections for this session',
    'sessionResults.noVocabularyItems': 'No vocabulary items for this session',
    'sessionResults.noConversation': 'No conversation recorded',
    'sessionResults.failedToAnalyze': 'Failed to analyze conversation. Please try again.',
    'voiceChat.title': 'Speaking Practice',
    'voiceChat.listening': 'Listening...',
    'voiceChat.connected': 'Connected and ready',
    'voiceChat.connecting': 'Connecting...',
    'voiceChat.nachoSpeaking': 'Nacho is speaking...',
    'voiceChat.wrappingUp': 'Wrapping up...',
  },
  español: {
    'home.title': 'el mejor momento para aprender es ahora.',
    'home.editProficiency': 'editar nivel:',
    'home.editLanguage': 'editar idioma:',
    'home.beginSession': 'comenzar sesión',
    'home.myBookmarks': 'Mis Marcadores',
    'home.logout': 'Cerrar Sesión',
    'home.english': 'inglés',
    'home.spanish': 'español',
    'auth.signInRequired': 'Inicio de Sesión Requerido',
    'auth.signInWithGoogle': 'Iniciar sesión con Google',
    'auth.termsAndPrivacy': 'Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.',
    'auth.failedToSignIn': 'Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.',
    'bookmarks.title': 'Mis Marcadores',
    'bookmarks.all': 'Todos',
    'bookmarks.grammar': 'Gramática',
    'bookmarks.vocabulary': 'Vocabulario',
    'bookmarks.noBookmarks': 'No tienes marcadores aún.',
    'bookmarks.noGrammarBookmarks': 'No tienes marcadores de gramática aún.',
    'bookmarks.noVocabularyBookmarks': 'No tienes marcadores de vocabulario aún.',
    'sessionResults.title': 'Resultados de la Sesión',
    'sessionResults.grammarCorrections': 'Correcciones de Gramática',
    'sessionResults.vocabulary': 'Vocabulario',
    'sessionResults.conversationSummary': 'Resumen de la Conversación',
    'sessionResults.analyzingGrammar': 'Analizando gramática...',
    'sessionResults.analyzingVocabulary': 'Analizando vocabulario...',
    'sessionResults.noGrammarCorrections': 'No hay correcciones de gramática en esta sesión',
    'sessionResults.noVocabularyItems': 'No hay vocabulario en esta sesión',
    'sessionResults.noConversation': 'No hay conversación grabada',
    'sessionResults.failedToAnalyze': 'Error al analizar la conversación. Por favor, inténtalo de nuevo.',
    'voiceChat.title': 'Práctica de Habla',
    'voiceChat.listening': 'Escuchando...',
    'voiceChat.connected': 'Conectado y listo',
    'voiceChat.connecting': 'Conectando...',
    'voiceChat.nachoSpeaking': 'Nacho está hablando...',
    'voiceChat.wrappingUp': 'Terminando...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Country to language mapping
const countryToLanguage: Record<string, Language> = {
  'ES': 'español',
  'MX': 'español',
  'AR': 'español',
  'CO': 'español',
  'PE': 'español',
  'CL': 'español',
  'VE': 'español',
  'EC': 'español',
  'GT': 'español',
  'CU': 'español',
  'DO': 'español',
  'HN': 'español',
  'PY': 'español',
  'SV': 'español',
  'NI': 'español',
  'CR': 'español',
  'PA': 'español',
  'PR': 'español',
  'UY': 'español',
  'BO': 'español',
  // Add more Spanish-speaking countries as needed
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('english');
  const { country } = useLocation();

  useEffect(() => {
    // Use the country from LocationContext to set the default language
    const defaultLanguage = countryToLanguage[country] || 'english';
    setLanguage(defaultLanguage);
  }, [country]);

  const t = (key: TranslationKey) => {
    return translations[language][key];
  };

  const getLanguageCode = () => {
    return languageCodes[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLanguageCode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 