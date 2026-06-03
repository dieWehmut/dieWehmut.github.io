import fs from 'fs'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import { execFileSync } from 'child_process'
import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { siteConfig } from './src/data/site/config'

function normalizeBasePath(value?: string): string {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

const base = normalizeBasePath(process.env.BASE_PATH || process.env.VITE_BASE_PATH)
const githubUser = siteConfig.githubUser
const captureUrlPrefix = '/capture-assets/'
const generatedCapturePath = path.resolve(__dirname, 'src', 'data', 'capture', 'generated.ts')
const publicCaptureDir = path.resolve(__dirname, 'public', 'capture-assets')
const distCaptureDir = path.resolve(__dirname, 'dist', 'capture-assets')

function toWatchPattern(filePath: string): string {
  return filePath.replace(/\\/g, '/')
}

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
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}

function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readGeneratedCaptureAssets(): any[] {
  const raw = fs.readFileSync(generatedCapturePath, 'utf8')
  const match = raw.match(/export const generatedCaptureAssets: CaptureAsset\[\] = ([\s\S]*?) as CaptureAsset\[\]/)
  if (!match) throw new Error('Unable to parse generated capture assets.')
  const assets = JSON.parse(match[1])
  if (!Array.isArray(assets)) throw new Error('Generated capture assets must be an array.')
  return assets
}

function writeGeneratedCaptureAssets(assets: any[]): void {
  const serialized = JSON.stringify(assets, null, 2)
  const moduleText = `import type { CaptureAsset } from '../../types/content'\n\nexport const generatedCaptureAssets: CaptureAsset[] = ${serialized} as CaptureAsset[]\n\nexport default generatedCaptureAssets\n`
  fs.writeFileSync(generatedCapturePath, moduleText, 'utf8')
}

function sanitizeFilePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'capture'
}

function extensionFromMime(mime: string): string {
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/png') return '.png'
  if (mime === 'image/gif') return '.gif'
  if (mime === 'image/avif') return '.avif'
  if (mime === 'image/webp') return '.webp'
  return ''
}

function parseJsonBody(buffer: Buffer): any {
  if (!buffer.length) return {}
  return JSON.parse(buffer.toString('utf8'))
}

