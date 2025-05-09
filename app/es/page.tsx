'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import LanguageTypingAnimation from '../components/LanguageTypingAnimation';
import { useLanguage } from '../context/LanguageContext';
import Head from 'next/head';

// Add structured data for rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HabloPro Speak - Tutor de Idiomas con IA',
  description: 'Practica hablando con Nacho, tu tutor personal de idiomas con IA. Mejora tu español, inglés, francés, alemán, chino, japonés y más con conversaciones naturales y retroalimentación personalizada.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  keywords: 'tutor de idiomas con IA, tutor de español con IA, tutor de inglés con IA, tutor de francés con IA, tutor de alemán con IA, tutor de chino con IA, tutor de japonés con IA, app para aprender idiomas, práctica de conversación',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1000',
  },
};

export default function LandingPage() {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();

  // Spanish language list for animation
  const spanishLanguages = [
    { name: 'español', emoji: '🇪🇸', code: 'es' },
    { name: 'inglés', emoji: '🇬🇧', code: 'gb' },
    { name: 'francés', emoji: '🇫🇷', code: 'fr' },
    { name: 'italiano', emoji: '🇮🇹', code: 'it' },
    { name: 'alemán', emoji: '🇩🇪', code: 'de' },
    { name: 'portugués', emoji: '🇵🇹', code: 'pt' },
    { name: 'chino', emoji: '🇨🇳', code: 'cn' },
    { name: 'japonés', emoji: '🇯🇵', code: 'jp' },
    { name: 'coreano', emoji: '🇰🇷', code: 'kr' },
    { name: 'holandés', emoji: '🇳🇱', code: 'nl' },
  ];

  return (
    <>
      <Head>
        <title>HabloPro Speak | Tutor de Idiomas con IA para Español, Inglés, Francés y Más</title>
        <meta name="description" content="Practica hablando con Nacho, tu tutor personal de idiomas con IA. Aprende español, inglés, francés, alemán, chino, japonés y más con conversaciones naturales y retroalimentación inmediata." />
        <meta name="keywords" content="tutor de idiomas con IA, tutor de español con IA, tutor de inglés con IA, tutor de francés con IA, tutor de alemán con IA, tutor de chino con IA, app para aprender idiomas, práctica de conversación" />
        <meta property="og:title" content="HabloPro Speak - Tutor de Idiomas con IA para Español, Inglés y Más" />
        <meta property="og:description" content="Practica hablando con Nacho, tu tutor personal de idiomas con IA. Mejora tu fluidez, vocabulario y confianza en cualquier idioma." />
        <meta property="og:image" content="https://hablo.pro/images/landing_screenshot_es.png" />
        <meta property="og:url" content="https://hablo.pro/es" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HabloPro Speak - Tutor de Idiomas con IA para Español, Inglés y Más" />
        <meta name="twitter:description" content="Practica hablando con Nacho, tu tutor personal de idiomas con IA. Mejora tu fluidez, vocabulario y confianza en cualquier idioma." />
        <meta name="twitter:image" content="https://hablo.pro/images/landing_screenshot_es.png" />
      </Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white font-poppins">
        {/* Language Switch */}
        <div className="w-full bg-amber-100 py-2">
          <div className="max-w-6xl mx-auto px-4">
            <Link href="/" className="text-amber-800 hover:text-amber-900">
              I speak English
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 flex flex-col items-start">
                <span>Habla</span>
                <LanguageTypingAnimation languages={spanishLanguages} />
                <span>con tu tutor de IA.</span>
              </h1>
              <p className="text-lg md:text-xl text-amber-800 mb-8">
                Practica hablando con Nacho, tu tutor personal de idiomas de IA. Mejora tu <span className="notebook-underline font-bold">fluidez</span>, <span className="notebook-underline font-bold">vocabulario</span>, y <span className="notebook-underline font-bold">confianza</span> en español, inglés, francés y muchos más idiomas.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/learn"
                  className="px-8 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-lg text-center"
                  onClick={() => {
                    localStorage.setItem('uiLanguage', 'español');
                    setLanguage('español');
                  }}
                >
                  {user ? 'Continuar Aprendiendo' : 'Comenzar Gratis'}
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 w-full md:pl-12 relative">
              <div className="w-full h-[250px] md:h-[500px] relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 opacity-60 rounded-full blur-2xl w-[200px] h-[200px] md:w-[400px] md:h-[400px]"></div>
                <Image
                  src="/images/nacho_intro.png"
                  alt="Nacho, tu tutor de idiomas con IA para español, inglés y otros idiomas"
                  width={500}
                  height={500}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ objectFit: 'contain' }}
                  priority
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 px-4 bg-amber-100 mt-0 md:mt-[-95px]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-16">
              Tu tutor personal de IA para cualquier idioma
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_speaking.png" 
                    alt="Tutor de IA para práctica de conversación en idiomas" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Practica Hablando</h3>
                <p className="text-amber-800">
                Mantén <span className="font-semibold">conversaciones reales</span> con tu tutor de IA en español, inglés, francés o cualquier idioma objetivo. <span className="font-semibold">Lee, escucha y habla</span> en conversaciones naturales.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_multiple_langs.png" 
                    alt="Tutor de IA para múltiples idiomas incluyendo español, inglés, francés y más" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Múltiples Idiomas</h3>
                <p className="text-amber-800">
                  Aprende con tu tutor personal de IA en <span className="font-semibold">más de 10 idiomas</span> incluyendo español, inglés, francés, alemán, chino, japonés y más. <span className="font-semibold">Cambia entre idiomas</span> en cualquier momento.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_taking_notes.png" 
                    alt="Tutor de idiomas con IA proporcionando retroalimentación personalizada" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Retroalimentación Personalizada</h3>
                <p className="text-amber-800">
                  Recibe <span className="font-semibold">retroalimentación detallada</span> de tu tutor de IA sobre tu gramática y vocabulario después de cada sesión de conversación.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 px-4 bg-amber-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-6">
              ¿Listo para empezar a hablar con tu tutor de idiomas con IA?
            </h2>
            <p className="text-lg md:text-xl text-amber-800 mb-8 max-w-2xl mx-auto">
              Únete a otros estudiantes que están mejorando sus habilidades en español, inglés, francés y otros idiomas cada día con su tutor personal de IA.
            </p>
            <Link
              href="/learn"
              className="inline-block px-10 py-4 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-xl"
              onClick={() => {
                localStorage.setItem('uiLanguage', 'español');
                setLanguage('español');
              }}
            >
              {user ? 'Continuar Aprendiendo' : 'Empezar a Aprender Ahora'}
            </Link>
            {!user && (
              <p className="mt-4 text-amber-700">
                No se requiere tarjeta de crédito. Comienza gratis.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
} 