import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // While developing, forward /api calls to the local Python server (port 8000).
    // On Vercel the Python API lives on the same web address, so no proxy is needed.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
