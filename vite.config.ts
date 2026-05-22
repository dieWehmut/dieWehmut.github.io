import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

const base = '/';

/** Custom plugin: copies the built index.html to 404.html so GitHub Pages
 *  serves the SPA for unknown paths (e.g. /services) instead of a 404. */
function copy404Plugin() {
  return {
    name: 'vite-copy-404',
    closeBundle() {
      const distIndex = path.resolve(__dirname, 'dist', 'index.html')
      const dist404 = path.resolve(__dirname, 'dist', '404.html')
      if (fs.existsSync(distIndex)) {
        fs.copyFileSync(distIndex, dist404)
      }
    },
  }
}

/** Custom plugin: /api/ping proxy for client-side URL health checks.
 *  The browser calls /api/ping?url=... (same-origin → no CORS),
 *  and the dev server forwards the request server-side to the target.
 *  Because Vite runs on the user's machine, the target sees the user's IP. */
function pingProxy() {
  return {
    name: 'vite-ping-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ping', async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('url')
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'Missing ?url=' }))
          return
        }

        const t0 = performance.now()
        try {
          const ctrl = new AbortController()
          const t = setTimeout(() => ctrl.abort(), 5000)

          const upstream = await fetch(url, {
            signal: ctrl.signal,
            redirect: 'follow',
          })

          clearTimeout(t)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            ok: true,
            status: upstream.status,
            latency: Math.round(performance.now() - t0),
          }))
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            ok: false,
            error: (err as any)?.name === 'AbortError' ? 'timeout' : 'unreachable',
            latency: Math.round(performance.now() - t0),
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), pingProxy(), copy404Plugin()],
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