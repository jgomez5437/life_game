import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  build: {
    target: 'esnext',
    outDir: '../dist',
    emptyOutDir: true
  }
});
