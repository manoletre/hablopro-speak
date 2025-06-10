'use client';

interface TermsOfServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
}

export default function TermsOfServiceDialog({ isOpen, onClose, onOpenPrivacyPolicy }: TermsOfServiceDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#422006] dark:text-amber-200">
            Terms of Service
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Effective Date:</strong> July 1, 2025
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              1. Acceptance of Terms
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              By accessing or using hablo.pro (the &quot;Service&quot;), you agree to be bound by these Terms of Service (the &quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              2. Description of Service
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              hablo.pro enables users to converse with an AI-powered tutor designed to help you learn a new language through interactive spoken sessions. We offer:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-2">
              <li><strong>A free trial:</strong> up to 10 minutes of total conversation.</li>
              <li><strong>Monthly subscription:</strong> $12 USD/month for up to 250 minutes of conversation (unused minutes roll over to the following month).</li>
              <li><strong>Pay as you go:</strong> one‑time purchase of 150 extra minutes (no expiration) for $8 USD.</li>
              <li><strong>Annual subscription:</strong> $120 USD/year for up to 3,000 minutes per year.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              3. User Accounts
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-2">
              <li><strong>Eligibility:</strong> You must be at least 13 years old to use the Service.</li>
              <li><strong>Registration:</strong> You agree to provide accurate, complete, and up‑to‑date information when creating your account.</li>
              <li><strong>Credentials:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              4. Prohibited Uses
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You agree not to:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful, harmful, or abusive purpose.</li>
              <li>Attempt to reverse‑engineer, decompile, or otherwise extract any source code or underlying ideas.</li>
              <li>Upload or transmit any content that is infringing, defamatory, harassing, hateful, or violates any third party&apos;s rights.</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              5. Intellectual Property
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              All content, software, designs, and trademarks used by hablo.pro (including the AI tutor persona &quot;Nacho&quot;) are the property of hablo.pro or its licensors and are protected by copyright, trademark, and other laws.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>User Content:</strong> You retain ownership of the recordings and transcripts you create. By submitting User Content, you grant hablo.pro a worldwide, royalty‑free, sublicensable license to use, reproduce, modify, and display such content to operate and improve the Service.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              6. Privacy
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your use of the Service is also governed by our{' '}
              {onOpenPrivacyPolicy ? (
                <button
                  onClick={onOpenPrivacyPolicy}
                  className="text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              ) : (
                <a href="/privacy-policy" className="text-amber-600 hover:text-amber-700 underline">
                  Privacy Policy
                </a>
              )}
              , which is incorporated by reference and can be found at: https://hablo.pro/privacy-policy. Please review it to understand how we collect, use, and share your personal data.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              7. Limitation of Liability
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL hablo.pro BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              OUR AGGREGATE LIABILITY FOR CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE TOTAL AMOUNTS PAID BY YOU TO hablo.pro IN THE SIX (6) MONTHS PRIOR TO THE CLAIM.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              8. Termination
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may suspend or terminate your access to the Service at any time for breach of these Terms or for any other reason, with or without notice.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upon termination, your right to use the Service immediately ceases. You may request deletion of your account and personal data as described in our Privacy Policy.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              9. Changes to Terms
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We reserve the right to modify these Terms at any time. When we make material changes, we will notify you via email or in‑app notification and update the &quot;Effective Date&quot; at the top. Your continued use of the Service after notice constitutes acceptance of the revised Terms.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              10. Contact Information
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you have any questions or concerns about these Terms, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Email: contact@hablo.pro
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 