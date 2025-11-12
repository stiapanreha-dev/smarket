import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      open: false, // Don't open browser automatically
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // Options: treemap, sunburst, network
    }) as Plugin,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for smaller bundle size
    target: 'es2015',

    // Increase chunk size warning limit for vendor bundles
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunks for optimal code splitting
        manualChunks: (id) => {
          // React core - separate chunk (must be first to ensure all react libs can access it)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          // React Router and related react-* libraries
          if (
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/react-dropzone') ||
            id.includes('node_modules/react-helmet-async') ||
            id.includes('node_modules/react-hot-toast') ||
            id.includes('node_modules/react-window')
          ) {
            return 'vendor';
          }

          // Bootstrap & React Bootstrap - separate chunk
          if (
            id.includes('node_modules/bootstrap') ||
            id.includes('node_modules/react-bootstrap') ||
            id.includes('node_modules/@popperjs')
          ) {
            return 'bootstrap-vendor';
          }

          // React Query - separate chunk
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }

          // Charts library (recharts) - separate chunk (lazy loaded on dashboard)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }

          // Icons - separate chunk
          if (
            id.includes('node_modules/react-icons') ||
            id.includes('node_modules/@react-icons')
          ) {
            return 'icons-vendor';
          }

          // i18n libraries - separate chunk
          if (
            id.includes('node_modules/i18next') ||
            id.includes('node_modules/react-i18next')
          ) {
            return 'i18n-vendor';
          }

          // Form libraries - separate chunk
          if (
            id.includes('node_modules/react-hook-form') ||
            id.includes('node_modules/@hookform') ||
            id.includes('node_modules/yup')
          ) {
            return 'form-vendor';
          }

          // Stripe - separate chunk (only loaded on checkout)
          if (
            id.includes('node_modules/@stripe/stripe-js') ||
            id.includes('node_modules/@stripe/react-stripe-js')
          ) {
            return 'stripe-vendor';
          }

          // Editor.js - separate chunk (only loaded on product form)
          if (
            id.includes('node_modules/@editorjs') ||
            id.includes('node_modules/react-editor-js')
          ) {
            return 'editor-vendor';
          }

          // All other node_modules - common vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },

        // Consistent naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Minify options - using esbuild (default) for faster builds
    minify: 'esbuild',

    // Source maps for production debugging (optional)
    sourcemap: false,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-bootstrap',
      '@tanstack/react-query',
    ],
  },
})
