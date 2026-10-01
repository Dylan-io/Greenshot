/* Configuration Vite — NE PAS MODIFIER.
   Pas d'alias, pas de base, pas de proxy : le site est autonome.
   Les visuels vivent dans public/images/ et sont référencés /images/... */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { port: 4385, open: true }
})
