import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    minify: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(rootDir, 'src/index.ts'),
      name: 'explainit',
      formats: ['iife'],
      fileName: () => 'launcher.js',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'launcher.js',
        // Default export is the global: window.explainit({ chatId, apiUrl, button })
        exports: 'default',
      },
    },
  },
});
