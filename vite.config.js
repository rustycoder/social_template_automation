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
        admin: path.resolve(root, 'admin.html'),
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
