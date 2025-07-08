'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useBilling } from '../hooks/useBilling';
import { useAuth } from '../context/AuthContext';
import { OPEN_SIDEBAR_EVENT } from './HomeScreen';

interface UpgradeSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Confetti particle component
const ConfettiParticle = ({ delay, duration, color }: { delay: number; duration: number; color: string }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isAnimating) return;
    
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, isAnimating]);

  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;

  return (
    <div
      className={`absolute w-3 h-3 opacity-80 transition-all ease-out ${isAnimating ? 'opacity-0' : 'translate-y-0'}`}
      style={{
        left: `${randomX}%`,
        top: '-20px',
        backgroundColor: color,
        transform: `rotate(${randomRotation}deg) ${isAnimating ? 'translateY(100vh)' : 'translateY(0)'}`,
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
      }}
    />
  );
};

export default function UpgradeSuccessDialog({ isOpen, onClose }: UpgradeSuccessDialogProps) {
  const { t } = useLanguage();
  const { billing, loading } = useBilling();
  const { user } = useAuth();
  const [minutes, setMinutes] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'completed' | 'failed' | null>(null);
  const [paymentCheckCount, setPaymentCheckCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const checkPaymentStatus = useCallback(async () => {
    // Firebase real-time listener will automatically update billing data
    
    // Check if subscription became active (this indicates successful payment for subscriptions)
    if (billing?.subscriptionStatus === 'active') {
      setPaymentStatus('completed');
      if (!showConfetti) {
        setShowConfetti(true);
      }
      return;
    }
    
    // Update local state with latest billing data
    if (billing?.recentPaymentStatus) {
      setPaymentStatus(billing.recentPaymentStatus);
      
      // Show confetti for successful payments
      if (billing.recentPaymentStatus === 'completed' && !showConfetti) {
        setShowConfetti(true);
      }
    }
  }, [billing?.subscriptionStatus, billing?.recentPaymentStatus, showConfetti]);

  // Check payment status periodically when dialog is open
  useEffect(() => {
    if (!isOpen) return; 
    
    // Initial check
    checkPaymentStatus();
    
    // Start polling for updates - check both payment status and subscription status
    const interval: NodeJS.Timeout = setInterval(() => {
      // Stop polling if we've already detected success
      if (paymentStatus === 'completed' || billing?.subscriptionStatus === 'active') {
        clearInterval(interval);
        return;
      }
      
      setPaymentCheckCount(prev => prev + 1);
      checkPaymentStatus();
    }, 2000); // Check every 2 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, paymentStatus, billing?.subscriptionStatus, checkPaymentStatus]);

  // Stop polling after 30 attempts (1 minute) and assume failure if no subscription detected
  useEffect(() => {
    if (paymentCheckCount >= 30 && paymentStatus === 'processing' && billing?.subscriptionStatus !== 'active') {
      setPaymentStatus('failed');
    }
  }, [paymentCheckCount, paymentStatus, billing?.subscriptionStatus]);

  useEffect(() => {
    if (billing) {
      setMinutes(Math.floor(billing.secondsRemaining / 60));
      if (billing.recentPaymentStatus) {
        setPaymentStatus(billing.recentPaymentStatus);
      }
    }
  }, [billing]);

  const handleClose = async () => {
    // Clear payment status when closing
    if (user?.uid && paymentStatus && paymentStatus !== 'processing') {
      try {
        await fetch(`/api/billing/payment-status?userId=${user.uid}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error clearing payment status:', error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  // Generate confetti particles
  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }));

  const renderContent = () => {
    // Determine current status with improved logic
    let currentStatus = paymentStatus || billing?.recentPaymentStatus;
    
    // If we have an active subscription, consider payment completed
    if (billing?.subscriptionStatus === 'active' && !currentStatus) {
      currentStatus = 'completed';
    }
    
    // If no status and still loading, show processing
    if (!currentStatus && loading) {
      currentStatus = 'processing';
    }
    
    // If no status after timeout period, show failed
    if (!currentStatus && paymentCheckCount >= 15) { // Reduced from 30 to 15 attempts (30 seconds)
      currentStatus = 'failed';
    }
    
    // Default to processing if no status yet
    if (!currentStatus) {
      currentStatus = 'processing';
    }

    switch (currentStatus) {
      case 'processing':
        return (
          <div className="space-y-4">
            {/* Processing Icon */}
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>

            <h2 className="text-2xl font-semibold text-[#422006] mb-2">
              Processing Payment...
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your payment is being processed. This usually takes a few seconds.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-700 mb-1">
                Status
              </div>
              <div className="text-lg font-medium text-blue-700">
                Processing payment...
              </div>
            </div>

            <button
              disabled
              className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
            >
              Please wait...
            </button>
          </div>
        );

      case 'failed':
        return (
          <div className="space-y-4">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-[#422006] mb-2">
              Payment Failed
            </h2>
            
            <p className="text-gray-600 mb-6">
              There was an issue processing your payment. Please try again or contact support.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-red-700 mb-1">
                Status
              </div>
              <div className="text-lg font-medium text-red-700">
                Payment failed
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#422006] text-white rounded-lg hover:bg-[#5a3108] transition-colors font-medium"
              >
                Try Again
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact us at{' '}
                <a href="mailto:contact@hablo.pro" className="text-[#422006] underline">
                  contact@hablo.pro
                </a>
              </p>
            </div>
          </div>
        );

      case 'completed':
      default:
        return (
          <div className="space-y-4">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-[#422006] mb-2">
              {t('upgradeSuccess.title')}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {t('upgradeSuccess.description', { minutes })}
            </p>

            {/* Current Balance Display */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-[#422006]/70 mb-1">
                {t('upgradeSuccess.currentBalance')}
              </div>
              <div className="text-2xl font-bold text-[#422006]">
                {minutes} {t('upgradeSuccess.minutes')}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Dispatch event to open sidebar
                  window.dispatchEvent(new Event(OPEN_SIDEBAR_EVENT));
                  handleClose();
                }}
                className="w-full py-3 bg-[#422006] text-white rounded-lg hover:bg-[#5a3108] transition-colors font-medium"
              >
                See Plan
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                Need help? Contact us at{' '}
                <a href="mailto:contact@hablo.pro" className="text-[#422006] underline">
                  contact@hablo.pro
                </a>
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Confetti Background - only show for successful payments */}
      {showConfetti && paymentStatus === 'completed' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              duration={particle.duration}
              color={particle.color}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <div className="bg-white rounded-lg max-w-md w-full relative z-10 overflow-hidden">
        {/* Header with close button */}
        <div className="p-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {renderContent()}
        </div>
      </div>
    </div>
  );
} 