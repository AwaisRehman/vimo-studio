import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const target = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000'

// During development /api, /docs and /openapi.json are proxied to FastAPI, so no CORS setup is needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target, changeOrigin: true },
      '/docs': { target, changeOrigin: true },
      '/openapi.json': { target, changeOrigin: true },
    },
  },
})
