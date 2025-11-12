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
        // Manual chunks: React MUST load before any React-dependent code
        manualChunks: (id) => {
          // React and ALL packages starting with 'react' in ONE chunk
          // This includes react, react-dom, react-router-dom, react-bootstrap, etc.
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }

          // Packages that depend on React (including @editorjs which uses React hooks)
          if (
            id.includes('node_modules/@tanstack/react-query') ||
            id.includes('node_modules/@hookform') ||
            id.includes('node_modules/@stripe/react-stripe-js') ||
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/zustand') ||
            id.includes('node_modules/@editorjs')
          ) {
            return 'react-vendor';
          }

          // All other node_modules
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
