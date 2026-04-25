import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// 🔥 FIX: Bypass the plugin's broken ES Module by forcing a CommonJS import
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const vitePrerender = require('vite-plugin-prerender');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '127.0.0.1',
    port: 8080,
    strictPort: true,
    // 🔥 FIX 1: Lock the WebSocket connection directly to Vite so it doesn't get confused by Netlify's proxy
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 8080,
    },
  },
  plugins: [
    react(),

    // PRE-RENDER PLUGIN: Only active during production build
    ...(mode === 'production' ? [vitePrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/compiler'],
    })] : []),

    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: false,
        type: 'module'
      },
      workbox: {
        navigateFallback: '/index.html',
        // 🔥 FIX 2: Explicitly tell the Service Worker to NEVER intercept Netlify backend API functions
        navigateFallbackDenylist: [/^\/\.netlify\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 15728640
      },
      manifest: {
        name: 'AlgoLib',
        short_name: 'AlgoLib',
        description: 'Visualize Logic. Execute Code. For & By Developers.',
        theme_color: '#09090B',
        background_color: '#09090B',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Isolate the massive geographic database
            if (id.includes('country-state-city')) return 'geo-data';

            // Isolate heavy execution engine
            if (id.includes('@monaco-editor')) return 'monaco-engine';

            // Isolate BaaS SDKs
            if (id.includes('firebase')) return 'firebase-core';
            if (id.includes('@supabase')) return 'supabase-core';
          }
        }
      }
    }
  }
}));
