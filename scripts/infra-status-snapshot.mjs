import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import ts from 'typescript'

export function extractInfraUrls(source) {
  const urls = []
  const seen = new Set()

  const sourceFile = ts.createSourceFile(
    'infra.ts',
    String(source),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const propertyName = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)
        ? node.name.text
        : ''
      const initializer = node.initializer
      if (
        propertyName === 'url' &&
        (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer))
      ) {
        const url = initializer.text.trim()
        try {
          const parsed = new URL(url)
          if (
            (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
            !parsed.username &&
            !parsed.password &&
            !seen.has(url)
          ) {
            seen.add(url)
            urls.push(url)
          }
        } catch {
          // Ignore malformed or unsupported URL values.
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return urls
}

export function readInfraUrls(filePath) {
  return extractInfraUrls(fs.readFileSync(filePath, 'utf8'))
}

function isSafeProbeUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return false

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data.ec2.internal'
  ) return false

  const ipVersion = net.isIP(hostname)
  if (ipVersion === 4) {
    const octets = hostname.split('.').map(Number)
    const [first, second] = octets
    if (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    ) return false
  }
  if (ipVersion === 6 && /^(::|::1|fc|fd|fe80:)/i.test(hostname)) return false
  return true
}

async function fetchStatus(url, fetchImpl, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    })
    const status = response.status === 200 ? 'online' : 'offline'
    try {
      await response.body?.cancel?.()
    } catch {
      // The HTTP status is authoritative even if body cleanup fails.
    }
    return status
  } catch {
    return 'offline'
  } finally {
    clearTimeout(timer)
  }
}

export async function createInfraStatusSnapshot(urls, options = {}) {
  const {
    fetchImpl = fetch,
    timeoutMs = 5000,
    generatedAt = new Date(),
    concurrency = 6,
  } = options
  const uniqueUrls = [...new Set(urls.filter((url) => /^https?:\/\//i.test(url)))]
  const entries = new Array(uniqueUrls.length)
  let nextIndex = 0
  const workerCount = Math.min(
    uniqueUrls.length,
    Math.max(1, Number.isFinite(concurrency) ? Math.floor(concurrency) : 6),
  )

  async function probeNext() {
    while (nextIndex < uniqueUrls.length) {
      const index = nextIndex
      nextIndex += 1
      const url = uniqueUrls[index]
      entries[index] = [url, isSafeProbeUrl(url) ? await fetchStatus(url, fetchImpl, timeoutMs) : 'offline']
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => probeNext()))
  const statuses = Object.fromEntries(entries)
  return {
    version: 1,
    generatedAt: new Date(generatedAt).toISOString(),
    statuses,
  }
}

export function writeInfraStatusSnapshot(filePath, snapshot) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
}