function currentGithubUser(): string {
  try {
    return execFileSync('gh', ['api', 'user', '--jq', '.login'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function getCaptureEditorAuth() {
  const login = currentGithubUser()
  const owner = siteConfig.owner || siteConfig.githubUser
  const ownerAuthorized = Boolean(login) && login.toLowerCase() === owner.toLowerCase()
  return {
    ok: true,
    enabled: true,
    authenticated: Boolean(login),
    authorized: true,
    localDev: true,
    ownerAuthorized,
    login,
    owner,
  }
}

function assertCaptureEditor(res: ServerResponse): boolean {
  const auth = getCaptureEditorAuth()
  if (auth.authorized) return true

  writeJson(res, {
    ...auth,
    ok: false,
    error: auth.authenticated ? 'GitHub user is not the site owner.' : 'Local capture editor is unavailable.',
  }, 401)
  return false
}

function captureAssetFilePath(asset: any, captureDir: string): string {
  const image = String(asset?.image || '')
  if (!image.startsWith(captureUrlPrefix)) return ''
  const relative = image.slice(captureUrlPrefix.length).replace(/\//g, path.sep)
  const filePath = path.resolve(captureDir, relative)
  const captureRoot = path.resolve(captureDir)
  if (!filePath.startsWith(captureRoot + path.sep)) return ''
  return filePath
}

function readAvailableCaptureAssets(captureDir: string): any[] {
  return readGeneratedCaptureAssets().filter((asset) => {
    const image = String(asset?.image || '')
    if (!image.startsWith(captureUrlPrefix)) return true
    const filePath = captureAssetFilePath(asset, captureDir)
    return Boolean(filePath && fs.existsSync(filePath))
  })
}

function registerCaptureAssetListApi(
  middlewares: ViteDevServer['middlewares'],
  captureDir: string
): void {
  middlewares.use('/api/capture/assets', (_req: IncomingMessage, res: ServerResponse) => {
    try {
      writeJson(res, {
        ok: true,
        assets: readAvailableCaptureAssets(captureDir),
        checkedAt: Date.now(),
      })
    } catch (error) {
      writeJson(res, { ok: false, error: error instanceof Error ? error.message : String(error) }, 500)
    }
  })
}

function captureEditPlugin(): Plugin {
  return {
    name: 'vite-capture-edit-api',
    configureServer(server: ViteDevServer) {
      registerCaptureAssetListApi(server.middlewares, publicCaptureDir)

      server.middlewares.use('/api/capture/auth', (_req: IncomingMessage, res: ServerResponse) => {
        writeJson(res, getCaptureEditorAuth())
      })

      server.middlewares.use('/api/capture/upload', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          writeJson(res, { ok: false, error: 'Method not allowed' }, 405)
          return
        }
        if (!assertCaptureEditor(res)) return

        try {
          const body = parseJsonBody(await readRequestBody(req))
          const imageData = String(body.imageData || '')
          const dataUrlMatch = imageData.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i)
          if (!dataUrlMatch) {
            writeJson(res, { ok: false, error: 'imageData must be a base64 image data URL.' }, 400)
            return
          }

          const mime = dataUrlMatch[1].toLowerCase()
          const ext = extensionFromMime(mime)
          if (!ext) {
            writeJson(res, { ok: false, error: `Unsupported image type: ${mime}` }, 400)
            return
          }

          const now = new Date()
          const date = String(body.date || now.toISOString().slice(0, 10)).trim()
          const id = `local-${now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 8)}`
          const fileName = `${sanitizeFilePart(id)}${ext}`
          const month = date.match(/^(\d{4}-\d{2})/)?.[1] || 'undated'
          const relativePath = `local/${month}/${fileName}`
          const destinationPath = path.join(publicCaptureDir, relativePath)

          fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
          fs.writeFileSync(destinationPath, Buffer.from(dataUrlMatch[2], 'base64'))

          const tags = Array.isArray(body.tags)
            ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
            : String(body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean)
          const asset = {
            id,
            image: `${captureUrlPrefix}${relativePath.replace(/\\/g, '/')}`,
            title: String(body.title || '').trim(),
            date,
            tags,
            summary: String(body.summary || '').trim(),
            sourceRefs: [],
            standalone: true,
          }

          const assets = readGeneratedCaptureAssets()
          assets.unshift(asset)
          writeGeneratedCaptureAssets(assets)
          writeJson(res, { ok: true, asset })
        } catch (error) {
          writeJson(res, { ok: false, error: error instanceof Error ? error.message : String(error) }, 500)
        }
      })

      server.middlewares.use('/api/capture/delete', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST' && req.method !== 'DELETE') {
          writeJson(res, { ok: false, error: 'Method not allowed' }, 405)
          return
        }
        if (!assertCaptureEditor(res)) return

        try {
          const body = parseJsonBody(await readRequestBody(req))
          const id = String(body.id || '').trim()
          if (!id) {
            writeJson(res, { ok: false, error: 'Missing capture id.' }, 400)
            return
          }

          const assets = readGeneratedCaptureAssets()
          const target = assets.find((asset) => asset.id === id)
          if (!target) {
            writeJson(res, { ok: false, error: 'Capture asset not found.' }, 404)
            return
          }

          const image = String(target.image || '')
          if (image.startsWith(captureUrlPrefix)) {
            const relative = image.slice(captureUrlPrefix.length).replace(/\//g, path.sep)
            const filePath = path.resolve(publicCaptureDir, relative)
            const publicRoot = path.resolve(publicCaptureDir)
            if (filePath.startsWith(publicRoot + path.sep) && fs.existsSync(filePath)) {
              fs.rmSync(filePath, { force: true })
            }
          }

          writeJson(res, { ok: true, id })
        } catch (error) {
          writeJson(res, { ok: false, error: error instanceof Error ? error.message : String(error) }, 500)
        }
      })
    },
    configurePreviewServer(server: PreviewServer) {
      registerCaptureAssetListApi(server.middlewares, distCaptureDir)
    },
  }
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
  plugins: [vue(), tailwindcss(), pingProxy(), captureEditPlugin(), copy404Plugin()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    cors: true,
    watch: {
      ignored: [
        toWatchPattern(generatedCapturePath),
        `${toWatchPattern(publicCaptureDir)}/**`,
        `${toWatchPattern(distCaptureDir)}/**`,
      ],
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api/contributions': {
        target: 'https://github.com',
        changeOrigin: true,
        secure: true,
        rewrite: (proxyPath) =>
          proxyPath.replace(/^\/api\/contributions/, `/users/${githubUser}/contributions`),
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
            `/?username=${githubUser}&theme=tokyonight&no-frame=true&margin-w=10&margin-h=10`
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
