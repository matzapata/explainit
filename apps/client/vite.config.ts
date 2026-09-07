import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';

const apiProxy = {
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
    timeout: 0,
    proxyTimeout: 0,
  },
};

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, 'index.html'),
      },
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: apiProxy,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  preview: {
    host: true,
    port: 3000,
    proxy: apiProxy,
  },
});
