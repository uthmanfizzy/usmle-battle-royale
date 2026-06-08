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
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'socket': ['socket.io-client'],
        }
      },
      onwarn(warning, warn) {
        // Suppress CSS unbalanced brace warnings
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        if (warning.message && warning.message.includes('unbalanced')) return;
        if (warning.message && warning.message.includes('css-syntax-error')) return;
        warn(warning);
      }
    },
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      }
    },
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client']
  }
});
