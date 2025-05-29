'use client';

interface PrivacyPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyDialog({ isOpen, onClose }: PrivacyPolicyDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#422006] dark:text-amber-200">
            Privacy Policy
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
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              hablo.pro (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and safeguard your information in compliance with applicable laws, including the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), the Children&apos;s Online Privacy Protection Act (COPPA), and the California Online Privacy Protection Act (CalOPPA).
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              1. Information We Collect
            </h3>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              1.1 Account Information
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Email address, display name, profile photo URL, Google user ID, authentication timestamps (via <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">Firebase Authentication</a>).
            </p>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              1.2 User-Generated Content
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Voice recordings (processed in real time and not stored permanently). Conversation transcripts (stored in <a href="https://firebase.google.com/terms/data-processing-terms" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">Firestore</a> for progress tracking). Language preferences, difficulty settings, bookmarked grammar/vocabulary items.
            </p>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              1.3 Usage Analytics
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Session start/end times, duration, completion status, learning streaks, interaction events, page views (tracked via <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">PostHog Analytics</a>).
            </p>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              1.4 Technical Data
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Time zone offset, UI language preference, browser and device information.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              2. How We Use Your Information
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5">
              <li>Provide and improve hablo.pro services, including AI-driven language tutoring and feedback.</li>
              <li>Personalize your learning experience by recommending content and adjusting difficulty.</li>
              <li>Analyze usage trends and perform analytics for product development.</li>
              <li>Communicate with you regarding service updates, newsletters, and customer support.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              3. Third-Party Services
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We share data only as necessary with the following providers:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-2">
              <li>
                <strong>Firebase:</strong> Authentication, data storage, and server-side processing.<br/>
                Privacy: <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://firebase.google.com/support/privacy</a><br/>
                Data Processing Terms: <a href="https://firebase.google.com/terms/data-processing-terms" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://firebase.google.com/terms/data-processing-terms</a>
              </li>
              <li>
                <strong>OpenAI:</strong> Voice-to-text (Whisper) and AI feedback (GPT-4).<br/>
                Privacy: <a href="https://openai.com/policies/row-privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://openai.com/policies/row-privacy-policy/</a><br/>
                Data Usage FAQ: <a href="https://help.openai.com/articles/7039943-data-usage-for-consumer-services-faq" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://help.openai.com/articles/7039943-data-usage-for-consumer-services-faq</a>
              </li>
              <li>
                <strong>PostHog:</strong> User behavior and performance analytics.<br/>
                Privacy: <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://posthog.com/privacy</a>
              </li>
              <li>
                <strong>AWS (Amazon SES):</strong> Welcome and notification email delivery.<br/>
                Privacy: <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://aws.amazon.com/privacy/</a>
              </li>
              <li>
                <strong>Vercel:</strong> Hosting, CDN, and image optimization.<br/>
                Privacy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://vercel.com/legal/privacy-policy</a><br/>
                Cookie Policy: <a href="https://vercel.com/legal/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://vercel.com/legal/cookie-policy</a>
              </li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              4. Data Retention
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5">
              <li>Voice recordings are processed transiently and not stored.</li>
              <li>Transcripts and account data are retained until you request deletion or close your account.</li>
              <li>Analytics data are stored for up to 36 months to monitor long-term trends.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              5. Cookies & Tracking Technologies
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We use cookies and similar technologies to operate and optimize our services. You can manage your cookie preferences via the Cookie Settings page in the app. For details on California&apos;s cookie requirements, see <a href="https://oag.ca.gov/privacy/caloppa" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">CalOPPA</a>.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              6. Your Rights
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Depending on your jurisdiction, you may:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5">
              <li>Access, correct, or delete your personal data.</li>
              <li>Restrict or object to processing of your data.</li>
              <li>Withdraw consent at any time.</li>
              <li>Receive a copy of your data in a portable format.</li>
              <li>Opt out of the sale or sharing of personal information (California CCPA).</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              To exercise these rights, contact us at privacy@hablo.pro. For California residents, see <a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">CCPA Information</a>.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              7. Children&apos;s Privacy
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              hablo.pro is intended for users aged 16 and older. We do not knowingly collect personal data from children under 13, in accordance with <a href="https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">COPPA</a>. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              8. International Data Transfers
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your data may be transferred to and processed in the United States and other countries. We use safeguards such as EU Standard Contractual Clauses to protect your data, in compliance with the <a href="https://gdpr-info.eu/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">GDPR</a>.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              9. Security Measures
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We implement industry-standard security measures, including encryption in transit (TLS) and at rest (AES-256), Firebase Security Rules, SOC- and ISO-certified AWS infrastructure, and DDoS mitigation provided by Vercel.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              10. Changes to This Policy
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We review and update this Privacy Policy at least annually. Material changes will be reflected by updating the &quot;Effective Date&quot; and publishing the revised policy.
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              11. Contact Us
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              hablo.pro<br/>
              Attn: Privacy Officer<br/>
              Email: privacy@hablo.pro
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              12. Governing Law
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This policy is governed by the privacy laws of Colombia. EU residents have additional rights under the GDPR. California residents have rights under the CCPA.
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