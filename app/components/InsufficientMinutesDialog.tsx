'use client';

import { useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import UpgradeModal from './UpgradeModal';
import { formatSecondsForDisplay } from '../lib/timeUtils';

interface InsufficientMinutesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  showUpgradeOption?: boolean;
}

export default function InsufficientMinutesDialog({ 
  isOpen, 
  onClose, 
  title = "Insufficient Minutes",
  message = "You need at least 1 minute of speaking time to start a conversation.",
  showUpgradeOption = true
}: InsufficientMinutesDialogProps) {
  const { billing } = useBilling();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    if (billing) {
      setShowUpgradeModal(true);
    }
  };

  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false);
    onClose(); // Also close the main dialog when upgrade modal closes
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg p-6 relative max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
            
            <h2 className="text-xl font-medium text-center mb-2 text-[#422006] pr-8">
              {title}
            </h2>
            
            <p className="text-center mb-4 text-[#422006]/80">
              {message}
            </p>

            {billing && (
              <p className="text-center mb-6 text-sm text-[#422006]/60">
                You currently have {formatSecondsForDisplay(billing.secondsRemaining)} remaining.
              </p>
            )}
            
            <div className="flex flex-col space-y-2">
              {showUpgradeOption && (
                <button 
                  onClick={handleUpgradeClick}
                  className="w-full py-3 bg-[#422006] text-white rounded-lg hover:bg-[#5a3108] transition-colors font-medium"
                >
                  Upgrade Plan
                </button>
              )}
              
              <button 
                onClick={onClose}
                className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && billing && (
        <UpgradeModal
          currentBilling={billing}
          onClose={handleUpgradeModalClose}
        />
      )}
    </>
  );
} 