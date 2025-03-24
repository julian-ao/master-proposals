import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://www.idi.ntnu.no',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/education'),
        secure: false,
      }
    }
  },
})