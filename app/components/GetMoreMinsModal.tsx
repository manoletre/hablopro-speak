'use client';

import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { UserBilling, PLANS } from '../types/billing';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface GetMoreMinsModalProps {
  currentBilling: UserBilling;
  onClose: () => void;
}

export default function GetMoreMinsModal({ currentBilling, onClose }: GetMoreMinsModalProps) {
  const { createCheckout, priceIds } = useBilling();
  const { user } = useAuth();
  const { getLanguageCode, t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!priceIds?.payg) {
      alert('Price information not loaded. Please try again.');
      return;
    }

    if (!user?.uid) {
      alert('Please log in to make a purchase.');
      return;
    }

    try {
      setLoading(true);

      // Record payment status as processing (optional)
      try {
        await fetch('/api/billing/payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            status: 'processing',
            planType: 'payg',
            amount: PLANS.PAYG.price,
          }),
        });
      } catch (e) {
        console.error('Error setting payment status:', e);
      }

      // Use Paddle.js overlay if available
      if (typeof window !== 'undefined' && window.Paddle) {
        try {
          window.Paddle.Checkout.open({
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              locale: getLanguageCode(),
              successUrl: window.location.origin + '/learn?checkout=success',
            },
            items: [{ priceId: priceIds.payg, quantity: 1 }],
            customData: { user_id: user.uid },
            customer: user.email ? { email: user.email, name: user.displayName || undefined } : undefined,
          });
          // Leave modal open until overlay closes; we can close immediately
          onClose();
          return;
        } catch (paddleError) {
          console.error('Paddle overlay error:', paddleError);
        }
      }

      // If Paddle.js not available or overlay failed, fallback to server-generated checkout URL
      const checkout = await createCheckout('payg');
      window.open(checkout.checkoutUrl, '_blank');
      onClose();
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to create checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculatePricePerMinute = (price: number, minutes: number) => {
    const pricePerMinute = price / minutes;
    return `$${pricePerMinute.toFixed(3)}/min`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#422006]">{t('getMoreMins.title')}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {currentBilling.planType === 'annual' 
              ? t('getMoreMins.descriptionAnnual')
              : t('getMoreMins.descriptionMonthly')}
          </p>
        </div>

        {/* PAYG Option */}
        <div className="p-6">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#422006] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[#422006]">{t('upgrade.payAsYouGo')}</h3>
                <p className="text-gray-600 text-sm">{t('getMoreMins.addExtraMinutes')}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#422006]">{formatPrice(PLANS.PAYG.price)}</div>
                <div className="text-xs text-gray-500">{calculatePricePerMinute(PLANS.PAYG.price, Math.floor(PLANS.PAYG.seconds / 60))}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('getMoreMins.minutesAdded', { count: Math.floor(PLANS.PAYG.seconds / 60) })}
              </div>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="bg-[#422006] text-white px-4 py-2 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('upgrade.processing') : t('upgrade.buyNow')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 space-y-2">
            <p>{t('upgrade.creditsNeverExpire')}</p>
            <p>✓ {t('upgrade.useAcrossLanguages')}</p>
            <p>✓ {t('upgrade.cancelAnytime')}</p>
            <p className="text-xs text-gray-500 mt-3">
              {t('upgrade.paddleDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 