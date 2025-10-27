import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' 

const base = '/';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },
  server: {
    // Dev proxy to allow loading GitHub's contributions SVG locally.
    // This proxies /api/contributions -> https://github.com/users/dieWehmut/contributions
    proxy: {
      '/api/contributions': {
        target: 'https://github.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/contributions/, '/users/dieWehmut/contributions')
      }
      ,
      '/api/trophy': {
        target: 'https://github-profile-trophy.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/trophy/, '/?username=dieWehmut&theme=tokyonight&no-frame=true&margin-w=10&margin-h=10')
      }
    }
  },
  base,
  build: {
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]' 
      }
    }
  }
})