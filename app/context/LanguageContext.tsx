'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  | 'home.dashboard'
  | 'home.logout'
  | 'home.english'
  | 'home.spanish'
  | 'home.streak'
  | 'home.longestStreak'
  | 'home.longestStreakTitle'
  | 'home.learningHistory'
  | 'home.loadingHistory'
  | 'home.noSessions'
  | 'home.sessions'
  | 'home.currentStreak'
  | 'home.days'
  | 'home.nextMilestone'
  | 'home.totalSessions'
  | 'home.less'
  | 'home.more'
  | 'home.session'
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
  | 'sessionResults.newSession'
  | 'sessionResults.grammarAndStyle'
  | 'voiceChat.title'
  | 'voiceChat.listening'
  | 'voiceChat.connected'
  | 'voiceChat.connecting'
  | 'voiceChat.nachoSpeaking'
  | 'voiceChat.wrappingUp';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  getLanguageCode: () => string;
}

const translations: Record<Language, Record<TranslationKey, string>> = {
  english: {
    'home.title': "don't put off until tomorrow what you can learn today.",
    'home.editProficiency': 'edit proficiency:',
    'home.editLanguage': 'edit language:',
    'home.beginSession': 'begin session',
    'home.myBookmarks': 'My Bookmarks',
    'home.dashboard': 'Learning Dashboard',
    'home.logout': 'Logout',
    'home.english': 'english',
    'home.spanish': 'spanish',
    'home.streak': '{days} day(s)',
    'home.longestStreak': '(Longest: {days})',
    'home.longestStreakTitle': 'Longest streak',
    'home.learningHistory': 'Learning History',
    'home.loadingHistory': 'Loading history...',
    'home.noSessions': 'No sessions recorded yet',
    'home.sessions': '{count} session{plural}',
    'home.currentStreak': 'Current Streak',
    'home.days': 'days',
    'home.nextMilestone': 'Next Milestone',
    'home.totalSessions': 'total sessions',
    'home.less': 'Less',
    'home.more': 'More',
    'home.session': 'session',
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
    'sessionResults.newSession': 'New Session',
    'sessionResults.grammarAndStyle': 'Grammar and Style',
    'voiceChat.title': 'Speaking Practice',
    'voiceChat.listening': 'Listening...',
    'voiceChat.connected': 'Connected and ready',
    'voiceChat.connecting': 'Connecting...',
    'voiceChat.nachoSpeaking': 'Nacho is speaking...',
    'voiceChat.wrappingUp': 'Wrapping up...',
  },
  español: {
    'home.title': 'no dejes para mañana lo que puedes aprender hoy.',
    'home.editProficiency': 'editar nivel:',
    'home.editLanguage': 'editar idioma:',
    'home.beginSession': 'comenzar sesión',
    'home.myBookmarks': 'Mis Marcadores',
    'home.dashboard': 'Panel de Aprendizaje',
    'home.logout': 'Cerrar Sesión',
    'home.english': 'inglés',
    'home.spanish': 'español',
    'home.streak': '{days} día(s)',
    'home.longestStreak': '(Más largo: {days})',
    'home.longestStreakTitle': 'Racha más larga',
    'home.learningHistory': 'Historial de Aprendizaje',
    'home.loadingHistory': 'Cargando historial...',
    'home.noSessions': 'Aún no hay sesiones registradas',
    'home.sessions': '{count} sesión{plural}',
    'home.currentStreak': 'Racha Actual',
    'home.days': 'días',
    'home.nextMilestone': 'Próximo Hito',
    'home.totalSessions': 'sesiones totales',
    'home.less': 'Menos',
    'home.more': 'Más',
    'home.session': 'sesión',
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
    'sessionResults.newSession': 'Nueva Sesión',
    'sessionResults.grammarAndStyle': 'Gramática y Estilo',
    'voiceChat.title': 'Práctica de Habla',
    'voiceChat.listening': 'Escuchando...',
    'voiceChat.connected': 'Conectado y listo',
    'voiceChat.connecting': 'Conectando...',
    'voiceChat.nachoSpeaking': 'Nacho está hablando...',
    'voiceChat.wrappingUp': 'Terminando...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('english');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage for explicit user choice
      const storedLang = localStorage.getItem('uiLanguage');
      if (storedLang === 'english' || storedLang === 'español') {
        setLanguage(storedLang);
        return;
      }
      // Detect browser language if not set
      const browserLang = navigator.language.toLowerCase();
      const defaultLanguage = browserLang.startsWith('es') ? 'español' : 'english';
      setLanguage(defaultLanguage);
    }
  }, []);

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    let text = translations[language][key];
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{${key}}`, String(value));
      });
    }
    return text;
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