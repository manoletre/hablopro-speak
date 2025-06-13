'use client';

import { useLanguage } from '../context/LanguageContext';

interface RefundPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTermsOfService?: () => void;
  onOpenPrivacyPolicy?: () => void;
  isSpanish?: boolean;
}

export default function RefundPolicyDialog({ isOpen, onClose, onOpenTermsOfService, onOpenPrivacyPolicy, isSpanish: propIsSpanish }: RefundPolicyDialogProps) {
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
    title: "Política de Reembolso",
    availableIn: "También disponible en inglés en nuestro sitio web principal.",
    effectiveDate: "Fecha de vigencia:",
    close: "Cerrar",
    termsOfService: "Términos de Servicio",
    privacyPolicy: "Política de Privacidad",
    intro: "Esta política de reembolso describe los términos y condiciones para reembolsos de los servicios de hablo.pro (Manuel Cardenas Prieto).",
    sections: {
      eligibility: {
        title: "1. Elegibilidad para Reembolso",
        intro: "Nuestra política de reembolso varía dependiendo del plan que haya comprado:",
        monthly: {
          title: "Suscripción Mensual ($12/mes)",
          content: "No hay reembolsos disponibles. Puede cancelar su suscripción en cualquier momento para evitar cargos futuros, pero no se proporcionará reembolso para el período de facturación actual."
        },
        payAsYouGo: {
          title: "Pago por uso ($8 por 150 minutos)",
          content: "No hay reembolsos disponibles. Una vez comprados, los minutos están disponibles para uso inmediato y no pueden ser reembolsados."
        },
        annual: {
          title: "Suscripción Anual ($120/año)",
          content: "Ventana de reembolso de 2 semanas. Puede solicitar un reembolso completo dentro de 14 días de su compra inicial. Después de este período, no se proporcionarán reembolsos."
        }
      },
      howTo: {
        title: "2. Cómo Solicitar un Reembolso",
        content1: "Para reembolsos de suscripción anual dentro del período elegible, contáctenos en:",
        content2: "Por favor incluya la dirección de correo electrónico de su cuenta y la razón de su solicitud de reembolso. Los reembolsos elegibles serán procesados a su método de pago original."
      },
      freeTrial: {
        title: "3. Prueba Gratuita",
        content: "Nuestra prueba gratuita (10 minutos de práctica de conversación) no requiere pago y por lo tanto no aplican reembolsos."
      },
      exceptional: {
        title: "4. Circunstancias Excepcionales",
        content: "En casos de problemas técnicos que le impidan usar el servicio, podemos considerar reembolsos caso por caso. Contáctenos en la dirección de correo electrónico anterior con detalles del problema."
      },
      contact: {
        title: "5. Información de Contacto",
        content1: "Si tiene alguna pregunta sobre esta política de reembolso, contáctenos en:",
        content2: "Correo:"
      }
    }
  } : {
    title: "Refund Policy",
    availableIn: "También disponible en español en /es/",
    effectiveDate: "Effective Date:",
    close: "Close",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    intro: "This refund policy outlines the terms and conditions for refunds of hablo.pro (Manuel Cardenas Prieto) services.",
    sections: {
      eligibility: {
        title: "1. Refund Eligibility",
        intro: "Our refund policy varies depending on the plan you have purchased:",
        monthly: {
          title: "Monthly Subscription ($12/month)",
          content: "No refunds available. You can cancel your subscription at any time to prevent future charges, but no refund will be provided for the current billing period."
        },
        payAsYouGo: {
          title: "Pay-as-you-go ($8 for 150 minutes)",
          content: "No refunds available. Once purchased, the minutes are available for immediate use and cannot be refunded."
        },
        annual: {
          title: "Annual Subscription ($120/year)",
          content: "2-week refund window. You may request a full refund within 14 days of your initial purchase. After this period, no refunds will be provided."
        }
      },
      howTo: {
        title: "2. How to Request a Refund",
        content1: "For annual subscription refunds within the eligible period, please contact us at:",
        content2: "Please include your account email address and the reason for your refund request. Eligible refunds will be processed to your original payment method."
      },
      freeTrial: {
        title: "3. Free Trial",
        content: "Our free trial (10 minutes of speaking practice) does not require payment and therefore no refunds are applicable."
      },
      exceptional: {
        title: "4. Exceptional Circumstances",
        content: "In cases of technical issues that prevent you from using the service, we may consider refunds on a case-by-case basis. Please contact us at the email address above with details of the issue."
      },
      contact: {
        title: "5. Contact Information",
        content1: "If you have any questions about this refund policy, please contact us at:",
        content2: "Email:"
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
              {(onOpenTermsOfService || onOpenPrivacyPolicy) && (
                <span className="text-gray-400 hidden sm:inline">•</span>
              )}
              {onOpenTermsOfService && (
                <button
                  onClick={onOpenTermsOfService}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline transition-colors whitespace-nowrap hidden sm:inline-block"
                >
                  {content.termsOfService}
                </button>
              )}
              {onOpenPrivacyPolicy && onOpenTermsOfService && (
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
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.intro}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.eligibility.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.eligibility.intro}
            </p>
            
            <h4 className="text-md font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.eligibility.monthly.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <strong>{isSpanish ? "No hay reembolsos disponibles." : "No refunds available."}</strong> {content.sections.eligibility.monthly.content.replace("No refunds available. ", "").replace("No hay reembolsos disponibles. ", "")}
            </p>
            
            <h4 className="text-md font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.eligibility.payAsYouGo.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <strong>{isSpanish ? "No hay reembolsos disponibles." : "No refunds available."}</strong> {content.sections.eligibility.payAsYouGo.content.replace("No refunds available. ", "").replace("No hay reembolsos disponibles. ", "")}
            </p>
            
            <h4 className="text-md font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.eligibility.annual.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>{isSpanish ? "Ventana de reembolso de 2 semanas." : "2-week refund window."}</strong> {content.sections.eligibility.annual.content.replace("2-week refund window. ", "").replace("Ventana de reembolso de 2 semanas. ", "")}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.howTo.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.howTo.content1}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>{content.sections.contact.content2}</strong> <a href="mailto:contact@hablo.pro" className="text-amber-600 hover:text-amber-700 underline">contact@hablo.pro</a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.howTo.content2}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.freeTrial.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.freeTrial.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.exceptional.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.exceptional.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.contact.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.contact.content1}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              {content.sections.contact.content2} <a href="mailto:contact@hablo.pro" className="text-amber-600 hover:text-amber-700 underline">contact@hablo.pro</a>
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