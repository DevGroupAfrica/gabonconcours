import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "::",
    port: 8001,
    allowedHosts: ["gabconcours.devgroup.ga"],
    hmr: {
      overlay: false,
    },
    cors: {
      origin: ["http://gabconcours.devgroup.ga", "https://gabconcours.devgroup.ga","http://api.gabconcours.devgroup.ga", "https://api.gabconcours.devgroup.ga"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});