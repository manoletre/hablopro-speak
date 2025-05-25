'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

type Language = 'english' | 'español';

// ISO 639-1 language codes mapping
const languageCodes: Record<Language, string> = {
  'english': 'en',
  'español': 'es'
};

type TranslationKey = 
  | 'home.title'
  | 'home.editProficiency'
  | 'home.difficultyTooltip'
  | 'home.editLanguage'
  | 'home.beginSession'
  | 'home.doSessionNow'
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
  | 'sessionResults.streakCongrats'
  | 'sessionResults.streakImage'
  | 'sessionResults.dayStreak'
  | 'sessionResults.keepPracticing'
  | 'sessionResults.awesome'
  | 'sessionResults.loadingMessage1'
  | 'sessionResults.loadingMessage2'
  | 'sessionResults.loadingMessage3'
  | 'sessionResults.loadingMessage4'
  | 'sessionResults.loadingMessage5'
  | 'sessionResults.loadingMessage6'
  | 'sessionResults.loadingMessage7'
  | 'sessionResults.loadingMessage8'
  | 'sessionResults.loadingMessage9'
  | 'sessionResults.loadingMessage10'
  | 'voiceChat.title'
  | 'voiceChat.listening'
  | 'voiceChat.connected'
  | 'voiceChat.connecting'
  | 'voiceChat.nachoSpeaking'
  | 'voiceChat.wrappingUp'
  | 'voiceChat.pressWord'
  | 'voiceChat.translating'
  | 'voiceChat.canSpeak'
  | 'voiceChat.canSpeakNative'
  | 'home.lostStreak';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  getLanguageCode: () => string;
}

const translations: Record<Language, Record<TranslationKey, string>> = {
  english: {
    'home.title': "learn by speaking.",
    'home.editProficiency': 'choose the difficulty level:',
    'home.difficultyTooltip': 'This controls how complex Nacho\'s language will be.',
    'home.editLanguage': 'choose the language you want to speak:',
    'home.beginSession': 'begin session',
    'home.doSessionNow': 'do a session now',
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
    'sessionResults.streakCongrats': 'Congratulations!',
    'sessionResults.streakImage': 'Streak celebration image',
    'sessionResults.dayStreak': '{count} Day Streak!',
    'sessionResults.keepPracticing': 'Keep practicing to maintain your streak!',
    'sessionResults.awesome': 'Awesome!',
    'sessionResults.analyzingVocabulary': 'Analyzing vocabulary...',
    'sessionResults.noGrammarCorrections': 'No grammar corrections for this session',
    'sessionResults.noVocabularyItems': 'No vocabulary items for this session',
    'sessionResults.noConversation': 'No conversation recorded',
    'sessionResults.failedToAnalyze': 'Failed to analyze conversation. Please try again.',
    'sessionResults.newSession': 'New Session',
    'sessionResults.grammarAndStyle': 'Grammar and Style',
    'sessionResults.loadingMessage1': 'Scanning for grammatical gremlins and vocab villains…',
    'sessionResults.loadingMessage2': 'Polishing your phrases for peak precision…',
    'sessionResults.loadingMessage3': 'Hunting down tricky word choices—suggestions loading!',
    'sessionResults.loadingMessage4': 'Inspecting syntax for sneaky slip-ups…',
    'sessionResults.loadingMessage5': 'Line-by-line proofread in progress—grammar tips ahead!',
    'sessionResults.loadingMessage6': 'Matching your words with perfect phrasing…',
    'sessionResults.loadingMessage7': 'Nacho\'s AI neurons are debugging your dialogue…',
    'sessionResults.loadingMessage8': 'Sharpening your vocab and tightening your tenses…',
    'sessionResults.loadingMessage9': 'Examining for typos, tense traps, and better word fits…',
    'sessionResults.loadingMessage10': 'Almost ready—green-lighting your next flawless sentence!',
    'voiceChat.title': 'Speaking Practice',
    'voiceChat.listening': 'Listening...',
    'voiceChat.connected': 'Connected and ready',
    'voiceChat.connecting': 'Connecting...',
    'voiceChat.nachoSpeaking': 'Nacho is speaking...',
    'voiceChat.wrappingUp': 'Wrapping up...',
    'voiceChat.pressWord': 'Press a word to view its meaning',
    'voiceChat.translating': 'Nacho is translating',
    'voiceChat.canSpeak': 'I\'m listening - you can speak!',
    'voiceChat.canSpeakNative': 'You can also speak in english - I understand!',
    'home.lostStreak': 'you lost your streak',
  },
  español: {
    'home.title': 'aprende hablando.',
    'home.editProficiency': 'elige el nivel de dificultad:',
    'home.difficultyTooltip': 'Esto controla la complejidad del idioma que Nacho te hablará.',
    'home.editLanguage': 'elige el idioma que quieres hablar:',
    'home.beginSession': 'comenzar sesión',
    'home.doSessionNow': 'comenzar sesión ahora',
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
    'sessionResults.streakCongrats': '¡Felicitaciones!',
    'sessionResults.streakImage': 'Imagen de celebración de racha',
    'sessionResults.dayStreak': '¡Racha de {count} días!',
    'sessionResults.keepPracticing': '¡Sigue practicando para mantener tu racha!',
    'sessionResults.awesome': '¡Genial!',
    'sessionResults.loadingMessage1': 'Escaneando duendes gramaticales y villanos de vocabulario…',
    'sessionResults.loadingMessage2': 'Puliendo tus frases para máxima precisión…',
    'sessionResults.loadingMessage3': 'Cazando elecciones de palabras complicadas—¡sugerencias cargando!',
    'sessionResults.loadingMessage4': 'Inspeccionando sintaxis para deslices astutos…',
    'sessionResults.loadingMessage5': 'Revisión línea por línea en progreso—¡consejos gramaticales en camino!',
    'sessionResults.loadingMessage6': 'Emparejando tus palabras con fraseo perfecto…',
    'sessionResults.loadingMessage7': 'Las neuronas de IA de Nacho están depurando tu diálogo…',
    'sessionResults.loadingMessage8': 'Afilando tu vocabulario y ajustando tus tiempos verbales…',
    'sessionResults.loadingMessage9': 'Examinando errores tipográficos, trampas de tiempo y mejores opciones de palabras…',
    'sessionResults.loadingMessage10': '¡Casi listo—dando luz verde a tu próxima oración perfecta!',
    'voiceChat.title': 'Práctica de Habla',
    'voiceChat.listening': 'Escuchando...',
    'voiceChat.connected': 'Conectado y listo',
    'voiceChat.connecting': 'Conectando...',
    'voiceChat.nachoSpeaking': 'Nacho está hablando...',
    'voiceChat.wrappingUp': 'Analizando...',
    'voiceChat.pressWord': 'presiona una palabra para ver su significado',
    'voiceChat.translating': 'Nacho está traduciendo',
    'voiceChat.canSpeak': 'Te escucho - ¡puedes hablar!',
    'voiceChat.canSpeakNative': '¡También puedes hablar en español - te entiendo!',
    'home.lostStreak': 'perdiste tu racha',
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

  const getLanguageCode = useCallback(() => {
    return languageCodes[language];
  }, [language]);

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