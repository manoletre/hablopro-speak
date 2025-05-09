import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from './context/LanguageContext';
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
  title: "HabloPro Speak - Learn Languages by Speaking with AI",
  description: "Practice speaking with Nacho, your AI language partner. Improve your fluency, pronunciation, and confidence in any language. Start learning for free today!",
  keywords: "language learning, AI language partner, speaking practice, pronunciation, fluency, language tutor, Nacho AI",
  openGraph: {
    title: "HabloPro Speak - Learn Languages by Speaking with AI",
    description: "Practice speaking with Nacho, your AI language partner. Improve your fluency, pronunciation, and confidence in any language.",
    images: [
      {
        url: "/images/landing_screenshot_en.png",
        width: 1200,
        height: 630,
        alt: "HabloPro Speak - AI Language Learning Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HabloPro Speak - Learn Languages by Speaking with AI",
    description: "Practice speaking with Nacho, your AI language partner. Improve your fluency, pronunciation, and confidence in any language.",
    images: ["/images/landing_screenshot_en.png"],
    creator: "@hablopro",
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
              {children}
            </AuthProvider>
          </LanguageProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}