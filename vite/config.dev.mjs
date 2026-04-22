import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',

  plugins: [
    VitePWA({      
      devOptions: {
        enabled: false
      },
      
      manifest: false,

      includeAssets: ['style.css'],

      workbox: {
        // ⚠️ volontairement léger en dev
        globPatterns: [
            '**/*.{js,css,html,png,jpg,gif,svg,woff,woff2,ttf,eot}'
        ],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },

  server: {
    port: 5001
  }
});