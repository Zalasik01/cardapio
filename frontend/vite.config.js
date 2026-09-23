import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // data/hora do build (em dev, do inicio do servidor); exibida na tela de login para controle de versao
  define: {
    __DATA_BUILD__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
