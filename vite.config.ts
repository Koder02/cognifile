import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@tensorflow/tfjs-backend-cpu',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow/tfjs-converter',
      '@tensorflow/tfjs-core',
    ],
  },
  server: {
    fs: {
      strict: false,
      allow: ['..']  // Allow serving files from outside the project root
    },
    headers: {
      // Allow loading the PDF.js worker from the local server
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    watch: {
      usePolling: true,  // Ensure file changes are detected
    },
  },
  build: {
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'tfjs': [
            '@tensorflow/tfjs-core',
            '@tensorflow/tfjs-converter',
            '@tensorflow/tfjs-backend-cpu',
            '@tensorflow/tfjs-backend-webgl'
          ]
        },
      },
    },
  },
  publicDir: 'public',
});
