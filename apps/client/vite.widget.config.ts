import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

/** CDN Host widget: classic IIFE + CSS for the Launcher ShadowRoot. */
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  build: {
    outDir: 'dist-widget',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(rootDir, 'src/host-frame.tsx'),
      // Must not be ExplainitWidget — Vite assigns the IIFE return value to
      // that global and would wipe window.ExplainitWidget = { mount }.
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
