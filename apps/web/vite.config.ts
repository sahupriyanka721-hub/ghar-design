import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@ghar-design/shared', replacement: path.resolve(__dirname, '../../packages/shared/src/index.ts') },
      { find: /^lenis\/react$/, replacement: path.resolve(__dirname, 'src/lib/lenis.tsx') },
      { find: /^lenis$/, replacement: path.resolve(__dirname, 'src/lib/lenis.tsx') },
      { find: /^framer-motion$/, replacement: path.resolve(__dirname, 'src/lib/framer-motion.tsx') },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          lucide: ['lucide-react'],
        },
      },
    },
  },
});
