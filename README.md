# HabloPro Speak

HabloPro Speak is an AI-powered language tutor built with Next.js, Firebase and OpenAI. Users practice real-time voice conversations with "Nacho" the AI tutor and receive feedback on how to improve. Sessions, bookmarks and streaks are stored in Firestore and analytics are tracked via PostHog.

## Features

- Real-time voice chat with OpenAI's streaming API
- Word translations and vocabulary suggestions on demand
- Personalized grammar and vocabulary feedback after each session
- Google Sign-In using Firebase Authentication
- Streak tracking and welcome emails via Firebase Cloud Functions
- PostHog analytics for sessions and daily active users

## Project Structure

- `app/` – Next.js pages, components and React context providers
  - `app/api/` – serverless routes that interact with OpenAI for sessions, feedback, suggestions and translations
- `functions/` – Firebase Cloud Functions triggered on new sessions and user creation
- `public/` – static assets (icons, audio, images)
- `firestore.rules` – security rules for Firestore
- `next.config.ts` – Next.js configuration and PostHog proxy setup

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and fill in your keys:
   ```bash
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...

   # OpenAI
   OPENAI_API_KEY=...

   # PostHog
   NEXT_PUBLIC_POSTHOG_KEY=...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   NEXT_PUBLIC_POSTHOG_PROJECT_ID=...
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Learning Next Steps

If you're new to the project, these files are great starting points:

1. **OpenAI API usage** – see `app/api/session/route.ts` and `app/api/feedback/route.ts` to understand how prompts are built and responses parsed.
2. **Firestore data structure** – check `firestore.rules` and `functions/src/index.ts` to see how session data and streaks are stored.
3. **React context providers** – `app/context/AuthContext.tsx` and `app/context/LanguageContext.tsx` manage auth state and UI translations.
4. **Analytics** – `POSTHOG_IMPLEMENTATION.md` describes the events sent to PostHog.

Contributions and feedback are welcome!
