import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        funciones: resolve(__dirname, 'funciones.html'),
        precio: resolve(__dirname, 'precio.html'),
        faq: resolve(__dirname, 'faq.html'),
        contacto: resolve(__dirname, 'contacto.html'),
      },
    },
  },
})
