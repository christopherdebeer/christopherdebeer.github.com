import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  base: '/',
  build: {
    outDir: '../../docs',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        edit: resolve(__dirname, 'src/client/edit.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/styles.css'
          }
          return 'assets/[name][extname]'
        },
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
      },
    },
  },
})
