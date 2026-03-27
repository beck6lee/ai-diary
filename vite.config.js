import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/ai-diary/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
