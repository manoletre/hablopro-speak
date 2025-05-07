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
  title: "HabloPro Speak",
  description: "Learn languages by speaking with AI",
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
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}