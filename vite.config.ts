import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const vitePrerender = require('vite-plugin-prerender');

export default defineConfig(({ mode }) => ({
  server: {
    host: '127.0.0.1',
    port: 8080,
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: true,
      }
    },
    // ✅ HMR FIX: clientPort MUST match the port the browser connects to (8888, the
    // Netlify Dev proxy). Without this, the browser tries to open a WebSocket
    // directly to Vite's internal port 8081 which is not exposed through the proxy,
    // causing "WebSocket closed without opened" → broken HMR → duplicate React
    // instance → useContext null crash.
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 8080,        // Vite's own WS port (same as HTTP dev server)
      clientPort: 8888,  // The port the BROWSER dials — i.e. Netlify's proxy port
    },
  },

  plugins: [
    react(),
    ...(mode === 'production' ? [vitePrerender({
      staticDir: path.join(__dirname, 'dist'),
      routes: ['/compiler'],
    })] : []),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: false,
        type: 'module',
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [ /^\/\.netlify\//, /^\/api\// ],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 15728640,
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
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],

  // ✅ MERGED resolve block — both alias and dedupe must live here.
  // Having two `resolve` objects in the same config silently drops the first,
  // killing the `@` import alias and breaking the entire src tree.
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensures every module resolves to the SAME React instance so that
    // useContext / useNavigate never encounter a null dispatcher.
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  // ✅ DEPENDENCY ISOLATION: Force Vite to pre-bundle these as a single unit so
  // every lazy-loaded chunk shares the exact same React dispatcher context.
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },

  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('country-state-city')) return 'geo-data';
            if (id.includes('@monaco-editor'))    return 'monaco-engine';
            if (id.includes('firebase'))          return 'firebase-core';
            if (id.includes('@supabase'))         return 'supabase-core';
          }
        },
      },
    },
  },
}));