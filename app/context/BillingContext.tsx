'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserBilling, CheckoutRequest, CheckoutResponse } from '../types/billing';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BillingContextType {
  billing: UserBilling | null;
  loading: boolean;
  error: string | null;
  hasEnoughMinutes: (minutes: number) => boolean;
  createCheckout: (planType: 'payg' | 'monthly' | 'annual') => Promise<CheckoutResponse>;
  priceIds: Record<string, string> | null;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [billing, setBilling] = useState<UserBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceIds, setPriceIds] = useState<Record<string, string> | null>(null);

  // Fetch price IDs
  const fetchPriceIds = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/checkout');
      if (!response.ok) {
        throw new Error('Failed to fetch price IDs');
      }
      const ids = await response.json();
      setPriceIds(ids);
    } catch (err) {
      console.error('Error fetching price IDs:', err);
    }
  }, []);

  // Subscribe to billing document in real-time using Firebase only
  useEffect(() => {
    if (!user?.uid) {
      setBilling(null);
      setLoading(false);
      return;
    }

    console.log(`🔥 Setting up Firebase real-time listener for user: ${user.uid}`);
    setLoading(true);
    setError(null);

    const billingDocRef = doc(db, 'users', user.uid, 'billing', 'current');
    const unsubscribe = onSnapshot(
      billingDocRef, 
      (snapshot) => {
        console.log(`🔥 Firebase billing update received for user: ${user.uid}`);
        
        if (snapshot.exists()) {
          const data = snapshot.data() as import('../types/billing').FirebaseDocumentData;
          
          // Handle legacy migration from minutes to seconds
          let secondsRemaining = data.secondsRemaining || 0;
          let totalSecondsPurchased = data.totalSecondsPurchased || 0;
          
          if (data.minutesRemaining !== undefined && data.secondsRemaining === undefined) {
            console.log(`🔄 Migrating user ${user.uid} from minutes to seconds in real-time`);
            secondsRemaining = data.minutesRemaining * 60;
            totalSecondsPurchased = (data.totalMinutesPurchased || 0) * 60;
          }
          
          const billingData: UserBilling = {
            ...data,
            secondsRemaining,
            totalSecondsPurchased,
            lastUpdated: (data.lastUpdated && typeof data.lastUpdated !== 'string' && 'toDate' in data.lastUpdated) 
              ? data.lastUpdated.toDate() 
              : new Date(),
            subscriptionEndsAt: (data.subscriptionEndsAt && typeof data.subscriptionEndsAt !== 'string' && 'toDate' in data.subscriptionEndsAt) 
              ? data.subscriptionEndsAt.toDate() 
              : undefined,
            subscriptionRenewsAt: (data.subscriptionRenewsAt && typeof data.subscriptionRenewsAt !== 'string' && 'toDate' in data.subscriptionRenewsAt) 
              ? data.subscriptionRenewsAt.toDate() 
              : undefined,
          } as UserBilling;
          
          setBilling(billingData);
          console.log(`🔥 Billing updated: ${Math.floor(billingData.secondsRemaining / 60)} minutes remaining`);
        } else {
          // Initialize with free trial if document doesn't exist
          console.log(`🔥 No billing document found for user ${user.uid}, initializing with free trial`);
          const initialBilling: UserBilling = {
            secondsRemaining: 10 * 60, // 10 minutes
            totalSecondsPurchased: 10 * 60,
            subscriptionStatus: 'none',
            lastUpdated: new Date(),
          };
          setBilling(initialBilling);
        }
        
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('🔥 Firebase billing listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log(`🔥 Cleaning up Firebase listener for user: ${user.uid}`);
      unsubscribe();
    };
  }, [user?.uid]);

  // Fetch price IDs only once when provider mounts
  useEffect(() => {
    fetchPriceIds();
  }, [fetchPriceIds]);

  // Check if user has enough minutes (converts to seconds internally)
  const hasEnoughMinutes = useCallback((requiredMinutes: number): boolean => {
    const requiredSeconds = requiredMinutes * 60;
    return billing ? billing.secondsRemaining >= requiredSeconds : false;
  }, [billing]);

  // Create checkout session
  const createCheckout = useCallback(async (planType: 'payg' | 'monthly' | 'annual'): Promise<CheckoutResponse> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    if (!priceIds) {
      throw new Error('Price IDs not loaded');
    }

    let priceId: string;
    switch (planType) {
      case 'payg':
        priceId = priceIds.payg;
        break;
      case 'monthly':
        priceId = priceIds.monthly;
        break;
      case 'annual':
        priceId = priceIds.annual;
        break;
      default:
        throw new Error('Invalid plan type');
    }

    const checkoutRequest: CheckoutRequest = {
      priceId,
      userId: user.uid,
      email: user.email || undefined,
      name: user.displayName || undefined,
    };

    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout');
    }

    return response.json();
  }, [user, priceIds]);

  return (
    <BillingContext.Provider value={{
      billing,
      loading,
      error,
      hasEnoughMinutes,
      createCheckout,
      priceIds,
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
} 