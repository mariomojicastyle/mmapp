// vite.config.js (Versión LIMPIA y ESTABLE)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Eliminamos completamente la sección 'css' que estaba dando problemas
})