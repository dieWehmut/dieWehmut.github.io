import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  documentAssetSourceCandidates,
  documentAssetUrl,
  flattenDocumentAssetPath,
} from './organize-doc-images.mjs'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-doc-assets-'))
const docsRoot = path.join(root, 'src', 'data', 'docs')
const markdownPath = path.join(docsRoot, 'notes', 'DigitalSignalProcessing.md')
const imagePath = path.join(docsRoot, 'notes', 'DigitalSignalProcessing', 'image.png')
const repoRoot = path.resolve(import.meta.dirname, '..')
const docsIndex = fs.readFileSync(path.join(repoRoot, 'src', 'data', 'docs', 'index.ts'), 'utf8')
const viteConfig = fs.readFileSync(path.join(repoRoot, 'vite.config.ts'), 'utf8')
const syncScriptPath = path.join(repoRoot, 'scripts', 'sync-doc-image.mjs')
const syncScript = fs.existsSync(syncScriptPath) ? fs.readFileSync(syncScriptPath, 'utf8') : ''
fs.mkdirSync(path.dirname(imagePath), { recursive: true })
fs.writeFileSync(markdownPath, [
  '---',
  'date: 2026-09-11',
  '---',
  '# Digital Signal Processing',
  '![diagram](DigitalSignalProcessing/image.png)',
  '',
].join('\n'))
fs.writeFileSync(imagePath, Buffer.from([1, 2, 3]))
const unreferencedImagePath = path.join(
  docsRoot,
  'notes',
  'DigitalSignalProcessing',
  'image-4.png',
)
fs.writeFileSync(unreferencedImagePath, Buffer.from([4, 4, 4]))

const checks = [
  [
    'document image URLs are flattened below docs',
    documentAssetUrl(docsRoot, markdownPath, 'DigitalSignalProcessing/image.png')
      === '/capture-assets/docs/DigitalSignalProcessing/image.png',
  ],
  [
    'local document image paths are flattened below docs',
    flattenDocumentAssetPath(docsRoot, imagePath)
      === path.join('DigitalSignalProcessing', 'image.png'),
  ],
  [
    'legacy grouped assets keep their existing path',
    documentAssetUrl(docsRoot, markdownPath, '/capture-assets/docs/chemistry/Chemistry_1.jpg')
      === '/capture-assets/docs/chemistry/Chemistry_1.jpg',
  ],
  [
    'source lookup checks the flattened local document folder',
    documentAssetSourceCandidates(
      docsRoot,
      path.join(root, 'diesw-assets'),
      markdownPath,
      '/capture-assets/docs/DigitalSignalProcessing/image.png',
    ).some((candidate) => path.resolve(candidate) === path.resolve(imagePath)),
  ],
  [
    'browser document URLs flatten the document folder name',
    /docBase|documentName|flatten/.test(docsIndex)
      && /capture-assets\/docs/.test(docsIndex),
  ],
  [
    'image moves trigger a full rebuild and browser reload',
    /generate-capture|capture:sync/.test(viteConfig)
      && /type:\s*['"]full-reload['"]/.test(viteConfig),
  ],
  [
    'remote image sync targets docs/<document>/ and pushes asynchronously',
    /path\.join\(['"]docs['"],\s*documentName/.test(syncScript)
      && /git/.test(syncScript)
      && /push/.test(syncScript)
      && /no-push/.test(syncScript),
  ],
]

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${args.join(' ')} failed: ${result.stderr}`)
  return String(result.stdout || '').trim()
}

const fixtureAssets = path.join(root, 'diesw-assets')
const fixtureMarkdown = path.join(docsRoot, 'nested', 'Foo.md')
const fixtureImage = path.join(docsRoot, 'nested', 'Foo', 'image file.png')
const fixtureLegacy = path.join(fixtureAssets, 'docs', 'nested', 'Foo', 'image file.png')
fs.mkdirSync(path.dirname(fixtureImage), { recursive: true })
fs.mkdirSync(path.dirname(fixtureLegacy), { recursive: true })
fs.writeFileSync(fixtureMarkdown, '# Foo\n')
fs.writeFileSync(fixtureImage, Buffer.from([9, 8, 7]))
fs.writeFileSync(fixtureLegacy, Buffer.from([1, 2, 3]))
fs.writeFileSync(path.join(fixtureAssets, '.gitignore'), '')
runGit(['init', '-q'], fixtureAssets)
runGit(['config', 'user.email', 'test@example.invalid'], fixtureAssets)
runGit(['config', 'user.name', 'Nexus Test'], fixtureAssets)
runGit(['add', '.'], fixtureAssets)
runGit(['commit', '-qm', 'fixture'], fixtureAssets)
runGit(['init', '-q'], root)

const syncResult = spawnSync(process.execPath, [
  syncScriptPath,
  `--source=${fixtureImage}`,
  `--markdown=${fixtureMarkdown}`,
  `--docs-root=${docsRoot}`,
  `--assets-dir=${fixtureAssets}`,
  '--no-push',
], { cwd: repoRoot, encoding: 'utf8' })
checks.push([
  'sync-doc-image handles tracked legacy paths and spaces without a pathspec error',
  syncResult.status === 0
    && fs.existsSync(path.join(fixtureAssets, 'docs', 'Foo', 'image file.png'))
    && !fs.existsSync(fixtureLegacy)
    && /Synchronized locally/.test(`${syncResult.stdout}\n${syncResult.stderr}`),
])

const assetSyncResult = spawnSync(process.execPath, [
  path.join(repoRoot, 'scripts', 'sync-assets-repo.mjs'),
  '--no-push',
], {
  cwd: root,
  env: { ...process.env, DIESW_ASSETS_DIR: fixtureAssets },
  encoding: 'utf8',
})
const syncedDocsMetaPath = path.join(fixtureAssets, 'docs', 'docs-meta.json')
const syncedDocsMeta = fs.existsSync(syncedDocsMetaPath)
  ? JSON.parse(fs.readFileSync(syncedDocsMetaPath, 'utf8'))
  : {}
checks.push([
  'full asset sync uses flat document folders without publishing unreferenced local images',
  assetSyncResult.status === 0
    && fs.existsSync(path.join(fixtureAssets, 'docs', 'DigitalSignalProcessing', 'image.png'))
    && !fs.existsSync(path.join(fixtureAssets, 'docs', 'DigitalSignalProcessing', 'image-4.png'))
    && !fs.existsSync(path.join(fixtureAssets, 'docs', 'notes', 'DigitalSignalProcessing'))
    && syncedDocsMeta.DigitalSignalProcessing === '2026-09-11'
    && /Synchronized locally/.test(`${assetSyncResult.stdout}\n${assetSyncResult.stderr}`),
])

try {
  const failures = checks.filter(([, ok]) => !ok)
  for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  assert.equal(failures.length, 0)
} finally {
  fs.rmSync(root, { recursive: true, force: true })
  fs.rmSync(fixtureAssets, { recursive: true, force: true })
}
