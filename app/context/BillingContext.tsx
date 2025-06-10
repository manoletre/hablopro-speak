'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserBilling, CheckoutRequest, CheckoutResponse } from '../types/billing';

interface BillingContextType {
  billing: UserBilling | null;
  loading: boolean;
  error: string | null;
  refreshBilling: () => Promise<void>;
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

  // Fetch user billing information
  const fetchBilling = useCallback(async () => {
    if (!user?.uid) {
      setBilling(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/billing/user?userId=${user.uid}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing information');
      }
      
      const billingData: UserBilling = await response.json();
      
      // Convert date strings back to Date objects
      setBilling({
        ...billingData,
        lastUpdated: new Date(billingData.lastUpdated),
        subscriptionEndsAt: billingData.subscriptionEndsAt 
          ? new Date(billingData.subscriptionEndsAt) 
          : undefined,
        subscriptionRenewsAt: billingData.subscriptionRenewsAt 
          ? new Date(billingData.subscriptionRenewsAt) 
          : undefined,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching billing:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

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

  // Initial fetch when user changes
  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

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
      refreshBilling: fetchBilling,
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