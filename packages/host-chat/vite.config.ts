import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/** CDN Host Chat: classic IIFE + CSS for the Launcher ShadowRoot. */
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(rootDir, 'src/widget.tsx'),
      name: '__ExplainitWidgetBundle',
      formats: ['iife'],
      fileName: () => 'widget',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'widget.js',
        assetFileNames: 'widget.[ext]',
        inlineDynamicImports: true,
        exports: 'named',
      },
    },
  },
});
