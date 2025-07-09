/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.producthunt.com',
        port: '',
        pathname: '/widgets/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Default source
              "default-src 'self'",
              // Frame sources - for Paddle and other iframes
              "frame-src 'self' https://*.paddle.com https://buy.paddle.com https://sandbox-buy.paddle.com https://checkout.paddle.com https://sandbox-checkout.paddle.com https://checkout-service.paddle.com https://sandbox-checkout-service.paddle.com https://*.firebaseapp.com https://*.googleapis.com https://accounts.google.com https://*.google.com http://localhost:9099 https://localhost:9099",
              // Frame ancestors - allow embedding by Paddle and Google/Firebase
              "frame-ancestors 'self' http://localhost:3000 https://localhost:3000 http://localhost https://localhost *.paddle.com *.google.com *.googleapis.com *.firebaseapp.com",
              // Script sources - for all external JavaScript libraries
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.paddle.com https://sandbox-cdn.paddle.com https://*.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com https://apis.google.com https://*.googleapis.com https://www.gstatic.com https://*.gstatic.com https://accounts.google.com https://client.sleekplan.com https://api-client.sleekplan.com https://*.sleekplan.com https://unpkg.com https://cdn.jsdelivr.net http://localhost:9099 https://localhost:9099",
              // Style sources - for external stylesheets
              "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com https://*.posthog.com https://client.sleekplan.com https://api-client.sleekplan.com https://*.sleekplan.com https://fonts.googleapis.com",
              // Connect sources - for API calls and analytics
              "connect-src 'self' https://*.paddle.com https://sandbox-buy.paddle.com https://checkout.paddle.com https://sandbox-checkout.paddle.com https://checkout-service.paddle.com https://sandbox-checkout-service.paddle.com https://*.firebase.com https://*.firebaseapp.com https://*.googleapis.com https://accounts.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com https://app.posthog.com https://eu.posthog.com https://us.posthog.com https://www.google-analytics.com https://analytics.google.com https://client.sleekplan.com https://api.sleekplan.com https://api-client.sleekplan.com https://*.sleekplan.com https://unpkg.com https://cdn.jsdelivr.net https://api.openai.com wss://*.openai.com wss://api.openai.com https://api.producthunt.com https://*.producthunt.com http://localhost:9099 https://localhost:9099 http://localhost:8080 http://localhost:4000 http://localhost:5001 wss://* ws://* stun: turn:",
              // Image sources
              "img-src 'self' data: blob: https://*.posthog.com https://*.paddle.com https://*.firebase.com https://*.firebaseapp.com https://www.google.com https://*.gstatic.com https://*.googleusercontent.com https://lh3.googleusercontent.com https://storage.sleekplan.com https://*.sleekplan.com https://api.producthunt.com https://*.producthunt.com",
              // Font sources
              "font-src 'self' https://fonts.gstatic.com https://*.paddle.com",
              // Media sources
              "media-src 'self' blob: data:",
              // Object sources
              "object-src 'none'",
              // Base URI
              "base-uri 'self'",
              // Form action
              "form-action 'self' https://*.paddle.com https://checkout-service.paddle.com https://sandbox-checkout-service.paddle.com",
              // Allow dedicated worker sources explicitly (optional but safer)
              "worker-src 'self' blob:"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 