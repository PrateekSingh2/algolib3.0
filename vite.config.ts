import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // 🔥 ADDED PROXY CONFIGURATION HERE TO FIX LOCALHOST CORS
    proxy: {
      '/api/jdoodle': {
        target: 'https://api.jdoodle.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jdoodle/, '')
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
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
            
            // Note: We deliberately let Vite handle React, Framer Motion, 
            // and Lucide automatically to prevent 'forwardRef' undefined errors.
          }
        }
      }
    }
  }
}));