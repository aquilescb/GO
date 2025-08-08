import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0', // 👈 HABILITA acceso desde fuera del contenedor
    port: 5173       // 👈 Asegura que use el mismo puerto mapeado en Docker
  }
})
