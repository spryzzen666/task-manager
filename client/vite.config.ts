import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Прокси: /api → сервер Express на :4000 (без CORS на фронте)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});