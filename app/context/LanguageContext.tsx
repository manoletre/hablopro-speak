'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

type Language = 'english' | 'español';

// ISO 639-1 language codes mapping
const languageCodes: Record<Language, string> = {
  'english': 'en',
  'español': 'es'
};

export type TranslationKey = 
  | 'home.title'
  | 'home.editProficiency'
  | 'home.difficultyTooltip'
  | 'home.editLanguage'
  | 'home.beginSession'
  | 'home.doSessionNow'
  | 'home.myBookmarks'
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
  | 'auth.bySigningUp'
  | 'auth.youAgreeToOur'
  | 'auth.and'
  | 'auth.termsOfService'
  | 'auth.privacyPolicy'
  | 'auth.refundPolicy'
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
  | 'sessionResults.keyTakeaway'
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
  | 'sessionResults.reviewTitle'
  | 'sessionResults.reviewDescription'
  | 'sessionResults.youSaid'
  | 'sessionResults.better'
  | 'sessionResults.why'
  | 'sessionResults.youLookedThisUp'
  | 'sessionResults.fromContext'
  | 'sessionResults.wordYouLookedUp'
  | 'vocabularyCard.definition'
  | 'vocabularyCard.example'
  | 'grammarCard.grammarSuggestion'
  | 'grammarCard.youSaid'
  | 'grammarCard.better'
  | 'grammarCard.why'
  | 'voiceChat.stop'
  | 'voiceChat.title'
  | 'voiceChat.listening'
  | 'voiceChat.connected'
  | 'voiceChat.connecting'
  | 'voiceChat.nachoSpeaking'
  | 'voiceChat.wrappingUp'
  | 'voiceChat.pressWord'
  | 'voiceChat.translating'
  | 'voiceChat.gettingDefinition'
  | 'voiceChat.canSpeak'
  | 'voiceChat.canSpeakNative'
  | 'home.lostStreak'
  | 'billing.speakingTime'
  | 'billing.monthly'
  | 'billing.annual'
  | 'billing.outOfTime'
  | 'billing.runningLow'
  | 'billing.getMoreTime'
  | 'billing.getMoreMins'
  | 'billing.upgradePlan'
  | 'billing.managePlan'
  | 'billing.renews'
  | 'billing.of'
  | 'home.onlyMinsLeft'
  | 'home.getMoreMins'
  | 'upgrade.title'
  | 'upgrade.description'
  | 'upgrade.subscriptionPlans'
  | 'upgrade.activeSubscription'
  | 'upgrade.popular'
  | 'upgrade.regularLearners'
  | 'upgrade.perMonth'
  | 'upgrade.minutes'
  | 'upgrade.subscribe'
  | 'upgrade.processing'
  | 'upgrade.alreadySubscribed'
  | 'upgrade.bestValue'
  | 'upgrade.committedLearners'
  | 'upgrade.saveVsMonthly'
  | 'upgrade.perYear'
  | 'upgrade.orPayOnce'
  | 'upgrade.occasionalUse'
  | 'upgrade.speakingTime'
  | 'upgrade.buyNow'
  | 'upgrade.creditsNeverExpire'
  | 'upgrade.useAcrossLanguages'
  | 'upgrade.cancelAnytime'
  | 'upgrade.paddleDisclaimer'
  | 'upgrade.payAsYouGo'
  | 'upgrade.monthlySubscription'
  | 'upgrade.annualSubscription'
  | 'upgrade.perMonthText'
  | 'upgrade.perYearText'
  | 'upgradeSuccess.title'
  | 'upgradeSuccess.description'
  | 'upgradeSuccess.currentBalance'
  | 'upgradeSuccess.minutes'
  | 'upgradeSuccess.startLearning'
  | 'upgrade.subscriptionToggle'
  | 'upgrade.onetimeToggle'
  | 'upgrade.planColumn'
  | 'upgrade.priceColumn'
  | 'upgrade.minutesColumn'
  | 'upgrade.costPerMinColumn'
  | 'upgrade.actionColumn'
  | 'upgrade.annual'
  | 'upgrade.monthly'
  | 'upgrade.onetime'
  | 'upgrade.twoMonthsFree'
  | 'upgrade.minutesRollover'
  | 'upgrade.save33Percent'
  | 'upgrade.subscribed'
  | 'upgrade.footerSavings'
  | 'upgrade.customPlanOffer'
  | 'upgrade.rolloverFootnote'
  | 'upgrade.savingsFootnote'
  | 'upgrade.paddlePayments'
  | 'getMoreMins.title'
  | 'getMoreMins.descriptionAnnual'
  | 'getMoreMins.descriptionMonthly'
  | 'getMoreMins.addExtraMinutes'
  | 'getMoreMins.minutesAdded'
  | 'getMoreMins.addedInstantly'
  | 'getMoreMins.useAlongside';

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
    'auth.bySigningUp': 'By signing up, you agree to our',
    'auth.youAgreeToOur': 'you agree to our',
    'auth.and': 'and',
    'auth.termsOfService': 'Terms of Service',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.refundPolicy': 'Refund Policy',
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
    'sessionResults.keyTakeaway': 'Key Takeaway',
    'sessionResults.streakCongrats': 'Congratulations!',
    'sessionResults.streakImage': 'Streak celebration image',
    'sessionResults.dayStreak': '{count} Day Streak!',
    'sessionResults.keepPracticing': 'Keep practicing to maintain your streak!',
    'sessionResults.awesome': 'Awesome!',
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
    'sessionResults.reviewTitle': 'A review of your conversation',
    'sessionResults.reviewDescription': 'Here\'s what we learned together and where you can improve',
    'sessionResults.youSaid': 'You said: ',
    'sessionResults.better': 'Better: ',
    'sessionResults.why': 'Why',
    'sessionResults.youLookedThisUp': 'You looked this up',
    'sessionResults.fromContext': 'From context: ',
    'sessionResults.wordYouLookedUp': 'You looked this up',
    'vocabularyCard.definition': 'Definition: ',
    'vocabularyCard.example': 'Example: ',
    'grammarCard.grammarSuggestion': 'Grammar Suggestion',
    'grammarCard.youSaid': 'You said: ',
    'grammarCard.better': 'Better: ',
    'grammarCard.why': 'Why?',
    'voiceChat.stop': 'Stop Session',
    'voiceChat.title': 'Speaking Practice',
    'voiceChat.listening': 'Listening...',
    'voiceChat.connected': 'Connected and ready',
    'voiceChat.connecting': 'Connecting...',
    'voiceChat.nachoSpeaking': 'Nacho is speaking...',
    'voiceChat.wrappingUp': 'Wrapping up...',
    'voiceChat.pressWord': 'Press a word to view its meaning',
    'voiceChat.translating': 'Nacho is translating',
    'voiceChat.gettingDefinition': 'Getting definition...',
    'voiceChat.canSpeak': 'I\'m listening - you can speak!',
    'voiceChat.canSpeakNative': 'You can also speak in english - I understand!',
    'home.lostStreak': 'you lost your streak',
    'billing.speakingTime': 'Speaking Time',
    'billing.monthly': 'Monthly',
    'billing.annual': 'Annual',
    'billing.outOfTime': 'You\'ve used all your speaking time. Upgrade to continue!',
    'billing.runningLow': 'Running low on speaking time. Consider upgrading.',
    'billing.getMoreTime': 'Get More Time',
    'billing.getMoreMins': 'Get More Mins',
    'billing.upgradePlan': 'Upgrade Plan',
    'billing.managePlan': 'Manage Plan',
    'billing.renews': 'Renews {date}',
    'billing.of': 'of',
    'home.onlyMinsLeft': 'only {mins} mins left.',
    'home.getMoreMins': 'get more mins',
    'upgrade.title': 'Upgrade Your Plan',
    'upgrade.description': 'You have {minutes} minutes remaining. Choose a plan to get more speaking time.',
    'upgrade.subscriptionPlans': 'Subscription Plans',
    'upgrade.activeSubscription': '(You have an active subscription)',
    'upgrade.popular': 'Popular',
    'upgrade.regularLearners': 'Great for regular learners',
    'upgrade.perMonth': '/month',
    'upgrade.minutes': 'minutes',
    'upgrade.subscribe': 'Subscribe',
    'upgrade.processing': 'Processing...',
    'upgrade.alreadySubscribed': 'Already Subscribed',
    'upgrade.bestValue': 'Best Value',
    'upgrade.committedLearners': 'Best value for committed learners',
    'upgrade.saveVsMonthly': 'Save {amount} vs monthly',
    'upgrade.perYear': '/year',
    'upgrade.orPayOnce': 'or pay only once:',
    'upgrade.occasionalUse': 'Perfect for occasional use',
    'upgrade.speakingTime': 'of speaking time',
    'upgrade.buyNow': 'Buy Now',
    'upgrade.creditsNeverExpire': '✓ Credits never expire',
    'upgrade.useAcrossLanguages': '✓ Use across all languages and difficulty levels',
    'upgrade.cancelAnytime': '✓ Cancel subscription anytime',
    'upgrade.paddleDisclaimer': 'Payments are processed securely by Paddle. The checkout will open as an overlay.',
    'upgrade.payAsYouGo': 'Pay as you go',
    'upgrade.monthlySubscription': 'Monthly Subscription',
    'upgrade.annualSubscription': 'Annual Subscription',
    'upgrade.perMonthText': 'per month',
    'upgrade.perYearText': 'per year',
    'upgradeSuccess.title': 'Upgrade Successful!',
    'upgradeSuccess.description': 'You now have {minutes} minutes in your account.',
    'upgradeSuccess.currentBalance': 'Current Balance',
    'upgradeSuccess.minutes': 'minutes',
    'upgradeSuccess.startLearning': 'Start Learning',
    'upgrade.subscriptionToggle': 'Subscription',
    'upgrade.onetimeToggle': 'One-time',
    'upgrade.planColumn': 'Plan',
    'upgrade.priceColumn': 'Price',
    'upgrade.minutesColumn': 'Minutes',
    'upgrade.costPerMinColumn': 'Cost/min',
    'upgrade.actionColumn': 'Action',
    'upgrade.annual': 'Annual',
    'upgrade.monthly': 'Monthly',
    'upgrade.onetime': 'One-time',
    'upgrade.twoMonthsFree': '2 months free',
    'upgrade.minutesRollover': 'minutes roll over¹',
    'upgrade.save33Percent': 'SAVE 33%',
    'upgrade.subscribed': 'Subscribed',
    'upgrade.footerSavings': 'Save 33% with the annual plan • Minutes never expire while subscribed',
    'upgrade.customPlanOffer': 'Need more than 3,000 mins a year? Drop us a line for a custom plan.',
    'upgrade.rolloverFootnote': '¹ Unused minutes from monthly subscriptions roll over to the next month',
    'upgrade.savingsFootnote': '² Annual plan saves 33% vs monthly ($0.04/min vs $0.06/min) and 50% vs one-time ($0.04/min vs $0.08/min)',
    'upgrade.paddlePayments': 'Payments processed securely by Paddle',
    'getMoreMins.title': 'Get More Minutes',
    'getMoreMins.descriptionAnnual': 'Add more minutes to your existing annual subscription.',
    'getMoreMins.descriptionMonthly': 'Add more minutes to your existing monthly subscription.',
    'getMoreMins.addExtraMinutes': 'Add extra minutes to your account',
    'getMoreMins.minutesAdded': '{count} minutes added to your account',
    'getMoreMins.addedInstantly': 'Added instantly',
    'getMoreMins.useAlongside': 'Use alongside your subscription',
  },
  español: {
    'home.title': 'aprende hablando.',
    'home.editProficiency': 'elige el nivel de dificultad:',
    'home.difficultyTooltip': 'Esto controla la complejidad del idioma que Nacho te hablará.',
    'home.editLanguage': 'elige el idioma que quieres hablar:',
    'home.beginSession': 'comenzar sesión',
    'home.doSessionNow': 'comenzar sesión ahora',
    'home.myBookmarks': 'Mis Marcadores',
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
    'auth.bySigningUp': 'Al registrarte, aceptas nuestros',
    'auth.youAgreeToOur': 'aceptas nuestros',
    'auth.and': 'y',
    'auth.termsOfService': 'Términos de Servicio',
    'auth.privacyPolicy': 'Política de Privacidad',
    'auth.refundPolicy': 'Política de Reembolso',
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
    'sessionResults.keyTakeaway': 'Punto Clave',
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
    'sessionResults.reviewTitle': 'Una revisión de tu conversación',
    'sessionResults.reviewDescription': 'Aquí está lo que aprendimos juntos y donde puedes mejorar',
    'sessionResults.youSaid': 'Dijiste: ',
    'sessionResults.better': 'Mejor: ',
    'sessionResults.why': 'Por qué',
    'sessionResults.youLookedThisUp': 'Buscaste esto',
    'sessionResults.fromContext': 'Del contexto: ',
    'sessionResults.wordYouLookedUp': 'Buscaste esto',
    'vocabularyCard.definition': 'Definición: ',
    'vocabularyCard.example': 'Ejemplo: ',
    'grammarCard.grammarSuggestion': 'Sugerencia de Gramática',
    'grammarCard.youSaid': 'Dijiste: ',
    'grammarCard.better': 'Mejor: ',
    'grammarCard.why': '¿Por qué?',
    'voiceChat.stop': 'Detener Sesión',
    'voiceChat.title': 'Práctica de Habla',
    'voiceChat.listening': 'Escuchando...',
    'voiceChat.connected': 'Conectado y listo',
    'voiceChat.connecting': 'Conectando...',
    'voiceChat.nachoSpeaking': 'Nacho está hablando...',
    'voiceChat.wrappingUp': 'Analizando...',
    'voiceChat.pressWord': 'presiona una palabra para ver su significado',
    'voiceChat.translating': 'Nacho está traduciendo',
    'voiceChat.gettingDefinition': 'Obteniendo definición...',
    'voiceChat.canSpeak': 'Te escucho - ¡puedes hablar!',
    'voiceChat.canSpeakNative': '¡También puedes hablar en español - te entiendo!',
    'home.lostStreak': 'perdiste tu racha',
    'billing.speakingTime': 'Tiempo de Conversación',
    'billing.monthly': 'Mensual',
    'billing.annual': 'Anual',
    'billing.outOfTime': '¡Has usado todo tu tiempo de conversación. ¡Actualiza para continuar!',
    'billing.runningLow': 'Te queda poco tiempo de conversación. Considera actualizar.',
    'billing.getMoreTime': 'Obtener Más Tiempo',
    'billing.getMoreMins': 'Obtener Más Mins',
    'billing.upgradePlan': 'Actualizar Plan',
    'billing.managePlan': 'Administrar Plan',
    'billing.renews': 'Se renueva {date}',
    'billing.of': 'de',
    'home.onlyMinsLeft': 'solo {mins} mins restantes.',
    'home.getMoreMins': 'obtener más mins',
    'upgrade.title': 'Actualiza Tu Plan',
    'upgrade.description': 'Te quedan {minutes} minutos. Elige un plan para obtener más tiempo de conversación.',
    'upgrade.subscriptionPlans': 'Planes de Suscripción',
    'upgrade.activeSubscription': '(Tienes una suscripción activa)',
    'upgrade.popular': 'Popular',
    'upgrade.regularLearners': 'Ideal para estudiantes regulares',
    'upgrade.perMonth': '/mes',
    'upgrade.minutes': 'minutos',
    'upgrade.subscribe': 'Suscribirse',
    'upgrade.processing': 'Procesando...',
    'upgrade.alreadySubscribed': 'Ya Suscrito',
    'upgrade.bestValue': 'Mejor Valor',
    'upgrade.committedLearners': 'El mejor valor para estudiantes comprometidos',
    'upgrade.saveVsMonthly': 'Ahorra {amount} vs mensual',
    'upgrade.perYear': '/año',
    'upgrade.orPayOnce': 'o paga solo una vez:',
    'upgrade.occasionalUse': 'Perfecto para uso ocasional',
    'upgrade.speakingTime': 'de tiempo de conversación',
    'upgrade.buyNow': 'Comprar Ahora',
    'upgrade.creditsNeverExpire': '✓ Los créditos nunca expiran',
    'upgrade.useAcrossLanguages': '✓ Úsalos en todos los idiomas y niveles de dificultad',
    'upgrade.cancelAnytime': '✓ Cancela la suscripción en cualquier momento',
    'upgrade.paddleDisclaimer': 'Los pagos son procesados de forma segura por Paddle. El checkout se abrirá como una ventana superpuesta.',
    'upgrade.payAsYouGo': 'Pago por uso',
    'upgrade.monthlySubscription': 'Suscripción Mensual',
    'upgrade.annualSubscription': 'Suscripción Anual',
    'upgrade.perMonthText': 'por mes',
    'upgrade.perYearText': 'por año',
    'upgradeSuccess.title': '¡Actualización Exitosa!',
    'upgradeSuccess.description': 'Ahora tienes {minutes} minutos en tu cuenta.',
    'upgradeSuccess.currentBalance': 'Saldo Actual',
    'upgradeSuccess.minutes': 'minutos',
    'upgradeSuccess.startLearning': 'Comenzar a Aprender',
    'upgrade.subscriptionToggle': 'Suscripción',
    'upgrade.onetimeToggle': 'Una vez',
    'upgrade.planColumn': 'Plan',
    'upgrade.priceColumn': 'Precio',
    'upgrade.minutesColumn': 'Minutos',
    'upgrade.costPerMinColumn': 'Costo/min',
    'upgrade.actionColumn': 'Acción',
    'upgrade.annual': 'Anual',
    'upgrade.monthly': 'Mensual',
    'upgrade.onetime': 'Una vez',
    'upgrade.twoMonthsFree': '2 meses gratis',
    'upgrade.minutesRollover': 'minutos se acumulan¹',
    'upgrade.save33Percent': 'AHORRA 33%',
    'upgrade.subscribed': 'Suscrito',
    'upgrade.footerSavings': 'Ahorra 33% con el plan anual • Los minutos nunca expiran mientras estés suscrito',
    'upgrade.customPlanOffer': '¿Necesitas más de 3,000 mins al año? Contáctanos para un plan personalizado.',
    'upgrade.rolloverFootnote': '¹ Los minutos no utilizados de las suscripciones mensuales se acumulan al mes siguiente',
    'upgrade.savingsFootnote': '² El plan anual ahorra 33% vs mensual ($0.04/min vs $0.06/min) y 50% vs una vez ($0.04/min vs $0.08/min)',
    'upgrade.paddlePayments': 'Pagos procesados de forma segura por Paddle',
    'getMoreMins.title': 'Obtener Más Minutos',
    'getMoreMins.descriptionAnnual': 'Agrega más minutos a tu suscripción anual existente.',
    'getMoreMins.descriptionMonthly': 'Agrega más minutos a tu suscripción mensual existente.',
    'getMoreMins.addExtraMinutes': 'Agrega minutos extra a tu cuenta',
    'getMoreMins.minutesAdded': '{count} minutos agregados a tu cuenta',
    'getMoreMins.addedInstantly': 'Agregados instantáneamente',
    'getMoreMins.useAlongside': 'Usa junto a tu suscripción',
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