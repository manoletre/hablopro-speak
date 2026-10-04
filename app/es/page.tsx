'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import LanguageTypingAnimation from '../components/LanguageTypingAnimation';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TermsOfServiceDialog from '../components/TermsOfServiceDialog';
import PrivacyPolicyDialog from '../components/PrivacyPolicyDialog';
import RefundPolicyDialog from '../components/RefundPolicyDialog';
import Head from 'next/head';

// Add structured data for rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HabloPro Speak - Tutor de Idiomas de IA',
  description: 'Practica hablando con Nacho, tu tutor personal de idiomas de IA. Mejora tu inglés, francés, alemán, chino, japonés y más con conversaciones naturales y retroalimentación personalizada.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  keywords: 'tutor de idiomas con IA, tutor de inglés con IA, tutor de francés con IA, tutor de alemán con IA, tutor de chino con IA, tutor de japonés con IA, app para aprender idiomas, práctica de conversación',
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

function LandingPageContent() {
  const { setLanguage } = useLanguage();
  const { user } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Spanish language list for animation
  const spanishLanguages = [
    { name: 'inglés', code: 'gb' },
    { name: 'francés', code: 'fr' },
    { name: 'italiano', code: 'it' },
    { name: 'alemán', code: 'de' },
    { name: 'portugués', code: 'br' },
    { name: 'chino', code: 'cn' },
    { name: 'japonés', code: 'jp' },
    { name: 'coreano', code: 'kr' },
    { name: 'holandés', code: 'nl' },
  ];

  const languages = [
    { name: 'Inglés', flag: '🇺🇸' },
    { name: 'Español', flag: '🇪🇸' },
    { name: 'Francés', flag: '🇫🇷' },
    { name: 'Alemán', flag: '🇩🇪' },
    { name: 'Italiano', flag: '🇮🇹' },
    { name: 'Portugués', flag: '🇵🇹' },
    { name: 'Holandés', flag: '🇳🇱' },
    { name: 'Chino', flag: '🇨🇳' },
    { name: 'Japonés', flag: '🇯🇵' },
    { name: 'Coreano', flag: '🇰🇷' }
  ];

  // Scroll spy functionality
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['como-funciona', 'idiomas', 'precios']; // removed 'capturas'
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle URL parameters for dialogs and sections
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dialog = urlParams.get('dialog');
    const section = urlParams.get('section');
    
    // Handle dialog parameter
    if (dialog === 'terms') {
      setShowTerms(true);
    } else if (dialog === 'privacy') {
      setShowPrivacy(true);
    } else if (dialog === 'refund') {
      setShowRefund(true);
    }
    
    // Handle section parameter - auto-scroll to section
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, []);

  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const CTAButton = ({ className = "" }: { className?: string }) => (
    <Link
      href="/learn"
      className={`inline-block px-8 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-lg ${className}`}
      onClick={() => {
        localStorage.setItem('uiLanguage', 'español');
        setLanguage('español');
      }}
    >
      {user ? 'Continuar hablando' : 'Comenzar gratis'}
    </Link>
  );

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white font-poppins text-lg">
        {/* Navigation Header */}
        <header className="w-full bg-amber-100 py-4 border-b border-amber-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-amber-800 hover:text-amber-900 font-medium transition-colors duration-200 cursor-pointer">
                🇺🇸 I speak English
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => smoothScrollTo('como-funciona')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'como-funciona' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Cómo funciona
              </button>
              {/* <button
                onClick={() => smoothScrollTo('capturas')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'capturas' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Demo
              </button> */}
              <button
                onClick={() => smoothScrollTo('idiomas')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'idiomas' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Idiomas
              </button>
              <button
                onClick={() => smoothScrollTo('precios')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'precios' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Precios
              </button>
            </nav>
          </div>
        </header>

        {/* Archive Notice */}
        <aside aria-label="Aviso de proyecto archivado" className="w-full border-b border-amber-300 bg-amber-100 px-4 py-6">
          <div className="max-w-6xl mx-auto text-amber-900">
            <p className="font-semibold">Este proyecto está archivado</p>
            <p className="mt-1 text-base">Hablo.pro ya no se mantiene ni recibe soporte.</p>
            <div className="mt-3 flex flex-col items-start gap-2 text-base sm:flex-row sm:flex-wrap sm:gap-x-6">
              <a
                href="https://manoletre.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-amber-700"
              >
                Descubre en qué estoy trabajando ahora
              </a>
              <a
                href="https://www.loom.com/share/116a7c44c94b4ea2b818db653fead522"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-amber-700"
              >
                Mira cómo funcionaba Hablo.pro
              </a>
            </div>
          </div>
        </aside>

        {/* Hero Section */}
        <section className="w-full pt-8 pb-12 md:pt-12 md:pb-16 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 flex flex-col items-start leading-tight">
                <span>Habla</span>
                <LanguageTypingAnimation languages={spanishLanguages} />
                <span>con tu tutor de IA.</span>
              </h1>
              <p className="text-xl md:text-2xl text-amber-800 mb-8 font-semibold">
                Alcanza el nivel B2 en meses, no años
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <CTAButton />
              </div>
              {/* ProductHunt Badge */}
              <div className="mt-6">
                <a 
                  href="https://www.producthunt.com/products/hablo-pro/launches/hablo-pro?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_campaign=badge-hablo-pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image 
                    src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=987743&theme=light&period=weekly&topic_id=204&t=1791138820512"
                    alt="Hablo.pro — #1 Product of the Week in Education on Product Hunt"
                    width={250}
                    height={54}
                    priority={false}
                    loading="lazy"
                  />
                </a>
              </div>
            </div>
            <div className="md:w-1/2 w-full md:pl-8 relative">
              <div className="w-full h-[280px] md:h-[500px] relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 opacity-60 rounded-full blur-2xl w-[220px] h-[220px] md:w-[400px] md:h-[400px]"></div>
                <Image
                  src="/images/nacho_intro.png"
                  alt="Nacho, tu tutor de idiomas de IA para inglés, francés y otros idiomas"
                  width={550}
                  height={550}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ objectFit: 'contain' }}
                  priority
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="como-funciona" className="w-full py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-12">
              Cómo funciona en 3 pasos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="w-36 h-36 bg-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                  <Image 
                    src="/images/nacho_multiple_langs.png" 
                    alt="Elige tu idioma" 
                    width={130} 
                    height={130} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <div className="bg-amber-100 rounded-full px-4 py-2 text-amber-800 font-semibold mb-4 inline-block text-lg">
                  Paso 1
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Elige un idioma</h3>
                <p className="text-amber-800 text-lg">
                  Selecciona entre más de 10 idiomas incluyendo inglés, francés, alemán, chino, japonés y más.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-36 h-36 bg-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                  <Image 
                    src="/images/nacho_speaking.png" 
                    alt="Habla con Nacho" 
                    width={130} 
                    height={130} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <div className="bg-amber-100 rounded-full px-4 py-2 text-amber-800 font-semibold mb-4 inline-block text-lg">
                  Paso 2
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Habla con Nacho</h3>
                <p className="text-amber-800 text-lg">
                  Ten conversaciones naturales donde Nacho se adapta a tu nivel, entiende tu estilo de aprendizaje y te brinda correcciones suaves para ayudarte a mejorar.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-36 h-36 bg-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                  <Image 
                    src="/images/nacho_taking_notes.png" 
                    alt="Revisa retroalimentación" 
                    width={130} 
                    height={130} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <div className="bg-amber-100 rounded-full px-4 py-2 text-amber-800 font-semibold mb-4 inline-block text-lg">
                  Paso 3
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Revisa retroalimentación</h3>
                <p className="text-amber-800 text-lg">
                  Recibe correcciones personalizadas y sugerencias de vocabulario para mejorar tus habilidades.
                </p>
              </div>
            </div>

            <div className="text-center">
              <CTAButton />
            </div>
          </div>
        </section>

        {/* Screenshots Section */}
        {/* <section id="capturas" className="w-full py-12 px-4 bg-amber-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-8">
              Míralo en acción
            </h2>
            <p className="text-xl text-amber-800 mb-8 max-w-2xl mx-auto">
              Observa cómo Nacho te brinda retroalimentación en tiempo real sobre tus conversaciones, ayudándote a aprender de cada error.
            </p>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto mb-8">
              <div className="aspect-video bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                <p className="text-amber-800 text-xl font-medium">
                  📱 Transcripción interactiva con correcciones próximamente
                </p>
              </div>
            </div>
            <CTAButton />
          </div>
        </section> */}

        {/* Languages Section */}
        <section id="idiomas" className="w-full py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-12">
              Practica en más de 10 idiomas
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
              {languages.map((language) => (
                <div key={language.name} className="bg-amber-50 rounded-lg p-6 text-center hover:bg-amber-100 transition-colors">
                  <div className="text-5xl mb-3">{language.flag}</div>
                  <h3 className="text-xl font-semibold text-amber-900">{language.name}</h3>
                </div>
              ))}
            </div>

            <div className="text-center">
              <CTAButton />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precios" className="w-full py-12 px-4 bg-amber-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-8">
              Precios simples y transparentes
            </h2>
            <p className="text-xl text-amber-800 text-center mb-12 max-w-2xl mx-auto">
              Comienza con 10 minutos gratis. Luego elige el plan que mejor funcione para ti.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
              {/* Free Trial */}
              <div className="bg-amber-50 p-8 rounded-xl border-2 border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Prueba Gratuita</h3>
                <div className="text-3xl font-bold text-amber-900 mb-2">$0</div>
                <p className="text-amber-800 mb-6 text-lg">Perfecto para comenzar</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    10 minutos de práctica de conversación
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Máximo 5 mins por conversación
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Todos los más de 10 idiomas
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Retroalimentación personalizada
                  </li>
                </ul>
              </div>

              {/* Subscription */}
              <div className="bg-white p-8 rounded-xl border-2 border-amber-400 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Suscripción</h3>
                <div className="text-3xl font-bold text-amber-900 mb-1">$12<span className="text-lg font-normal">/mes</span></div>
                <div className="text-amber-800 mb-6 text-lg">o $120/año (ahorra $24)</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    200 minutos/mes (2400/año)
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Conversaciones hasta 15 minutos
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Todos los idiomas y características
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Minutos se acumulan mensualmente
                  </li>
                </ul>
              </div>

              {/* Pay as you go */}
              <div className="bg-amber-50 p-8 rounded-xl border-2 border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Pago por uso</h3>
                <div className="text-3xl font-bold text-amber-900 mb-2">$8</div>
                <p className="text-amber-800 mb-6 text-lg">Compra única</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    100 minutos (nunca expiran)
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Máximo 5 mins por conversación
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Todos los idiomas y características
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Sin compromiso mensual
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Perfecto para uso ocasional
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <CTAButton className="text-xl px-10 py-4" />
              <p className="mt-4 text-amber-700 text-lg">
                No se requiere tarjeta de crédito. Comienza gratis.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-4 px-4 bg-amber-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-3 md:mb-0">
                <p className="text-amber-100 text-lg">
                  Hecho con ❤️ por{' '}
                  <a 
                    href="https://manoletre.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-amber-200 underline font-medium"
                  >
                    manoletre
                  </a>
                  {' '}desde 🇨🇴
                </p>
                <p className="text-amber-100 text-xs mt-1">2025 - Manuel Cardenas Prieto</p>
              </div>
              <div className="flex space-x-6">
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-amber-100 hover:text-white transition-colors text-lg"
                >
                  Política de Privacidad
                </button>
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-amber-100 hover:text-white transition-colors text-lg"
                >
                  Términos y Condiciones
                </button>
                <button
                  onClick={() => setShowRefund(true)}
                  className="text-amber-100 hover:text-white transition-colors text-lg"
                >
                  Política de Reembolso
                </button>
              </div>
            </div>
          </div>
        </footer>

        {/* Dialogs */}
        <TermsOfServiceDialog 
          isOpen={showTerms} 
          onClose={() => setShowTerms(false)}
          onOpenPrivacyPolicy={() => {
            setShowTerms(false);
            setShowPrivacy(true);
          }}
          onOpenRefundPolicy={() => {
            setShowTerms(false);
            setShowRefund(true);
          }}
          isSpanish={true}
        />
        <PrivacyPolicyDialog 
          isOpen={showPrivacy} 
          onClose={() => setShowPrivacy(false)}
          onOpenTermsOfService={() => {
            setShowPrivacy(false);
            setShowTerms(true);
          }}
          onOpenRefundPolicy={() => {
            setShowPrivacy(false);
            setShowRefund(true);
          }}
          isSpanish={true}
        />
        <RefundPolicyDialog 
          isOpen={showRefund} 
          onClose={() => setShowRefund(false)}
          onOpenTermsOfService={() => {
            setShowRefund(false);
            setShowTerms(true);
          }}
          onOpenPrivacyPolicy={() => {
            setShowRefund(false);
            setShowPrivacy(true);
          }}
          isSpanish={true}
        />
      </main>
    </>
  );
}

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>HabloPro Speak | Tutor de Idiomas de IA para Inglés, Francés, Alemán y Más</title>
        <meta name="description" content="Practica hablando con Nacho, tu tutor personal de idiomas de IA. Aprende inglés, francés, alemán, chino, japonés y más a través de conversaciones naturales con retroalimentación instantánea." />
        <meta name="keywords" content="tutor de idiomas con IA, tutor de inglés con IA, tutor de francés con IA, tutor de alemán con IA, tutor de chino con IA, tutor de japonés con IA, app para aprender idiomas, práctica de conversación" />
        {/* Enhanced SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="HabloPro" />
        <meta name="language" content="Spanish" />
        <meta name="revisit-after" content="7 days" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hablo.pro/es/" />
        <meta property="og:title" content="HabloPro Speak | Tutor de Idiomas de IA para Inglés, Francés, Alemán y Más" />
        <meta property="og:description" content="Practica hablando con Nacho, tu tutor personal de idiomas de IA. Aprende inglés, francés, alemán, chino, japonés y más a través de conversaciones naturales con retroalimentación instantánea." />
        <meta property="og:image" content="https://hablo.pro/images/og-image.png" />
        <meta property="og:site_name" content="HabloPro Speak" />
        <meta property="og:locale" content="es_ES" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://hablo.pro/es/" />
        <meta property="twitter:title" content="HabloPro Speak | Tutor de Idiomas de IA para Inglés, Francés, Alemán y Más" />
        <meta property="twitter:description" content="Practica hablando con Nacho, tu tutor personal de idiomas de IA. Aprende inglés, francés, alemán, chino, japonés y más a través de conversaciones naturales con retroalimentación instantánea." />
        <meta property="twitter:image" content="https://hablo.pro/images/og-image.png" />
        {/* Canonical URL */}
        <link rel="canonical" href="https://hablo.pro/es/" />
        {/* Additional Links */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="alternate" type="application/rss+xml" title="HabloPro Blog" href="/rss.xml" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <Suspense fallback={null}>
        <LandingPageContent />
      </Suspense>
    </>
  );
} 