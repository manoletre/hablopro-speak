'use client';

import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserBilling, PLANS } from '../types/billing';

interface UpgradeModalProps {
  currentBilling: UserBilling;
  onClose: () => void;
}

export default function UpgradeModal({ currentBilling, onClose }: UpgradeModalProps) {
  const { priceIds } = useBilling();
  const { user } = useAuth();
  const { getLanguageCode, t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (planType: 'payg' | 'monthly' | 'annual') => {
    if (!priceIds) {
      alert('Price information not loaded. Please try again.');
      return;
    }

    if (!user?.uid) {
      alert('Please log in to make a purchase.');
      return;
    }

    // Prevent multiple subscriptions
    if ((planType === 'monthly' || planType === 'annual') && currentBilling.subscriptionStatus === 'active') {
      alert('You already have an active subscription. You can only purchase additional minutes (Pay as you go) while subscribed.');
      return;
    }

    try {
      setLoading(planType);
      
      // Get the correct price ID
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

      console.log('Opening Paddle checkout with priceId:', priceId);
      
      // Use Paddle.js to open checkout as overlay
      if (typeof window !== 'undefined' && (window as any).Paddle) {
        try {
          (window as any).Paddle.Checkout.open({
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              locale: getLanguageCode(), // Use current UI language
              allowLogout: false,
              successUrl: window.location.origin + '/dashboard?checkout=success'
            },
            items: [{
              priceId: priceId,
              quantity: 1
            }],
            customData: {
              user_id: user.uid
            },
            customer: user.email ? {
              email: user.email,
              name: user.displayName || undefined
            } : undefined
          });
          
          // Don't close modal immediately - wait for checkout completion
        } catch (error) {
          console.error('Paddle checkout error:', error);
          // Create fallback checkout URL - use the API to get a proper checkout URL
          try {
            const fallbackResponse = await fetch('/api/billing/checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                priceId: priceId,
                userId: user.uid,
                email: user.email || undefined,
                name: user.displayName || undefined,
              }),
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              window.open(fallbackData.checkoutUrl, '_blank');
            }
          } catch (fallbackError) {
            console.error('Fallback checkout error:', fallbackError);
            alert('Failed to open checkout. Please try again.');
          }
          onClose();
        }
      } else {
        // Fallback to new window if Paddle.js is not loaded - create a checkout URL
        console.log('Paddle.js not available, creating checkout URL');
        try {
          const fallbackResponse = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              priceId: priceId,
              userId: user.uid,
              email: user.email || undefined,
              name: user.displayName || undefined,
            }),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            window.open(fallbackData.checkoutUrl, '_blank');
          } else {
            throw new Error('Failed to create checkout URL');
          }
        } catch (fallbackError) {
          console.error('Fallback checkout error:', fallbackError);
          alert('Failed to create checkout. Please try again.');
        }
        onClose();
      }
      
    } catch (error) {
      console.error('Error opening checkout:', error);
      alert('Failed to open checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const calculatePricePerMinute = (price: number, seconds: number) => {
    const minutes = seconds / 60;
    const pricePerMinute = price / minutes;
    return `$${pricePerMinute.toFixed(3)}/min`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#422006]">{t('upgrade.title')}</h2>
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
            {t('upgrade.description', { minutes: Math.floor(currentBilling.secondsRemaining / 60) })}
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-[#422006] mb-4">
            {t('upgrade.subscriptionPlans')}
            {currentBilling.subscriptionStatus === 'active' && (
              <span className="ml-2 text-sm font-normal text-green-600">{t('upgrade.activeSubscription')}</span>
            )}
          </h3>
          <div className="space-y-4">
            {/* Monthly Subscription */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#422006] transition-colors relative">
              {currentBilling.subscriptionStatus !== 'active' && (
                <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {t('upgrade.popular')}
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-[#422006]">{t('upgrade.monthlySubscription')}</h4>
                  <p className="text-gray-600 text-sm">{t('upgrade.regularLearners')}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#422006]">
                    {formatPrice(PLANS.MONTHLY.price)}<span className="text-sm font-normal">{t('upgrade.perMonth')}</span>
                  </div>
                  <div className="text-xs text-gray-500">{calculatePricePerMinute(PLANS.MONTHLY.price, PLANS.MONTHLY.seconds)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{Math.floor(PLANS.MONTHLY.seconds / 60)} {t('upgrade.minutes')}</span> {t('upgrade.perMonthText')}
                </div>
                <button
                  onClick={() => handlePurchase('monthly')}
                  disabled={loading === 'monthly' || currentBilling.subscriptionStatus === 'active'}
                  className="bg-[#422006] text-white px-4 py-2 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'monthly' ? t('upgrade.processing') : 
                   currentBilling.subscriptionStatus === 'active' ? t('upgrade.alreadySubscribed') : t('upgrade.subscribe')}
                </button>
              </div>
            </div>

            {/* Annual Subscription */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#422006] transition-colors relative">
              <div className="absolute -top-2 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {t('upgrade.bestValue')}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-[#422006]">{t('upgrade.annualSubscription')}</h4>
                  <p className="text-gray-600 text-sm">{t('upgrade.committedLearners')}</p>
                  <p className="text-green-600 text-xs mt-1">
                    {t('upgrade.saveVsMonthly', { amount: formatPrice((PLANS.MONTHLY.price * 12) - PLANS.ANNUAL.price) })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#422006]">
                    {formatPrice(PLANS.ANNUAL.price)}<span className="text-sm font-normal">{t('upgrade.perYear')}</span>
                  </div>
                  <div className="text-xs text-gray-500">{calculatePricePerMinute(PLANS.ANNUAL.price, PLANS.ANNUAL.seconds)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{Math.floor(PLANS.ANNUAL.seconds / 60)} {t('upgrade.minutes')}</span> {t('upgrade.perYearText')}
                </div>
                <button
                  onClick={() => handlePurchase('annual')}
                  disabled={loading === 'annual' || currentBilling.subscriptionStatus === 'active'}
                  className="bg-[#422006] text-white px-4 py-2 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'annual' ? t('upgrade.processing') : 
                   currentBilling.subscriptionStatus === 'active' ? t('upgrade.alreadySubscribed') : t('upgrade.subscribe')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <div className="px-4 text-sm text-gray-500 bg-white">{t('upgrade.orPayOnce')}</div>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>
        </div>

        {/* One-time Payment */}
        <div className="p-6 pt-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#422006] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-lg font-semibold text-[#422006]">{t('upgrade.payAsYouGo')}</h4>
                <p className="text-gray-600 text-sm">{t('upgrade.occasionalUse')}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#422006]">{formatPrice(PLANS.PAYG.price)}</div>
                <div className="text-xs text-gray-500">{calculatePricePerMinute(PLANS.PAYG.price, PLANS.PAYG.seconds)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{Math.floor(PLANS.PAYG.seconds / 60)} {t('upgrade.minutes')}</span> {t('upgrade.speakingTime')}
              </div>
              <button
                onClick={() => handlePurchase('payg')}
                disabled={loading === 'payg'}
                className="bg-[#422006] text-white px-4 py-2 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'payg' ? t('upgrade.processing') : t('upgrade.buyNow')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 space-y-2">
            <p>{t('upgrade.creditsNeverExpire')}</p>
            <p>{t('upgrade.useAcrossLanguages')}</p>
            <p>{t('upgrade.cancelAnytime')}</p>
            <p className="text-xs text-gray-500 mt-3">
              {t('upgrade.paddleDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 