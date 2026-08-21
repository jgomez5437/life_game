import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
    strictPort: true
  },
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true
  }
});
