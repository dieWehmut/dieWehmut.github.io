import fs from 'fs'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const base = '/'
const GITHUB_USER = 'dieWehmut'

function copy404Plugin(): Plugin {
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

function writeJson(res: ServerResponse, body: unknown, statusCode = 200): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function pingProxy(): Plugin {
  return {
    name: 'vite-ping-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/ping', async (req: IncomingMessage, res: ServerResponse) => {
        const host = req.headers.host || '127.0.0.1'
        const requestUrl = req.url || '/'
        const url = new URL(requestUrl, `http://${host}`).searchParams.get('url')

        if (!url) {
          writeJson(res, { ok: false, error: 'Missing ?url=' }, 400)
          return
        }

        const t0 = performance.now()
        try {
          const ctrl = new AbortController()
          const timer = setTimeout(() => ctrl.abort(), 4000)

          const upstream = await fetch(url, {
            signal: ctrl.signal,
            redirect: 'follow',
          })

          clearTimeout(timer)
          writeJson(res, {
            ok: true,
            status: upstream.status,
            latency: Math.round(performance.now() - t0),
          })
        } catch (error: unknown) {
          const err = error as { name?: string; cause?: { code?: string }; code?: string }
          const code = err.cause?.code || err.code || ''
          const isAbort = err.name === 'AbortError'
          const isConnRefused = code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'EAI_AGAIN'
          writeJson(res, {
            ok: false,
            error: isAbort && !isConnRefused ? 'timeout' : 'offline',
            latency: Math.round(performance.now() - t0),
          })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), pingProxy(), copy404Plugin()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api/contributions': {
        target: 'https://github.com',
        changeOrigin: true,
        secure: true,
        rewrite: (proxyPath) =>
          proxyPath.replace(/^\/api\/contributions/, `/users/${GITHUB_USER}/contributions`),
        proxyTimeout: 5000,
        timeout: 5000,
      },
      '/api/trophy': {
        target: 'https://github-profile-trophy.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (proxyPath) =>
          proxyPath.replace(
            /^\/api\/trophy/,
            `/?username=${GITHUB_USER}&theme=tokyonight&no-frame=true&margin-w=10&margin-h=10`
          ),
        proxyTimeout: 5000,
        timeout: 5000,
      },
    },
  },
  preview: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  base,
  build: {
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
