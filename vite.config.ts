import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'NDEB AFK Prep Pro',
        short_name: 'AFK Prep',
        description: 'NDEB AFK exam preparation — study smarter',
        theme_color: '#0284c7',
        background_color: '#f0f6ff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: './favicon.ico', sizes: '64x64', type: 'image/x-icon' },
          { src: './icons/icon-192.webp', sizes: '192x192', type: 'image/webp' },
          { src: './icons/icon-512.webp', sizes: '512x512', type: 'image/webp' },
          { src: './icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      }
    })
  ],
  server: {
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 700,
  }
});