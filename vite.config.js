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