import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';

/** Docker nests host-chat under /app; local checkout keeps it as a sibling package. */
function hostChatRoot(): string {
  const nested = path.resolve(rootDir, 'packages/host-chat');
  if (fs.existsSync(path.join(nested, 'src/index.ts'))) {
    return nested;
  }
  return path.resolve(rootDir, '../../packages/host-chat');
}

const hostChat = hostChatRoot();

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
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(rootDir, 'src'),
      '@explainit/host-chat': path.join(hostChat, 'src/index.ts'),
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
    fs: {
      allow: [rootDir, hostChat],
    },
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
