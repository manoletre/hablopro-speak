import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
  },
  // This setting helps suppress hydration warnings due to extensions like Dark Reader
  experimental: {
    // These options help with various rendering issues
    optimizeCss: true,
    scrollRestoration: true
  },
};

export default nextConfig;
