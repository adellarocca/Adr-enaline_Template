import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const phasermsg = () => {
  return {
    name: 'phasermsg',
    buildStart() {
      process.stdout.write(`Building for production...\n`);
    },
    buildEnd() {
      const line = "---------------------------------------------------------";
      const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
      process.stdout.write(`${line}\n${msg}\n${line}\n`);
      process.stdout.write(`✨ Done ✨\n`);
    }
  }
}

export default defineConfig({
  base: './',
  logLevel: 'warning',

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      // ❌ IMPORTANT : on ne précache PAS le dossier public/assets ici
      includeAssets: ['style.css'],

      manifest: false,

      workbox: {
        // ✔️ précache uniquement les assets build (PAS /assets public)
        globPatterns: [
          '**/*.{js,css,html,png,jpg,gif,svg,woff2,ttf,eot,json,mp3,ogg,webp}'
        ],

        // ✔️ obligatoire pour SPA Phaser
        navigateFallback: 'index.html',

        runtimeCaching: [
          // ✔️ assets Phaser (public/assets), even when hosted under a subpath (e.g. /mygame/assets/*)
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              }
            }
          },

          // ✔️ Google Fonts
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
    }),

    phasermsg()
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    },

    minify: 'terser',

    terserOptions: {
      compress: {
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    }
  },

  server: {
    port: 8080
  }
});