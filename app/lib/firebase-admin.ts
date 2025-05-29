import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // In development, use emulator
  if (process.env.NODE_ENV === 'development') {
    // Set emulator host for server-side Firebase Admin SDK
    if (typeof window === 'undefined') {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    }
    
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    // In production, use real Firebase
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const db = admin.firestore();

export { admin, db }; 