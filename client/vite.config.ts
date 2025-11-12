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
        // Simplified chunking: put ALL node_modules in vendor
        // This eliminates React dependency resolution issues
        manualChunks: undefined,

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
