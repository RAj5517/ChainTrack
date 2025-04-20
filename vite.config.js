import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/coingecko': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, ''),
        secure: false,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      '/api/cryptocompare': {
        target: 'https://min-api.cryptocompare.com/data/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cryptocompare/, ''),
        secure: false,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  }
})
