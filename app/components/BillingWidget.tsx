'use client';

import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { PLANS } from '../types/billing';
import UpgradeModal from './UpgradeModal';
import GetMoreMinsModal from './GetMoreMinsModal';
import { formatSecondsForDisplay } from '../lib/timeUtils';
import { useLanguage } from '../context/LanguageContext';

interface BillingWidgetProps {
  className?: string;
}

export default function BillingWidget({ className = '' }: BillingWidgetProps) {
  const { billing, loading } = useBilling();
  const { t } = useLanguage();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGetMoreMinsModal, setShowGetMoreMinsModal] = useState(false);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-amber-200 rounded mb-2"></div>
        <div className="h-2 bg-amber-200 rounded mb-2"></div>
        <div className="h-8 bg-amber-200 rounded"></div>
      </div>
    );
  }

  if (!billing) {
    return null;
  }

  // Calculate progress percentage based on seconds
  const maxSeconds = Math.max(billing.totalSecondsPurchased, PLANS.FREE.seconds);
  const progressPercentage = Math.max(0, Math.min(100, (billing.secondsRemaining / maxSeconds) * 100));
  
  // Determine color based on remaining minutes
  const getProgressColor = () => {
    if (progressPercentage > 50) return 'bg-green-500';
    if (progressPercentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <>
      <div className={`p-4 bg-amber-50 rounded-lg border border-amber-200 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-lg mr-2">⏰</span>
            <span className="text-sm font-medium text-[#422006]">{t('billing.speakingTime')}</span>
          </div>
          {billing.subscriptionStatus === 'active' && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              {billing.planType === 'monthly' ? t('billing.monthly') : t('billing.annual')}
            </span>
          )}
        </div>

        {/* Time remaining */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-lg font-semibold text-[#422006]">
              {formatSecondsForDisplay(billing.secondsRemaining)}
            </span>
            <span className="text-xs text-[#422006]/60">
              {t('billing.of')} {formatSecondsForDisplay(maxSeconds)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-amber-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status message */}
        {billing.secondsRemaining <= 0 ? (
          <div className="text-xs text-red-600 mb-3">
            {t('billing.outOfTime')}
          </div>
        ) : billing.secondsRemaining <= 300 ? ( // 5 minutes = 300 seconds
          <div className="text-xs text-yellow-600 mb-3">
            {t('billing.runningLow')}
          </div>
        ) : null}

        {/* Action buttons */}
        {billing.subscriptionStatus === 'active' ? (
          <div className="space-y-2">
            <button
              onClick={() => setShowGetMoreMinsModal(true)}
                          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              billing.secondsRemaining <= 300 // 5 minutes = 300 seconds
                ? 'bg-[#422006] text-white hover:bg-[#5a3108]'
                : 'bg-amber-100 text-[#422006] hover:bg-amber-200 border border-amber-300'
            }`}
          >
            {billing.secondsRemaining <= 0 ? t('billing.getMoreTime') : t('billing.getMoreMins')}
            </button>
            <button
              onClick={() => {
                if (billing.customerPortalUrl) {
                  window.open(billing.customerPortalUrl, '_blank');
                } else {
                  // Fallback to general customer portal
                  window.open(`https://hablopro.lemonsqueezy.com/billing`, '_blank');
                }
              }}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
            >
              {t('billing.managePlan')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              billing.secondsRemaining <= 300 // 5 minutes = 300 seconds
                ? 'bg-[#422006] text-white hover:bg-[#5a3108]'
                : 'bg-amber-100 text-[#422006] hover:bg-amber-200 border border-amber-300'
            }`}
          >
            {billing.secondsRemaining <= 0 ? t('billing.getMoreTime') : t('billing.upgradePlan')}
          </button>
        )}

        {/* Subscription info */}
        {billing.subscriptionStatus === 'active' && billing.subscriptionRenewsAt && (
          <div className="mt-2 text-xs text-[#422006]/60 text-center">
            {t('billing.renews', { date: billing.subscriptionRenewsAt.toLocaleDateString() })}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          currentBilling={billing}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Get More Mins Modal */}
      {showGetMoreMinsModal && (
        <GetMoreMinsModal
          currentBilling={billing}
          onClose={() => setShowGetMoreMinsModal(false)}
        />
      )}
    </>
  );
} 