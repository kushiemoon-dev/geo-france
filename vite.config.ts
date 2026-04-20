import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Cache app shell only — rock images cached on-demand via runtime caching
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'og-image.png', 'favicon.svg'],
        globIgnores: ['**/data/*.pmtiles', '**/images/rocks/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/demotiles\.maplibre\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maplibre-assets',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Rock images cached on first visit
            urlPattern: /\/images\/rocks\/.+\.jpg$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rock-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      manifest: false, // We have our own manifest.webmanifest
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre': ['maplibre-gl'],
          'pmtiles': ['pmtiles'],
        },
      },
    },
  },
})
