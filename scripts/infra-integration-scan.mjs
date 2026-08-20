import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const excludedContent = new Set([
  'src/data/docs/posts/development-log.md',
])

const excludedDirectories = new Set(['.git', 'node_modules', 'dist'])
const textPattern = /\.(?:ts|tsx|vue|mjs|js|json|ya?ml|md)$/i
const forbiddenProduct = ['ku', 'ma'].join('')

function walk(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) return []
    const absolute = path.join(root, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

export function findForbiddenIntegrationReferences(root, trackedPaths) {
  const normalized = trackedPaths.map((file) => file.replaceAll('\\', '/'))
  const pathMatches = normalized.filter((file) => file.toLowerCase().includes(forbiddenProduct))
  const contentMatches = normalized
    .filter((file) => textPattern.test(file))
    .filter((file) => file !== 'scripts/test-infra-status.mjs')
    .filter((file) => file !== 'scripts/test-infra-integration-scan.mjs')
    .filter((file) => !excludedContent.has(file))
    .filter((file) => fs.existsSync(path.join(root, file)))
    .filter((file) =>
      fs.readFileSync(path.join(root, file), 'utf8').toLowerCase().includes(forbiddenProduct),
    )

  return { pathMatches, contentMatches }
}

export function listProjectFiles(root) {
  try {
    return execFileSync('git', ['-C', root, 'ls-files', '-z'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
  } catch {
    return walk(root).map((file) => path.relative(root, file).replaceAll('\\', '/'))
  }
}
