import type { Metadata } from "next";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from './context/LanguageContext';
import { BillingProvider } from './context/BillingContext';
import { PostHogProvider } from "./components/PostHogProvider";
import { Outfit, Poppins, Mynerve, Indie_Flower } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const mynerve = Mynerve({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-mynerve',
  display: 'swap',
});

const indieFlower = Indie_Flower({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-indie-flower',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Hablo.pro - Speak with your AI language tutor",
  description: "Practice speaking with Nacho, your AI language tutor. Improve your fluency, vocabulary, and confidence in any language. Start learning for free today!",
  keywords: "language learning, AI language tutor, speaking practice, pronunciation, fluency, language tutor, Nacho AI",
  openGraph: {
    title: "Hablo.pro - Speak with your AI language tutor",
    description: "Practice speaking with Nacho, your AI language tutor. Improve your fluency, vocabulary, and confidence in any language.",
    images: [
      {
        url: "/images/hablo_logo_long.png",
        width: 1200,
        height: 630,
        alt: "Hablo.pro - Speak with your AI language tutor",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hablo.pro - Speak with your AI language tutor",
    description: "Practice speaking with Nacho, your AI language tutor. Improve your fluency, vocabulary, and confidence in any language.",
    images: ["/images/hablo_logo_long.png"],
    creator: "@_manoletre",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://hablo.pro",
    languages: {
      "en": "https://hablo.pro",
      "es": "https://hablo.pro/es",
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${poppins.variable} ${mynerve.variable} ${indieFlower.variable}`}>  
      <body suppressHydrationWarning>
        <PostHogProvider>
          <LanguageProvider>
            <AuthProvider>
              <BillingProvider>
                {children}
              </BillingProvider>
            </AuthProvider>
          </LanguageProvider>
        </PostHogProvider>
        
        {/* Paddle.js Script for Checkout Overlays */}
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              window.addEventListener('load', () => {
                const env = ${JSON.stringify(process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox')};
                const token = ${JSON.stringify(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '')};

                if (window.Paddle) {
                  // Explicitly set environment
                  if (env === 'sandbox') {
                    window.Paddle.Environment.set('sandbox');
                  } else {
                    window.Paddle.Environment.set('production');
                  }

                  console.log('🔍 Initializing Paddle.js:', {
                    environment: env,
                    tokenPrefix: token ? token.substring(0, 8) + '...' : 'MISSING'
                  });

                  window.Paddle.Initialize({
                    token,
                    checkout: {
                      settings: {
                        allowedPaymentMethods: ['card', 'paypal', 'apple_pay', 'google_pay'],
                        successUrl: window.location.origin + '/learn?checkout=success',
                        locale: 'en',
                      },
                    },
                  });
                }
              });
            })();`,
          }}
        />
      </body>
    </html>
  );
}