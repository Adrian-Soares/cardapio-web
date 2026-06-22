import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base padrão "/" serve para a Hostinger (domínio raiz) e para o dev.
// No GitHub Pages o build usa `--base=/cardapio-web/` (script build:pages).
export default defineConfig({
  base: '/',
  plugins: [react()],
})
