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
  const [mobileView, setMobileView] = useState<'subscription' | 'onetime'>('subscription');

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
      
      // Set payment status to processing
      try {
        await fetch('/api/billing/payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            status: 'processing',
            planType,
            amount: planType === 'payg' ? PLANS.PAYG.price : 
                   planType === 'monthly' ? PLANS.MONTHLY.price : PLANS.ANNUAL.price
          })
        });
      } catch (error) {
        console.error('Error setting payment status:', error);
      }
      
      // Use Paddle.js to open checkout as overlay
      if (typeof window !== 'undefined' && window.Paddle) {
        try {
          window.Paddle.Checkout.open({
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              locale: getLanguageCode(), // Use current UI language
              allowLogout: false,
              successUrl: window.location.origin + '/learn?checkout=success'
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
    return pricePerMinute;
  };

  const formatPricePerMinute = (price: number, seconds: number) => {
    const pricePerMinute = calculatePricePerMinute(price, seconds);
    return `$${pricePerMinute.toFixed(2)}`;
  };

  const CostProgressBar = ({ price, seconds }: { price: number; seconds: number }) => {
    const pricePerMinute = calculatePricePerMinute(price, seconds);
    const maxPrice = Math.max(
      calculatePricePerMinute(PLANS.PAYG.price, PLANS.PAYG.seconds),
      calculatePricePerMinute(PLANS.MONTHLY.price, PLANS.MONTHLY.seconds),
      calculatePricePerMinute(PLANS.ANNUAL.price, PLANS.ANNUAL.seconds)
    );
    const percentage = (pricePerMinute / maxPrice) * 100;
    
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-12 text-right font-mono">{formatPricePerMinute(price, seconds)}</span>
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#422006] rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const plans = [
    {
      id: 'annual',
      name: 'Annual',
      price: PLANS.ANNUAL.price,
      seconds: PLANS.ANNUAL.seconds,
      period: '/year',
      minutes: Math.floor(PLANS.ANNUAL.seconds / 60),
      extras: '2 months free',
      isBest: true,
      disabled: currentBilling.subscriptionStatus === 'active'
    },
    {
      id: 'monthly',
      name: 'Monthly', 
      price: PLANS.MONTHLY.price,
      seconds: PLANS.MONTHLY.seconds,
      period: '/month',
      minutes: Math.floor(PLANS.MONTHLY.seconds / 60),
      extras: 'minutes roll over¹',
      isBest: false,
      disabled: currentBilling.subscriptionStatus === 'active'
    },
    {
      id: 'payg',
      name: 'One-time',
      price: PLANS.PAYG.price,
      seconds: PLANS.PAYG.seconds,
      period: ' once',
      minutes: Math.floor(PLANS.PAYG.seconds / 60),
      extras: 'no rollover',
      isBest: false,
      disabled: false
    }
  ];

  const subscriptionPlans = plans.filter(p => p.id !== 'payg');
  const onetimePlan = plans.find(p => p.id === 'payg')!;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#422006]">{t('upgrade.title')}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  ⏳ {t('upgrade.description', { minutes: Math.floor(currentBilling.secondsRemaining / 60) })}
                </span>
                {currentBilling.subscriptionStatus === 'active' && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {t('upgrade.activeSubscription').replace(/[()]/g, '')}
                  </span>
                )}
              </div>
            </div>
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
        </div>

        {/* Mobile Toggle */}
        <div className="p-6 pb-0 md:hidden">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMobileView('subscription')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mobileView === 'subscription' 
                  ? 'bg-white text-[#422006] shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('upgrade.subscriptionPlans')}
            </button>
            <button
              onClick={() => setMobileView('onetime')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mobileView === 'onetime' 
                  ? 'bg-white text-[#422006] shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('upgrade.payAsYouGo')}
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="p-6 hidden md:block">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                <div>Plan</div>
                <div>Price</div>
                <div>{t('upgrade.minutes')}</div>
                <div>Cost/min</div>
                <div>Action</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`px-6 py-4 relative ${plan.isBest ? 'bg-slate-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}
                >
                  {plan.isBest && (
                    <div className="absolute -top-2 left-6 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {t('upgrade.bestValue')}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-5 gap-4 items-center">
                    {/* Plan Name */}
                    <div>
                      <div className="font-semibold text-[#422006]">
                        {plan.id === 'annual' ? t('upgrade.annualSubscription') : 
                         plan.id === 'monthly' ? t('upgrade.monthlySubscription') : 
                         t('upgrade.payAsYouGo')}
                      </div>
                      <div className="text-xs text-gray-500">{plan.extras}</div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-lg font-bold text-[#422006]">
                        {formatPrice(plan.price)}
                        <span className="text-sm font-normal text-gray-600">{plan.period}</span>
                      </div>
                    </div>

                    {/* Minutes */}
                    <div>
                      <div className="text-2xl font-bold text-[#422006]">
                        {plan.minutes.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{t('upgrade.minutes')}</div>
                    </div>

                    {/* Cost/min with progress bar */}
                    <div>
                      <CostProgressBar price={plan.price} seconds={plan.seconds} />
                    </div>

                    {/* Action */}
                    <div>
                      <button
                        onClick={() => handlePurchase(plan.id as 'payg' | 'monthly' | 'annual')}
                        disabled={loading === plan.id || plan.disabled}
                        className="w-full bg-[#422006] text-white px-4 py-2 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {loading === plan.id ? t('upgrade.processing') : 
                         plan.disabled && plan.id !== 'payg' ? t('upgrade.alreadySubscribed') : 
                         plan.id === 'payg' ? t('upgrade.buyNow') : t('upgrade.subscribe')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="p-6 md:hidden space-y-4">
          {mobileView === 'subscription' ? (
            subscriptionPlans.map((plan) => (
              <div key={plan.id} className={`border rounded-lg p-4 relative ${plan.isBest ? 'bg-slate-50 border-[#422006]' : 'border-gray-200'} hover:border-[#422006] transition-colors`}>
                {plan.isBest && (
                  <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {t('upgrade.bestValue')}
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-[#422006]">
                        {plan.id === 'annual' ? t('upgrade.annualSubscription') : t('upgrade.monthlySubscription')}
                      </h4>
                      <p className="text-xs text-gray-500">{plan.extras}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#422006]">
                        {formatPrice(plan.price)}
                        <span className="text-sm font-normal text-gray-600">{plan.period}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#422006]">{plan.minutes.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{t('upgrade.minutes')}</div>
                    </div>
                    <div>
                      <CostProgressBar price={plan.price} seconds={plan.seconds} />
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(plan.id as 'monthly' | 'annual')}
                    disabled={loading === plan.id || plan.disabled}
                    className="w-full bg-[#422006] text-white px-4 py-3 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading === plan.id ? t('upgrade.processing') : 
                     plan.disabled ? t('upgrade.alreadySubscribed') : t('upgrade.subscribe')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#422006] transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-[#422006]">{t('upgrade.payAsYouGo')}</h4>
                    <p className="text-xs text-gray-500">{onetimePlan.extras}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#422006]">
                      {formatPrice(onetimePlan.price)}
                      <span className="text-sm font-normal text-gray-600">{onetimePlan.period}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#422006]">{onetimePlan.minutes}</div>
                    <div className="text-xs text-gray-500">{t('upgrade.minutes')}</div>
                  </div>
                  <div>
                    <CostProgressBar price={onetimePlan.price} seconds={onetimePlan.seconds} />
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase('payg')}
                  disabled={loading === 'payg'}
                  className="w-full bg-[#422006] text-white px-4 py-3 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading === 'payg' ? t('upgrade.processing') : t('upgrade.buyNow')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">{t('upgrade.creditsNeverExpire')}</p>
            <p>{t('upgrade.useAcrossLanguages')}</p>
            <p>{t('upgrade.cancelAnytime')}</p>
            <div className="text-xs text-gray-500 space-y-1 mt-3">
              <p>¹ {t('upgrade.creditsNeverExpire')}</p>
              <p>² Annual plan saves 33% vs monthly ($0.04/min vs $0.06/min) and 50% vs one-time ($0.04/min vs $0.08/min)</p>
              <p>{t('upgrade.paddleDisclaimer')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 