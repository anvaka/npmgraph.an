import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // Allow sandboxed/reverse-proxied preview hosts
    allowedHosts: true
  }
})
