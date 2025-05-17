'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from './LanguageContext';
import { identifyUser } from '../lib/analytics';
import posthog from 'posthog-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { getLanguageCode } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Identify the user to PostHog when auth state changes
      if (user) {
        identifyUser(user.uid, {
          email: user.email || undefined,
          name: user.displayName || undefined
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Create user profile document on first sign-in
  useEffect(() => {
    if (!user) return;
    const initUserProfile = async () => {

      const lang = getLanguageCode();
      console.log('lang', lang);

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uiLanguage: lang,
          createdAt: serverTimestamp(),
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        });
      }
    };
    initUserProfile().catch((error) => {
      console.error('Error creating user profile:', error);
    });
  }, [user, getLanguageCode]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    try {
      // Reset PostHog identity before signing out
      posthog.reset();
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 