'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import LanguageTypingAnimation from './components/LanguageTypingAnimation';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import TermsOfServiceDialog from './components/TermsOfServiceDialog';
import PrivacyPolicyDialog from './components/PrivacyPolicyDialog';
import RefundPolicyDialog from './components/RefundPolicyDialog';
import Head from 'next/head';

// Add structured data for rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HabloPro Speak - AI Language Tutor',
  description: 'Practice speaking with Nacho, your personal AI language tutor. Improve your Spanish, French, German, Chinese, Japanese and more with natural conversations and personalized feedback.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  keywords: 'AI language tutor, AI Spanish tutor, AI French tutor, AI German tutor, AI Chinese tutor, AI Japanese tutor, language learning app, speaking practice',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

function LandingPageContent() {
  const { setLanguage } = useLanguage();
  const { user } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const languages = [
    { name: 'English', flag: '🇺🇸' },
    { name: 'Spanish', flag: '🇪🇸' },
    { name: 'French', flag: '🇫🇷' },
    { name: 'German', flag: '🇩🇪' },
    { name: 'Italian', flag: '🇮🇹' },
    { name: 'Portuguese', flag: '🇵🇹' },
    { name: 'Dutch', flag: '🇳🇱' },
    { name: 'Chinese', flag: '🇨🇳' },
    { name: 'Japanese', flag: '🇯🇵' },
    { name: 'Korean', flag: '🇰🇷' }
  ];

  // Scroll spy functionality
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['how-it-works', 'languages', 'pricing']; // removed 'screenshots'
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
        localStorage.setItem('uiLanguage', 'english');
        setLanguage('english');
      }}
    >
      {user ? 'Continue speaking' : 'Start speaking for free'}
    </Link>
  );

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white font-poppins text-lg">
        {/* Navigation Header */}
        <header className="w-full bg-amber-100 py-4 border-b border-amber-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/es" className="text-amber-800 hover:text-amber-900 font-medium transition-colors duration-200 cursor-pointer">
                🇪🇸 Hablo español
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => smoothScrollTo('how-it-works')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'how-it-works' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                How it works
              </button>
              {/* <button
                onClick={() => smoothScrollTo('screenshots')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'screenshots' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Demo
              </button> */}
              <button
                onClick={() => smoothScrollTo('languages')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'languages' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Languages
              </button>
              <button
                onClick={() => smoothScrollTo('pricing')}
                className={`text-amber-800 hover:text-amber-900 font-medium transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-0.5 ${
                  activeSection === 'pricing' ? 'border-b-2 border-amber-800' : ''
                }`}
              >
                Pricing
              </button>
            </nav>
          </div>
        </header>

        {/* Archive Notice */}
        <aside aria-label="Project archive notice" className="w-full border-b border-amber-300 bg-amber-100 px-4 py-6">
          <div className="max-w-6xl mx-auto text-amber-900">
            <p className="font-semibold">This project is archived</p>
            <p className="mt-1 text-base">Hablo.pro is no longer maintained or supported.</p>
            <div className="mt-3 flex flex-col items-start gap-2 text-base sm:flex-row sm:flex-wrap sm:gap-x-6">
              <a
                href="https://manoletre.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-amber-700"
              >
                See what I’m working on now
              </a>
              <a
                href="https://www.loom.com/share/116a7c44c94b4ea2b818db653fead522"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-amber-700"
              >
                Watch how Hablo.pro used to work
              </a>
            </div>
          </div>
        </aside>

        {/* Hero Section */}
        <section className="w-full pt-8 pb-12 md:pt-12 md:pb-16 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 flex flex-col items-start leading-tight">
                <span>Speak</span>
                <LanguageTypingAnimation />
                <span>with your AI tutor.</span>
              </h1>
              <p className="text-xl md:text-2xl text-amber-800 mb-8 font-semibold">
                Reach B2 level in months, not years
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
                  alt="Nacho, your AI language tutor for Spanish, French and other languages"
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
        <section id="how-it-works" className="w-full py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-12">
              How it works in 3 steps
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="w-36 h-36 bg-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                  <Image 
                    src="/images/nacho_multiple_langs.png" 
                    alt="Choose your language" 
                    width={130} 
                    height={130} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <div className="bg-amber-100 rounded-full px-4 py-2 text-amber-800 font-semibold mb-4 inline-block text-lg">
                  Step 1
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Choose a language</h3>
                <p className="text-amber-800 text-lg">
                  Select from 10+ languages including Spanish, French, German, Chinese, Japanese and more.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-36 h-36 bg-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                  <Image 
                    src="/images/nacho_speaking.png" 
                    alt="Talk with Nacho" 
                    width={130} 
                    height={130} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <div className="bg-amber-100 rounded-full px-4 py-2 text-amber-800 font-semibold mb-4 inline-block text-lg">
                  Step 2
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Talk with Nacho</h3>
                <p className="text-amber-800 text-lg">
                  Have natural conversations where Nacho adapts to your level, understands your learning style, and provides gentle corrections to help you improve.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-36 h-36 bg-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto overflow-hidden">
                  <Image 
                    src="/images/nacho_taking_notes.png" 
                    alt="Review feedback" 
                    width={130} 
                    height={130} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <div className="bg-amber-100 rounded-full px-4 py-2 text-amber-800 font-semibold mb-4 inline-block text-lg">
                  Step 3
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Review feedback</h3>
                <p className="text-amber-800 text-lg">
                  Get personalized corrections and vocabulary suggestions to improve your skills.
                </p>
              </div>
            </div>

            <div className="text-center">
              <CTAButton />
            </div>
          </div>
        </section>

        {/* Screenshots Section */}
        {/* <section id="screenshots" className="w-full py-12 px-4 bg-amber-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-8">
              See it in action
            </h2>
            <p className="text-xl text-amber-800 mb-8 max-w-2xl mx-auto">
              Watch how Nacho provides real-time feedback on your conversations, helping you learn from every mistake.
            </p>
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto mb-8">
              <div className="aspect-video bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                <p className="text-amber-800 text-xl font-medium">
                  📱 Interactive transcript with corrections coming soon
                </p>
              </div>
            </div>
            <CTAButton />
          </div>
        </section> */}

        {/* Languages Section */}
        <section id="languages" className="w-full py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-12">
              Practice in 10+ languages
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
        <section id="pricing" className="w-full py-12 px-4 bg-amber-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-8">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-amber-800 text-center mb-12 max-w-2xl mx-auto">
              Start with 10 minutes free. Then choose the plan that works best for you.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
              {/* Free Trial */}
              <div className="bg-amber-50 p-8 rounded-xl border-2 border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Free Trial</h3>
                <div className="text-3xl font-bold text-amber-900 mb-2">$0</div>
                <p className="text-amber-800 mb-6 text-lg">Perfect to get started</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    10 minutes of speaking practice
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Max 5 mins per conversation
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    All 10+ languages
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Personalized feedback
                  </li>
                </ul>
              </div>

              {/* Subscription */}
              <div className="bg-white p-8 rounded-xl border-2 border-amber-400 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Subscription</h3>
                <div className="text-3xl font-bold text-amber-900 mb-1">$12<span className="text-lg font-normal">/month</span></div>
                <div className="text-amber-800 mb-6 text-lg">or $120/year (save $24)</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    200 minutes/month (2400/year)
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Up to 15-minute conversations
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    All languages & features
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Minutes roll over monthly
                  </li>
                </ul>
              </div>

              {/* Pay as you go */}
              <div className="bg-amber-50 p-8 rounded-xl border-2 border-amber-200">
                <h3 className="text-xl font-semibold text-amber-900 mb-4">Pay as you go</h3>
                <div className="text-3xl font-bold text-amber-900 mb-2">$8</div>
                <p className="text-amber-800 mb-6 text-lg">One-time purchase</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    100 minutes (never expire)
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Max 5 mins per conversation
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    All languages & features
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    No monthly commitment
                  </li>
                  <li className="flex items-center text-amber-800 text-lg">
                    <span className="text-green-600 mr-2">✓</span>
                    Perfect for occasional use
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <CTAButton className="text-xl px-10 py-4" />
              <p className="mt-4 text-amber-700 text-lg">
                No credit card required. Start for free.
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
                  Made with ❤️ by{' '}
                  <a 
                    href="https://manoletre.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-amber-200 underline font-medium"
                  >
                    manoletre
                  </a>
                  {' '}from 🇨🇴
                </p>
                <p className="text-amber-100 text-xs mt-1">2025 - Manuel Cardenas Prieto</p>
              </div>
              <div className="flex space-x-6">
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-amber-100 hover:text-white transition-colors text-lg"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-amber-100 hover:text-white transition-colors text-lg"
                >
                  Terms & Conditions
                </button>
                <button
                  onClick={() => setShowRefund(true)}
                  className="text-amber-100 hover:text-white transition-colors text-lg"
                >
                  Refund Policy
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
        />
      </main>
    </>
  );
}

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>HabloPro Speak | AI Language Tutor for Spanish, French, German & More</title>
        <meta name="description" content="Practice speaking with Nacho, your personal AI language tutor. Learn Spanish, French, German, Chinese, Japanese and more through natural conversations with instant feedback." />
        <meta name="keywords" content="AI language tutor, AI Spanish tutor, AI French tutor, AI German tutor, AI Chinese tutor, AI Japanese tutor, language learning app, speaking practice" />
        {/* Enhanced SEO Meta Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="HabloPro" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hablo.pro/" />
        <meta property="og:title" content="HabloPro Speak | AI Language Tutor for Spanish, French, German & More" />
        <meta property="og:description" content="Practice speaking with Nacho, your personal AI language tutor. Learn Spanish, French, German, Chinese, Japanese and more through natural conversations with instant feedback." />
        <meta property="og:image" content="https://hablo.pro/images/og-image.png" />
        <meta property="og:site_name" content="HabloPro Speak" />
        <meta property="og:locale" content="en_US" />
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://hablo.pro/" />
        <meta property="twitter:title" content="HabloPro Speak | AI Language Tutor for Spanish, French, German & More" />
        <meta property="twitter:description" content="Practice speaking with Nacho, your personal AI language tutor. Learn Spanish, French, German, Chinese, Japanese and more through natural conversations with instant feedback." />
        <meta property="twitter:image" content="https://hablo.pro/images/og-image.png" />
        {/* Canonical URL */}
        <link rel="canonical" href="https://hablo.pro/" />
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
