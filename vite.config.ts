import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  base: '/',
  define: {
    __GITHUB_OWNER__: JSON.stringify(process.env.VERCEL_GIT_REPO_OWNER || 'christopherdebeer'),
    __GITHUB_REPO__: JSON.stringify(process.env.VERCEL_GIT_REPO_SLUG || 'garden'),
    __GITHUB_BRANCH__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF || 'master'),
  },
  build: {
    outDir: '../../dist',
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
