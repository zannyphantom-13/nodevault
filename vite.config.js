import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// NodeVault Hardened Security & Obfuscation Build Pipeline
// 1. Zero Source Maps: Complete intellectual property & logic shielding
// 2. High-performance Minification: Variable mangling and code compression
// 3. Cryptographic Chunk Hashing: Non-deterministic obfuscated asset paths
export default defineConfig(({ mode }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://dnijsbfsmynrfftjivew.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fLGjDDWaYfommsezieUmzw_R77KvDST';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
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
  };
});
