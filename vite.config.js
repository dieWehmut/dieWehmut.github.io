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
        rewrite: (path) => path.replace(/^\/api\/contributions/, '/users/dieWehmut/contributions'),
        // shorten proxy timeouts in dev to avoid long waits if upstream is unreachable
        proxyTimeout: 5000,
        timeout: 5000,
        onError(err, req, res) {
          // avoid verbose stack traces in dev when upstream times out or refuses connection
          // log concise warning and return a 502 so the client can show a fallback image
          try { console.warn('[dev-proxy] /api/contributions error:', err && err.message) } catch (e) {}
          try {
            if (res && !res.headersSent) {
              res.writeHead && res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end && res.end('proxy error');
            }
          } catch (e) {}
        }
      }
      ,
      '/api/trophy': {
        target: 'https://github-profile-trophy.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/trophy/, '/?username=dieWehmut&theme=tokyonight&no-frame=true&margin-w=10&margin-h=10'),
        proxyTimeout: 5000,
        timeout: 5000,
        onError(err, req, res) {
          try { console.warn('[dev-proxy] /api/trophy error:', err && err.message) } catch (e) {}
          try {
            if (res && !res.headersSent) {
              res.writeHead && res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end && res.end('proxy error');
            }
          } catch (e) {}
        }
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