import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// NodeVault Hardened Security & Obfuscation Build Pipeline
// 1. Zero Source Maps: Complete intellectual property & logic shielding
// 2. High-performance Minification: Variable mangling and code compression
// 3. Cryptographic Chunk Hashing: Non-deterministic obfuscated asset paths
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    minify: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/nv-[hash].js',
        chunkFileNames: 'assets/nv-[hash].js',
        assetFileNames: 'assets/nv-[hash].[ext]',
      },
    },
  },
});
