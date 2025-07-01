'use client';

import { useLanguage } from '../context/LanguageContext';

interface TermsOfServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenRefundPolicy?: () => void;
  isSpanish?: boolean;
}

export default function TermsOfServiceDialog({ isOpen, onClose, onOpenPrivacyPolicy, onOpenRefundPolicy, isSpanish: propIsSpanish }: TermsOfServiceDialogProps) {
  const { language, setLanguage } = useLanguage();
  
  if (!isOpen) return null;

  // Use context language if propIsSpanish is not provided, otherwise use prop
  const isSpanish = propIsSpanish !== undefined ? propIsSpanish : language === 'español';

  const handleLanguageSwitch = () => {
    const newLanguage = isSpanish ? 'english' : 'español';
    setLanguage(newLanguage);
    // Also save to localStorage
    localStorage.setItem('uiLanguage', newLanguage);
  };

      const content = isSpanish ? {
    title: "Términos y Condiciones",
    availableIn: "También disponible en inglés en nuestro sitio web principal.",
    effectiveDate: "Fecha de vigencia:",
    close: "Cerrar",
    privacyPolicy: "Política de Privacidad",
    refundPolicy: "Política de Reembolso",
    sections: {
      acceptance: {
        title: "1. Aceptación de los Términos",
        content: "Al acceder o usar hablo.pro (Manuel Cardenas Prieto) (el \"Servicio\"), usted acepta estar sujeto a estos Términos y Condiciones (los \"Términos\"). Si no acepta estos Términos, por favor no use el Servicio."
      },
      description: {
        title: "2. Descripción del Servicio",
        content: "hablo.pro permite a los usuarios conversar con un tutor impulsado por IA diseñado para ayudarte a aprender un nuevo idioma a través de sesiones interactivas habladas. Ofrecemos:",
        features: [
          "Prueba gratuita: 10 minutos de práctica de conversación con un máximo de 5 minutos por conversación, acceso a más de 10 idiomas y retroalimentación personalizada.",
          "Suscripción mensual: $12 USD/mes por 200 minutos de conversación (los minutos no utilizados se acumulan al mes siguiente), con conversaciones de hasta 15 minutos.",
                      "Suscripción anual: $120 USD/año (ahorra $24) por 2,400 minutos por año, con conversaciones de hasta 15 minutos.",
          "Pago por uso: compra única de 100 minutos (nunca expiran) por $8 USD, perfecto para uso ocasional sin compromiso mensual."
        ],
        refundNote: "Para más detalles sobre reembolsos, consulte nuestra {refundPolicy}."
      },
      accounts: {
        title: "3. Cuentas de Usuario",
        items: [
          "Elegibilidad: Debe tener al menos 13 años para usar el Servicio.",
          "Registro: Acepta proporcionar información precisa, completa y actualizada al crear su cuenta.",
          "Credenciales: Es responsable de mantener la confidencialidad de sus credenciales de inicio de sesión y de todas las actividades que ocurran bajo su cuenta."
        ]
      },
      prohibited: {
        title: "4. Usos Prohibidos",
        intro: "Acepta no:",
        items: [
          "Usar el Servicio para cualquier propósito ilegal, dañino o abusivo.",
          "Intentar realizar ingeniería inversa, descompilar o extraer cualquier código fuente o ideas subyacentes.",
          "Cargar o transmitir cualquier contenido que infrinja, difame, acose, sea odioso o viole los derechos de terceros.",
          "Interferir o interrumpir el Servicio o servidores o redes conectadas al Servicio."
        ]
      },
      intellectual: {
        title: "5. Propiedad Intelectual",
        content1: "Todo el contenido, software, diseños y marcas comerciales utilizados por hablo.pro (incluida la persona del tutor de IA \"Nacho\") son propiedad de hablo.pro o sus licenciantes y están protegidos por derechos de autor, marcas comerciales y otras leyes.",
        content2: "Contenido del Usuario: Usted conserva la propiedad de las grabaciones y transcripciones que crea. Al enviar Contenido del Usuario, otorga a hablo.pro una licencia mundial, libre de regalías y sublicenciable para usar, reproducir, modificar y mostrar dicho contenido para operar y mejorar el Servicio."
      },
      privacy: {
        title: "6. Privacidad",
        content: "Su uso del Servicio también se rige por nuestra {privacyPolicy}, que se incorpora por referencia. Revísela para entender cómo recopilamos, usamos y compartimos sus datos personales."
      },
      liability: {
        title: "7. Limitación de Responsabilidad",
        content1: "El Servicio se proporciona \"tal como está\" y \"según disponibilidad\" sin garantías de ningún tipo.",
        content2: "En la máxima medida permitida por la ley, en ningún caso hablo.pro será responsable de daños indirectos, incidentales, especiales o consecuenciales que surjan de su uso del Servicio.",
        content3: "Nuestra responsabilidad agregada por reclamos que surjan de o se relacionen con estos Términos o el Servicio no excederá los montos totales pagados por usted a hablo.pro en los seis (6) meses anteriores al reclamo."
      },
      termination: {
        title: "8. Terminación",
        content1: "Podemos suspender o terminar su acceso al Servicio en cualquier momento por incumplimiento de estos Términos o por cualquier otra razón, con o sin aviso.",
        content2: "Al terminar, su derecho a usar el Servicio cesa inmediatamente. Puede solicitar la eliminación de su cuenta y datos personales como se describe en nuestra {privacyPolicy}."
      },
      changes: {
        title: "9. Cambios a los Términos",
        content: "Nos reservamos el derecho de modificar estos Términos en cualquier momento. Cuando hagamos cambios materiales, le notificaremos por correo electrónico o notificación en la aplicación y actualizaremos la \"Fecha de vigencia\" en la parte superior. Su uso continuado del Servicio después del aviso constituye aceptación de los Términos revisados."
      },
      contact: {
        title: "10. Información de Contacto",
        content1: "Si tiene alguna pregunta o inquietud sobre estos Términos, comuníquese con HabloPro (Manuel Cardenas Prieto) en:",
        content2: "Correo: contact@hablo.pro"
      }
    }
  } : {
    title: "Terms of Service",
    availableIn: "También disponible en español en /es/",
    effectiveDate: "Effective Date:",
    close: "Close",
    privacyPolicy: "Privacy Policy",
    refundPolicy: "Refund Policy",
    sections: {
      acceptance: {
        title: "1. Acceptance of Terms",
        content: "By accessing or using hablo.pro (Manuel Cardenas Prieto) (the \"Service\"), you agree to be bound by these Terms of Service (the \"Terms\"). If you do not agree to these Terms, please do not use the Service."
      },
      description: {
        title: "2. Description of Service",
        content: "hablo.pro enables users to converse with an AI-powered tutor designed to help you learn a new language through interactive spoken sessions. We offer:",
        features: [
          "Free trial: 10 minutes of speaking practice with a maximum of 5 minutes per conversation, access to all 10+ languages, and personalized feedback.",
          "Monthly subscription: $12 USD/month for 200 minutes of conversation (unused minutes roll over to the following month), with up to 15-minute conversations.",
                      "Annual subscription: $120 USD/year (save $24) for 2,400 minutes per year, with up to 15-minute conversations.",
          "Pay-as-you-go: one‑time purchase of 100 minutes (never expire) for $8 USD, perfect for occasional use with no monthly commitment."
        ],
        refundNote: "For more details on refunds, please see our {refundPolicy}."
      },
      accounts: {
        title: "3. User Accounts",
        items: [
          "Eligibility: You must be at least 13 years old to use the Service.",
          "Registration: You agree to provide accurate, complete, and up‑to‑date information when creating your account.",
          "Credentials: You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account."
        ]
      },
      prohibited: {
        title: "4. Prohibited Uses",
        intro: "You agree not to:",
        items: [
          "Use the Service for any unlawful, harmful, or abusive purpose.",
          "Attempt to reverse‑engineer, decompile, or otherwise extract any source code or underlying ideas.",
          "Upload or transmit any content that is infringing, defamatory, harassing, hateful, or violates any third party's rights.",
          "Interfere with or disrupt the Service or servers or networks connected to the Service."
        ]
      },
      intellectual: {
        title: "5. Intellectual Property",
        content1: "All content, software, designs, and trademarks used by hablo.pro (including the AI tutor persona \"Nacho\") are the property of hablo.pro or its licensors and are protected by copyright, trademark, and other laws.",
        content2: "User Content: You retain ownership of the recordings and transcripts you create. By submitting User Content, you grant hablo.pro a worldwide, royalty‑free, sublicensable license to use, reproduce, modify, and display such content to operate and improve the Service."
      },
      privacy: {
        title: "6. Privacy",
        content: "Your use of the Service is also governed by our {privacyPolicy}, which is incorporated by reference. Please review it to understand how we collect, use, and share your personal data."
      },
      liability: {
        title: "7. Limitation of Liability",
        content1: "The Service is provided \"as is\" and \"as available\" without warranties of any kind.",
        content2: "To the maximum extent permitted by law, in no event will hablo.pro be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Service.",
        content3: "Our aggregate liability for claims arising out of or relating to these Terms or the Service will not exceed the total amounts paid by you to hablo.pro in the six (6) months prior to the claim."
      },
      termination: {
        title: "8. Termination",
        content1: "We may suspend or terminate your access to the Service at any time for breach of these Terms or for any other reason, with or without notice.",
        content2: "Upon termination, your right to use the Service immediately ceases. You may request deletion of your account and personal data as described in our {privacyPolicy}."
      },
      changes: {
        title: "9. Changes to Terms",
        content: "We reserve the right to modify these Terms at any time. When we make material changes, we will notify you via email or in‑app notification and update the \"Effective Date\" at the top. Your continued use of the Service after notice constitutes acceptance of the revised Terms."
      },
      contact: {
        title: "10. Contact Information",
        content1: "If you have any questions or concerns about these Terms, please contact HabloPro (Manuel Cardenas Prieto) at:",
        content2: "Email: contact@hablo.pro"
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-[#422006] dark:text-amber-200 flex-shrink-0">
            {content.title}
          </h2>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-0">
              <button
                onClick={handleLanguageSwitch}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline transition-colors whitespace-nowrap"
              >
                {isSpanish ? "Also in English" : "También en español"}
              </button>
              {(onOpenPrivacyPolicy || onOpenRefundPolicy) && (
                <span className="text-gray-400 hidden sm:inline">•</span>
              )}
              {onOpenPrivacyPolicy && (
                <button
                  onClick={onOpenPrivacyPolicy}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline transition-colors whitespace-nowrap hidden sm:inline-block"
                >
                  {content.privacyPolicy}
                </button>
              )}
              {onOpenRefundPolicy && onOpenPrivacyPolicy && (
                <span className="text-gray-400 hidden sm:inline">•</span>
              )}
              {onOpenRefundPolicy && (
                <button
                  onClick={onOpenRefundPolicy}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline transition-colors whitespace-nowrap hidden sm:inline-block"
                >
                  {content.refundPolicy}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none break-words">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>{content.effectiveDate}</strong> {isSpanish ? "1 de julio de 2025" : "July 1, 2025"}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.acceptance.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.acceptance.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.description.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.description.content}
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-4 list-disc pl-5 space-y-2">
              {content.sections.description.features.map((feature, index) => (
                <li key={index}><strong>{feature.split(':')[0]}:</strong> {feature.split(':').slice(1).join(':')}</li>
              ))}
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.description.refundNote.split('{refundPolicy}')[0]}
              {onOpenRefundPolicy && (
                <button
                  onClick={onOpenRefundPolicy}
                  className="text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  {content.refundPolicy}
                </button>
              )}
              {content.sections.description.refundNote.split('{refundPolicy}')[1]}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.accounts.title}
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-2">
              {content.sections.accounts.items.map((item, index) => (
                <li key={index}><strong>{item.split(':')[0]}:</strong> {item.split(':').slice(1).join(':')}</li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.prohibited.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.prohibited.intro}
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-1">
              {content.sections.prohibited.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.intellectual.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.intellectual.content1}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>{isSpanish ? "Contenido del Usuario:" : "User Content:"}</strong> {content.sections.intellectual.content2.replace("User Content: ", "").replace("Contenido del Usuario: ", "")}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.privacy.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.privacy.content.split('{privacyPolicy}')[0]}
              {onOpenPrivacyPolicy && (
                <button
                  onClick={onOpenPrivacyPolicy}
                  className="text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  {content.privacyPolicy}
                </button>
              )}
              {content.sections.privacy.content.split('{privacyPolicy}')[1]}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.liability.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.liability.content1}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.liability.content2}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.liability.content3}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.termination.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.termination.content1}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.termination.content2.split('{privacyPolicy}')[0]}
              {onOpenPrivacyPolicy && (
                <button
                  onClick={onOpenPrivacyPolicy}
                  className="text-amber-600 hover:text-amber-700 underline cursor-pointer"
                >
                  {content.privacyPolicy}
                </button>
              )}
              {content.sections.termination.content2.split('{privacyPolicy}')[1]}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.changes.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.changes.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.contact.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.contact.content1}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {content.sections.contact.content2}
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-800 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            {content.close}
          </button>
        </div>
      </div>
    </div>
  );
} 