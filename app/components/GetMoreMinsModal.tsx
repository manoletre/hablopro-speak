'use client';

import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { UserBilling, PLANS } from '../types/billing';

interface GetMoreMinsModalProps {
  currentBilling: UserBilling;
  onClose: () => void;
}

export default function GetMoreMinsModal({ currentBilling, onClose }: GetMoreMinsModalProps) {
  const { createCheckout } = useBilling();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const checkout = await createCheckout('payg');
      
      // Use LemonSqueezy overlay if available, otherwise open in new window
      if (typeof window !== 'undefined' && (window as typeof window & { LemonSqueezy: { Url: { Open: (url: string) => void } } }).LemonSqueezy) {
        ((window as typeof window & { LemonSqueezy: { Url: { Open: (url: string) => void } } }).LemonSqueezy.Url.Open(checkout.checkoutUrl));
      } else {
        // Fallback to new window
        window.open(checkout.checkoutUrl, '_blank');
      }
      
      // Close the modal since checkout is opening
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
            <h2 className="text-xl font-semibold text-[#422006]">Get More Minutes</h2>
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
            Add more minutes to your existing {currentBilling.planType} subscription.
          </p>
        </div>

        {/* PAYG Option */}
        <div className="p-6">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-[#422006] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-[#422006]">{PLANS.PAYG.name}</h3>
                <p className="text-gray-600 text-sm">Add extra minutes to your account</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#422006]">{formatPrice(PLANS.PAYG.price)}</div>
                <div className="text-xs text-gray-500">{calculatePricePerMinute(PLANS.PAYG.price, PLANS.PAYG.minutes)}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{PLANS.PAYG.minutes} minutes</span> added to your account
              </div>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="bg-[#422006] text-white px-4 py-2 rounded-lg hover:bg-[#5a3108] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 space-y-2">
            <p>✓ Minutes never expire</p>
            <p>✓ Added instantly to your account</p>
            <p>✓ Use alongside your existing subscription</p>
            <p className="text-xs text-gray-500 mt-3">
              Payments are processed securely by LemonSqueezy. You&apos;ll be redirected to complete your purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 