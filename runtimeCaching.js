export default [
  {
    urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api/'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
      cacheableResponse: { statuses: [0, 200] }
    },
  },
  {
    urlPattern: ({ request }) => request.destination === 'image',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'image-cache',
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
      cacheableResponse: { statuses: [0, 200] }
    },
  },
  {
    urlPattern: ({ url }) => url.origin === self.location.origin,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-assets',
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
    },
  }
];
