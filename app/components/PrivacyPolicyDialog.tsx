'use client';

interface PrivacyPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isSpanish?: boolean;
}

export default function PrivacyPolicyDialog({ isOpen, onClose, isSpanish = false }: PrivacyPolicyDialogProps) {
  if (!isOpen) return null;

  const content = isSpanish ? {
    title: "Política de Privacidad",
    availableIn: "También disponible en inglés en nuestro sitio web principal.",
    effectiveDate: "Fecha de vigencia:",
    close: "Cerrar",
    intro: "hablo.pro (\"nosotros\", \"nos\", \"nuestro\") respeta su privacidad y se compromete a proteger sus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información en cumplimiento con las leyes aplicables, incluyendo el Reglamento General de Protección de Datos de la UE (GDPR), la Ley de Privacidad del Consumidor de California (CCPA), la Ley de Protección de la Privacidad Infantil en Línea (COPPA), y la Ley de Protección de la Privacidad en Línea de California (CalOPPA).",
    sections: {
      information: {
        title: "1. Información que Recopilamos",
        account: {
          title: "1.1 Información de la Cuenta",
          content: "Dirección de correo electrónico, nombre para mostrar, URL de foto de perfil, ID de usuario de Google, marcas de tiempo de autenticación (vía Firebase Authentication)."
        },
        userContent: {
          title: "1.2 Contenido Generado por el Usuario",
          content: "Grabaciones de voz (procesadas en tiempo real y no almacenadas permanentemente). Transcripciones de conversaciones (almacenadas en Firestore para seguimiento del progreso). Preferencias de idioma, configuraciones de dificultad, elementos de gramática/vocabulario marcados."
        },
        analytics: {
          title: "1.3 Análisis de Uso",
          content: "Horarios de inicio/fin de sesión, duración, estado de finalización, rachas de aprendizaje, eventos de interacción, visualizaciones de página (rastreadas vía PostHog Analytics)."
        },
        technical: {
          title: "1.4 Datos Técnicos",
          content: "Desplazamiento de zona horaria, preferencia de idioma de la UI, información del navegador y dispositivo."
        }
      },
      usage: {
        title: "2. Cómo Usamos Su Información",
        items: [
          "Proporcionar y mejorar los servicios de hablo.pro, incluyendo tutoría de idiomas impulsada por IA y retroalimentación.",
          "Personalizar su experiencia de aprendizaje recomendando contenido y ajustando la dificultad.",
          "Analizar tendencias de uso y realizar análisis para desarrollo de productos.",
          "Comunicarnos con usted sobre actualizaciones del servicio, boletines informativos y atención al cliente."
        ]
      },
      thirdParty: {
        title: "3. Servicios de Terceros",
        intro: "Compartimos datos solo según sea necesario con los siguientes proveedores:",
        firebase: "Autenticación, almacenamiento de datos y procesamiento del lado del servidor.",
        openai: "Voz a texto (Whisper) y retroalimentación de IA (GPT-4).",
        posthog: "Análisis de comportamiento del usuario y rendimiento.",
        aws: "Entrega de correos electrónicos de bienvenida y notificación.",
        vercel: "Hosting, CDN y optimización de imágenes."
      },
      retention: {
        title: "4. Retención de Datos",
        items: [
          "Las grabaciones de voz se procesan de forma transitoria y no se almacenan.",
          "Las transcripciones y datos de cuenta se retienen hasta que solicite eliminación o cierre su cuenta.",
          "Los datos de análisis se almacenan hasta 36 meses para monitorear tendencias a largo plazo."
        ]
      },
      cookies: {
        title: "5. Cookies y Tecnologías de Seguimiento",
        content: "Usamos cookies y tecnologías similares para operar y optimizar nuestros servicios. Puede gestionar sus preferencias de cookies a través de la página Configuración de Cookies en la aplicación. Para detalles sobre los requisitos de cookies de California, consulte CalOPPA."
      },
      rights: {
        title: "6. Sus Derechos",
        intro: "Dependiendo de su jurisdicción, puede:",
        items: [
          "Acceder, corregir o eliminar sus datos personales.",
          "Restringir u objetar el procesamiento de sus datos.",
          "Retirar el consentimiento en cualquier momento.",
          "Recibir una copia de sus datos en formato portable.",
          "Optar por no participar en la venta o compartir información personal (CCPA de California)."
        ],
        contact: "Para ejercer estos derechos, contáctenos en privacy@hablo.pro. Para residentes de California, consulte Información CCPA."
      },
      children: {
        title: "7. Privacidad de Menores",
        content: "hablo.pro está destinado para usuarios de 16 años en adelante. No recopilamos conscientemente datos personales de niños menores de 13, de acuerdo con COPPA. Si cree que hemos recopilado información de un niño menor de 13, contáctenos inmediatamente."
      },
      transfers: {
        title: "8. Transferencias Internacionales de Datos",
        content: "Sus datos pueden ser transferidos y procesados en Estados Unidos y otros países. Usamos salvaguardas como las Cláusulas Contractuales Estándar de la UE para proteger sus datos, en cumplimiento con el GDPR."
      },
      security: {
        title: "9. Medidas de Seguridad",
        content: "Implementamos medidas de seguridad estándar de la industria, incluyendo cifrado en tránsito (TLS) y en reposo (AES-256), Reglas de Seguridad de Firebase, infraestructura AWS certificada SOC e ISO, y mitigación DDoS proporcionada por Vercel."
      },
      changes: {
        title: "10. Cambios a Esta Política",
        content: "Revisamos y actualizamos esta Política de Privacidad al menos anualmente. Los cambios materiales se reflejarán actualizando la \"Fecha de vigencia\" y publicando la política revisada."
      },
      contact: {
        title: "11. Contáctenos",
        content: "hablo.pro\nAtención: Oficial de Privacidad\nCorreo: privacy@hablo.pro"
      },
      law: {
        title: "12. Ley Aplicable",
        content: "Esta política se rige por las leyes de privacidad de Colombia. Los residentes de la UE tienen derechos adicionales bajo el GDPR. Los residentes de California tienen derechos bajo la CCPA."
      }
    }
  } : {
    title: "Privacy Policy",
    availableIn: "También disponible en español en /es/",
    effectiveDate: "Effective Date:",
    close: "Close",
    intro: "hablo.pro (\"we\", \"us\", \"our\") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and safeguard your information in compliance with applicable laws, including the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), the Children's Online Privacy Protection Act (COPPA), and the California Online Privacy Protection Act (CalOPPA).",
    sections: {
      information: {
        title: "1. Information We Collect",
        account: {
          title: "1.1 Account Information",
          content: "Email address, display name, profile photo URL, Google user ID, authentication timestamps (via Firebase Authentication)."
        },
        userContent: {
          title: "1.2 User-Generated Content",
          content: "Voice recordings (processed in real time and not stored permanently). Conversation transcripts (stored in Firestore for progress tracking). Language preferences, difficulty settings, bookmarked grammar/vocabulary items."
        },
        analytics: {
          title: "1.3 Usage Analytics",
          content: "Session start/end times, duration, completion status, learning streaks, interaction events, page views (tracked via PostHog Analytics)."
        },
        technical: {
          title: "1.4 Technical Data",
          content: "Time zone offset, UI language preference, browser and device information."
        }
      },
      usage: {
        title: "2. How We Use Your Information",
        items: [
          "Provide and improve hablo.pro services, including AI-driven language tutoring and feedback.",
          "Personalize your learning experience by recommending content and adjusting difficulty.",
          "Analyze usage trends and perform analytics for product development.",
          "Communicate with you regarding service updates, newsletters, and customer support."
        ]
      },
      thirdParty: {
        title: "3. Third-Party Services",
        intro: "We share data only as necessary with the following providers:",
        firebase: "Authentication, data storage, and server-side processing.",
        openai: "Voice-to-text (Whisper) and AI feedback (GPT-4).",
        posthog: "User behavior and performance analytics.",
        aws: "Welcome and notification email delivery.",
        vercel: "Hosting, CDN, and image optimization."
      },
      retention: {
        title: "4. Data Retention",
        items: [
          "Voice recordings are processed transiently and not stored.",
          "Transcripts and account data are retained until you request deletion or close your account.",
          "Analytics data are stored for up to 36 months to monitor long-term trends."
        ]
      },
      cookies: {
        title: "5. Cookies & Tracking Technologies",
        content: "We use cookies and similar technologies to operate and optimize our services. You can manage your cookie preferences via the Cookie Settings page in the app. For details on California's cookie requirements, see CalOPPA."
      },
      rights: {
        title: "6. Your Rights",
        intro: "Depending on your jurisdiction, you may:",
        items: [
          "Access, correct, or delete your personal data.",
          "Restrict or object to processing of your data.",
          "Withdraw consent at any time.",
          "Receive a copy of your data in a portable format.",
          "Opt out of the sale or sharing of personal information (California CCPA)."
        ],
        contact: "To exercise these rights, contact us at privacy@hablo.pro. For California residents, see CCPA Information."
      },
      children: {
        title: "7. Children's Privacy",
        content: "hablo.pro is intended for users aged 16 and older. We do not knowingly collect personal data from children under 13, in accordance with COPPA. If you believe we have collected information from a child under 13, please contact us immediately."
      },
      transfers: {
        title: "8. International Data Transfers",
        content: "Your data may be transferred to and processed in the United States and other countries. We use safeguards such as EU Standard Contractual Clauses to protect your data, in compliance with the GDPR."
      },
      security: {
        title: "9. Security Measures",
        content: "We implement industry-standard security measures, including encryption in transit (TLS) and at rest (AES-256), Firebase Security Rules, SOC- and ISO-certified AWS infrastructure, and DDoS mitigation provided by Vercel."
      },
      changes: {
        title: "10. Changes to This Policy",
        content: "We review and update this Privacy Policy at least annually. Material changes will be reflected by updating the \"Effective Date\" and publishing the revised policy."
      },
      contact: {
        title: "11. Contact Us",
        content: "hablo.pro\nAttn: Privacy Officer\nEmail: privacy@hablo.pro"
      },
      law: {
        title: "12. Governing Law",
        content: "This policy is governed by the privacy laws of Colombia. EU residents have additional rights under the GDPR. California residents have rights under the CCPA."
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[#422006] dark:text-amber-200">
              {content.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {content.availableIn}
            </p>
          </div>
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
              <strong>{content.effectiveDate}</strong> {isSpanish ? "1 de julio de 2025" : "July 1, 2025"}
            </p>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.intro}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.information.title}
            </h3>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              {content.sections.information.account.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.information.account.content}
            </p>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              {content.sections.information.userContent.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.information.userContent.content}
            </p>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              {content.sections.information.analytics.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.information.analytics.content}
            </p>
            
            <h4 className="text-base font-semibold text-[#422006] dark:text-amber-200 mb-2">
              {content.sections.information.technical.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.information.technical.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.usage.title}
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5">
              {content.sections.usage.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.thirdParty.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.thirdParty.intro}
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5 space-y-2">
              <li>
                <strong>Firebase:</strong> {content.sections.thirdParty.firebase}<br/>
                {isSpanish ? "Privacidad:" : "Privacy:"} <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://firebase.google.com/support/privacy</a><br/>
                {isSpanish ? "Términos de Procesamiento de Datos:" : "Data Processing Terms:"} <a href="https://firebase.google.com/terms/data-processing-terms" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://firebase.google.com/terms/data-processing-terms</a>
              </li>
              <li>
                <strong>OpenAI:</strong> {content.sections.thirdParty.openai}<br/>
                {isSpanish ? "Privacidad:" : "Privacy:"} <a href="https://openai.com/policies/row-privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://openai.com/policies/row-privacy-policy/</a><br/>
                {isSpanish ? "FAQ de Uso de Datos:" : "Data Usage FAQ:"} <a href="https://help.openai.com/articles/7039943-data-usage-for-consumer-services-faq" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://help.openai.com/articles/7039943-data-usage-for-consumer-services-faq</a>
              </li>
              <li>
                <strong>PostHog:</strong> {content.sections.thirdParty.posthog}<br/>
                {isSpanish ? "Privacidad:" : "Privacy:"} <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://posthog.com/privacy</a>
              </li>
              <li>
                <strong>AWS (Amazon SES):</strong> {content.sections.thirdParty.aws}<br/>
                {isSpanish ? "Privacidad:" : "Privacy:"} <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://aws.amazon.com/privacy/</a>
              </li>
              <li>
                <strong>Vercel:</strong> {content.sections.thirdParty.vercel}<br/>
                {isSpanish ? "Privacidad:" : "Privacy:"} <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://vercel.com/legal/privacy-policy</a><br/>
                {isSpanish ? "Política de Cookies:" : "Cookie Policy:"} <a href="https://vercel.com/legal/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline">https://vercel.com/legal/cookie-policy</a>
              </li>
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.retention.title}
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5">
              {content.sections.retention.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.cookies.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.cookies.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.rights.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {content.sections.rights.intro}
            </p>
            <ul className="text-gray-600 dark:text-gray-300 mb-6 list-disc pl-5">
              {content.sections.rights.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.rights.contact}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.children.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.children.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.transfers.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.transfers.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.security.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.security.content}
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
            <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">
              {content.sections.contact.content}
            </p>
            
            <h3 className="text-lg font-semibold text-[#422006] dark:text-amber-200 mb-3">
              {content.sections.law.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {content.sections.law.content}
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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