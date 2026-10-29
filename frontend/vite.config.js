import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyErrorHandler = (proxy) => {
  proxy.on('error', (err, req, res) => {
    if (res && !res.headersSent && typeof res.writeHead === 'function') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Backend service is starting up, please try again in a moment.' }));
    }
  });
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API + uploaded assets to the Express backend in development
    // (127.0.0.1 instead of localhost avoids IPv6/IPv4 mismatch on Windows)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: proxyErrorHandler,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        configure: proxyErrorHandler,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Split heavy vendor libs into their own cacheable chunks
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          swiper: ['swiper'],
        },
      },
    },
  },
});
