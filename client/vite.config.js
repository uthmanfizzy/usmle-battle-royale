import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  css: {
    devSourcemap: false,
  },
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'socket': ['socket.io-client'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client']
  }
});
