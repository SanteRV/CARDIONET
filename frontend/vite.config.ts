import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sitio estático: no hay backend ni proxy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
