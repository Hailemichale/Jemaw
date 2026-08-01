import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin()
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/daily': {
        target: 'https://api.daily.co/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/daily/, '')
      }
    }
  },
  build: {
    target: 'esnext',
  },
})
