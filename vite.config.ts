import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  assetsInclude: ['**/*.glb'],
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 4000,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } }
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' }
});
