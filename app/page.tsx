'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import LanguageTypingAnimation from './components/LanguageTypingAnimation';

// Add structured data for rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HabloPro Speak',
  description: 'Practice speaking with Nacho, your AI language partner. Improve your fluency, pronunciation, and confidence in any language.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white font-poppins">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6 flex flex-col items-start">
                <span>Learn</span>
                <LanguageTypingAnimation />
                <span>by speaking.</span>
              </h1>
              <p className="text-lg md:text-xl text-amber-800 mb-8">
                Practice speaking with Nacho, your AI language partner. Improve your <span className="notebook-underline font-bold">fluency</span>, <span className="notebook-underline font-bold">pronunciation</span>, and <span className="notebook-underline font-bold">confidence</span> in <i>any</i> language.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/learn"
                  className="px-8 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-lg text-center"
                >
                  {user ? 'Continue Learning' : 'Get Started Free'}
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 w-full md:pl-12 relative">
              <div className="w-full h-[250px] md:h-[500px] relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 opacity-60 rounded-full blur-2xl w-[200px] h-[200px] md:w-[400px] md:h-[400px]"></div>
                <Image
                  src="/images/nacho_intro.png"
                  alt="Nacho (the AI language learning sloth) is ready to help you learn a new language"
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
              Learn Any Language, Naturally
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_speaking.png" 
                    alt="Nacho (the AI language learning sloth) speaking to a microphone" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Practice Speaking</h3>
                <p className="text-amber-800">
                  Practice real conversations with Nacho in your target language. Get immediate feedback on your pronunciation and fluency.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_multiple_langs.png" 
                    alt="Nacho (the AI language learning sloth) can speak multiple languages" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Multiple Languages</h3>
                <p className="text-amber-800">
                  Choose from 10+ languages including Spanish, French, German, Chinese, Japanese and more. Switch between languages anytime.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-32 h-32 bg-amber-200 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                  <Image 
                    src="/images/nacho_taking_notes.png" 
                    alt="Nacho (the AI language learning sloth) taking notes" 
                    width={110} 
                    height={110} 
                    style={{objectFit: 'contain'}}
                    loading="eager"
                  />
                </div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">Personalized Feedback</h3>
                <p className="text-amber-800">
                  Receive detailed feedback on your grammar, vocabulary, and pronunciation after each conversation session.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 px-4 bg-amber-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-6">
              Ready to Start Speaking a New Language?
            </h2>
            <p className="text-lg md:text-xl text-amber-800 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are improving their language skills every day with Nacho.
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
