import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from './context/LanguageContext';
import { LocationProvider } from './context/LocationContext';
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
  description: "Speak with OpenAI's realtime API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${poppins.variable} ${mynerve.variable} ${indieFlower.variable}`}>
      <body suppressHydrationWarning>
        <LocationProvider>
          <LanguageProvider>
            <AuthProvider>{children}</AuthProvider>
          </LanguageProvider>
        </LocationProvider>
      </body>
    </html>
  );
}
