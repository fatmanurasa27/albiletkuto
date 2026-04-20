import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Bu ayar React'ın tüm adresleri sorunsuz dinlemesini sağlar
    proxy: {
      '/api/trips': {
        target: 'http://localhost:8001', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trips/, '')
      },
      '/api/bookings': {
        target: 'http://localhost:8000', // <-- İŞTE BU SATIR UÇMUŞ! BİLETLER 8000'E GİTMELİ.
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bookings/, '')
      },
      '/api/payments': {
        target: 'http://localhost:8002', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payments/, '')
      }
    }
  }
})