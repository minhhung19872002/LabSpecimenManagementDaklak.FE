import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import crypto from 'crypto'

// Plugin tạo version.json khi build - dùng để phát hiện phiên bản mới
function versionPlugin() {
  return {
    name: 'version-plugin',
    writeBundle() {
      const buildHash = crypto.randomBytes(8).toString('hex');
      const versionInfo = {
        buildHash,
        buildTime: new Date().toISOString(),
      };
      writeFileSync(
        resolve(__dirname, 'dist/version.json'),
        JSON.stringify(versionInfo)
      );
      console.log(`\n✓ Generated version.json (buildHash: ${buildHash})\n`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    versionPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Lab Specimen Management',
        short_name: 'LabSpec',
        description: 'Laboratory Specimen Management System - Offline Ready',
        theme_color: '#1890ff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Exclude very large files from precache (will be cached on first use via runtime caching)
        globIgnores: ['**/vietnamLocations*.js'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit for precache
        // Navigate fallback for SPA - serves index.html for all navigation requests when offline
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Take control immediately without waiting for tabs to close
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches on activation
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Cache JS chunks that weren't precached (large files like vietnamLocations)
            // StaleWhileRevalidate: serve cache ngay lập tức, đồng thời fetch bản mới cho lần sau
            urlPattern: /\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-chunks-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache API responses with NetworkFirst strategy
            urlPattern: /^https?:\/\/.*\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache static assets
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache fonts
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true, // Enable PWA in dev mode for offline testing
        type: 'module',
        navigateFallback: '/',
        navigateFallbackAllowlist: [/^\/(?!api).*/]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  server: {
    port: 3001,
    open: true
  }
})
