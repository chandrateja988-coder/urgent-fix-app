import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// While developing, /api calls go to the local Python server (port 8000 by default).
// If Windows blocks port 8000, start both with another port, for example
// PowerShell:  $env:API_PORT=8123; npm.cmd run dev   (and uvicorn ... --port 8123)
const apiPort = process.env.API_PORT || 8000

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // On Vercel the Python API lives on the same web address, so no proxy is needed.
    proxy: {
      '/api': `http://127.0.0.1:${apiPort}`,
    },
  },
})
