import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __COMP_PLANNER_WCA_API_ORIGIN__: JSON.stringify(
        env.VITE_WCA_API_ORIGIN || '',
      ),
      __COMP_PLANNER_WCA_CLIENT_ID__: JSON.stringify(
        env.VITE_WCA_CLIENT_ID || '',
      ),
      __COMP_PLANNER_IS_DEV__: JSON.stringify(mode === 'development'),
      __COMP_PLANNER_WCA_OAUTH_ORIGIN__: JSON.stringify(
        env.VITE_WCA_OAUTH_ORIGIN || '',
      ),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Comp Planner',
          short_name: 'Comp Planner',
          description:
            'Use recent WCA competition data to plan the events for your next competition.',
          theme_color: '#101820',
          background_color: '#f9fafb',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern:
                /^https:\/\/(?:api\.worldcubeassociation\.org|staging\.worldcubeassociation\.org)\/(?:api\/v0\/)?me(?:\?|$)/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/api\.worldcubeassociation\.org\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'wca-api',
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                  maxEntries: 100,
                },
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: /^https:\/\/staging\.worldcubeassociation\.org\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'wca-staging-api',
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                  maxEntries: 100,
                },
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: /^https:\/\/photon\.komoot\.io\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'photon-geocoder',
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                  maxEntries: 200,
                },
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: /^https:\/\/[^/]+\.tile\.openstreetmap\.org\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'openstreetmap-tiles',
                expiration: {
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                  maxEntries: 200,
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      allowedHosts: true,
    },
  };
});
