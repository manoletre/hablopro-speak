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
    // In production, use service account credentials from environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // Debug logging (don't log the actual private key for security)
    console.log('Firebase Admin SDK Debug Info:');
    console.log('- Project ID:', projectId ? 'Set' : 'Missing');
    console.log('- Client Email:', clientEmail ? 'Set' : 'Missing');
    console.log('- Private Key:', privateKey ? `Set (${privateKey.length} chars)` : 'Missing');
    
    if (!privateKey || !clientEmail || !projectId) {
      const missingVars = [];
      if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      
      throw new Error(`Firebase service account credentials are not properly configured. Missing: ${missingVars.join(', ')}`);
    }
    
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }
}

const db = admin.firestore();

export { admin, db }; 