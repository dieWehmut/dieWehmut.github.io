import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const modulePath = path.join(scriptDirectory, 'infra-integration-scan.mjs')

if (!fs.existsSync(modulePath)) {
  console.error('FAIL reusable infra integration scanner exists')
  process.exit(1)
}

const { findForbiddenIntegrationReferences, listProjectFiles } = await import(
  pathToFileURL(modulePath).href,
)

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-infra-scan-'))
const product = ['ku', 'ma'].join('')
const runtimePath = 'src/composables/runtime-status.ts'
const historyPath = 'src/data/docs/posts/development-log.md'
const ignoredPath = 'node_modules/ignored.js'

for (const [relative, content] of [
  [runtimePath, `const provider = '${product}'\n`],
  [historyPath, `- historical commit removed ${product}\n`],
  [ignoredPath, `const ignored = '${product}'\n`],
]) {
  const absolute = path.join(root, relative)
  fs.mkdirSync(path.dirname(absolute), { recursive: true })
  fs.writeFileSync(absolute, content)
}

const projectFiles = listProjectFiles(root)
if (!projectFiles.includes(runtimePath) || !projectFiles.includes(historyPath)) {
  console.error(`FAIL no-Git fallback lists project files: ${projectFiles.join(',')}`)
  process.exit(1)
}
if (projectFiles.includes(ignoredPath)) {
  console.error('FAIL no-Git fallback excludes node_modules')
  process.exit(1)
}

const references = findForbiddenIntegrationReferences(root, projectFiles)
if (references.contentMatches.join(',') !== runtimePath) {
  console.error(`FAIL generated history is excluded: ${references.contentMatches.join(',')}`)
  process.exit(1)
}

console.log('PASS generated history is excluded from runtime integration scanning')
console.log('PASS no-Git staging fallback excludes dependency files')
