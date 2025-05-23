import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hablo.pro | Tutor de Idiomas de IA para Español, Inglés, Francés y Más",
  description: "Practica hablando con Nacho, tu tutor personal de idiomas con IA. Aprende español, inglés, francés, alemán, chino, japonés y más con conversaciones naturales y retroalimentación inmediata.",
  keywords: "Tutor de Idiomas de IA, tutor de español con IA, tutor de inglés con IA, tutor de francés con IA, tutor de alemán con IA, tutor de chino con IA, app para aprender idiomas, práctica de conversación",
  openGraph: {
    title: "Hablo.pro - Tutor de Idiomas de IA para Español, Inglés y Más",
    description: "Practica hablando con Nacho, tu tutor personal de idiomas con IA. Mejora tu fluidez, vocabulario y confianza en cualquier idioma.",
    images: [
      {
        url: "/images/hablo_logo_long.png",
        width: 1200,
        height: 630,
        alt: "Hablo.pro - Tutor de Idiomas de IA para Español, Inglés y Más",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hablo.pro - Tutor de Idiomas de IA para Inglés, Francés, Portugués y Más",
    description: "Practica hablando con Nacho, tu tutor personal de idiomas con IA. Mejora tu fluidez, vocabulario y confianza en cualquier idioma.",
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
    canonical: "https://hablo.pro/es",
    languages: {
      "en": "https://hablo.pro",
      "es": "https://hablo.pro/es",
    },
  },
};

export default function EsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
} 