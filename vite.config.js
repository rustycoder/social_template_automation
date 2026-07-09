import { defineConfig } from 'vite';
import renderApiPlugin from './server/renderApi.js';

export default defineConfig({
  plugins: [renderApiPlugin()],
  server: {
    open: true,
    port: 3000,
  },
});
