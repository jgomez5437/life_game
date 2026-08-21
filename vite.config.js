import fs from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

function copyStaticFilesPlugin() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      const files = ['robots.txt', 'sitemap.xml', 'favicon.png', 'preview.png'];
      for (const file of files) {
        const src = resolve(import.meta.dirname, 'public', file);
        const dest = resolve(import.meta.dirname, 'dist', file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    }
  };
}

export default defineConfig({
  root: 'public',
  plugins: [copyStaticFilesPlugin()],
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

