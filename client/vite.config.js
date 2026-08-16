import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.js',
    css: false,
    // Pre-bundling of react/react-dom in the test environment can produce a
    // second module instance (jsx-runtime split from react-dom's copy),
    // which react-dom rejects as "element from an older version of React".
    deps: {
      optimizer: {
        web: { enabled: false }
      }
    }
  }
});
