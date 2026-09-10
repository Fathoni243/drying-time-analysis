import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Polyfill Node.js built-ins (Buffer, process, dll) yang dibutuhkan exceljs di browser
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util'],
      globals: { Buffer: true, process: true, global: true },
    }),
  ],
  optimizeDeps: {
    include: ['exceljs'],
  },
})
