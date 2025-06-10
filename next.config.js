/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self' http://localhost:3000 https://localhost:3000 http://localhost https://localhost *.paddle.com",
              "frame-src 'self' https://*.paddle.com https://buy.paddle.com https://sandbox-buy.paddle.com https://checkout.paddle.com https://sandbox-checkout.paddle.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://*.paddle.com"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 