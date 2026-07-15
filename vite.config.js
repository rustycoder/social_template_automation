import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import renderApiPlugin from './server/renderApi.js';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [renderApiPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        templates: path.resolve(root, 'template.html'),
        posts: path.resolve(root, 'post.html'),
        billing: path.resolve(root, 'billing.html'),
        categories: path.resolve(root, 'categories.html'),
      },
    },
  },
  server: {
    open: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass(req) {
          if (req.url === '/api/render') {
            return req.url;
          }
        },
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
