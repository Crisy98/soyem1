import withPWA from 'next-pwa';
import runtimeCaching from './runtimeCaching.js';

// Using JS config to bypass type mismatch issues between next-pwa types and Next 15 experimental types.

const isDev = process.env.NODE_ENV === 'development';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDev, // disable SW in dev
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/]
});

const nextConfig = {
  experimental: { ppr: false },
  images: { remotePatterns: [] },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [{ key: 'Content-Type', value: 'application/manifest+json' }]
      }
    ];
  }
};

export default pwaConfig(nextConfig);
