'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import LanguageTypingAnimation from './components/LanguageTypingAnimation';
import { useLanguage } from './context/LanguageContext';
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1000',
  },
};

export default function LandingPage() {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();

  return (
    <>
      <Head>
        <title>HabloPro Speak | AI Language Tutor for Spanish, French, German & More</title>
        <meta name="description" content="Practice speaking with Nacho, your personal AI language tutor. Learn Spanish, French, German, Chinese, Japanese and more through natural conversations with instant feedback." />
        <meta name="keywords" content="AI language tutor, AI Spanish tutor, AI French tutor, AI German tutor, AI Chinese tutor, AI Japanese tutor, language learning app, speaking practice" />
      </Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white font-poppins">
        {/* Language Switch */}
        <div className="w-full bg-amber-100 py-2">
          <div className="max-w-6xl mx-auto px-4">
            <Link href="/es" className="text-amber-800 hover:text-amber-900">
              Hablo español
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 flex flex-col items-start">
                <span>Speak</span>
                <LanguageTypingAnimation />
                <span>with your AI tutor.</span>
              </h1>
              <p className="text-lg md:text-xl text-amber-800 mb-8">
                Practice speaking with Nacho, your personal AI language tutor. Improve your <span className="notebook-underline font-bold">fluency</span>, <span className="notebook-underline font-bold">vocabulary</span>, and <span className="notebook-underline font-bold">confidence</span> in Spanish, French, German, and many more languages.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/learn"
                  className="px-8 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-lg text-center"
                  onClick={() => {
                    localStorage.setItem('uiLanguage', 'english');
                    setLanguage('english');
                  }}
                >
                  {user ? 'Continue learning' : 'Get started for free'}
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 w-full md:pl-12 relative">
              <div className="w-full h-[250px] md:h-[500px] relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 opacity-60 rounded-full blur-2xl w-[200px] h-[200px] md:w-[400px] md:h-[400px]"></div>
                <Image
                  src="/images/nacho_intro.png"
                  alt="Nacho, your AI language tutor for Spanish, French and other languages"
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
              Your Personal AI Tutor for Any Language
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_speaking.png" 
                    alt="AI tutor for language speaking practice" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Practice Speaking</h3>
                <p className="text-amber-800">
                  Have <span className="font-semibold">real conversations</span> with your AI tutor in Spanish, French, German or any target language.  <span className="font-semibold">Read, listen and speak</span> in natural conversations.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_multiple_langs.png" 
                    alt="AI tutor for multiple languages including Spanish, French, German and more" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Multiple Languages</h3>
                <p className="text-amber-800">
                  Learn with your personal AI tutor in <span className="font-semibold">10+ languages</span> including Spanish, French, German, Chinese, Japanese and more. <span className="font-semibold">Switch between languages</span> anytime.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_taking_notes.png" 
                    alt="AI language tutor providing personalized feedback" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Personalized Feedback</h3>
                <p className="text-amber-800">
                  Receive <span className="font-semibold">detailed feedback</span> from your AI tutor on your <span className="font-semibold">grammar</span> and <span className="font-semibold">vocabulary</span> after each conversation session.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 px-4 bg-amber-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-6">
              Ready to Start Speaking with Your AI Language Tutor?
            </h2>
            <p className="text-lg md:text-xl text-amber-800 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are improving their Spanish, French, German and other language skills every day with their personal AI tutor.
            </p>
            <Link
              href="/learn"
              className="inline-block px-10 py-4 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-xl"
            >
              {user ? 'Continue Learning' : 'Start Learning Now'}
            </Link>
            {!user && (
              <p className="mt-4 text-amber-700">
                No credit card required. Start for free.
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
