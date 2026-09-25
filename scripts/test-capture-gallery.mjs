import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * The capture generator serves the gallery from two sources: the references a
 * Markdown file still names, and the entries already in the generated data. An
 * entry outlives its reference — a document that swapped one page for another
 * leaves the old entry behind — so this fixture drives the generator through
 * both paths and checks what it publishes.
 *
 * The fixture stands in for the private assets repository, which is the only
 * source a deployed build can read. The public cache is a local convenience and
 * is never present on a fresh checkout, so the checks below look at what a
 * deployed build would see.
 */
const repoRoot = path.resolve(import.meta.dirname, '..')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-capture-gallery-'))
const docsRoot = path.join(root, 'src', 'data', 'docs')
const assetsDir = path.join(root, 'diesw-assets')
const publicDir = path.join(root, 'public', 'capture-assets')
const markdownPath = path.join(docsRoot, 'notes', 'Gallery.md')
const generatedPath = path.join(root, 'src', 'data', 'capture', 'generated.ts')
const manifestPath = path.join(root, 'src', 'data', 'capture', 'manifest.json')

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

write(markdownPath, [
  '---',
  'date: 2026-05-01',
  'tags: [gallery]',
  '---',
  '# Gallery',
  '![kept](Gallery/kept.png)',
  '',
].join('\n'))

// A referenced image whose file lives in the assets repository.
write(path.join(assetsDir, 'docs', 'Gallery', 'kept.png'), Buffer.from([1, 2, 3]))
// An orphaned entry: still listed in the generated data, still in the assets
// repository, but no Markdown file points at it any more.
write(path.join(assetsDir, 'docs', 'Gallery', 'orphan.png'), Buffer.from([4, 5, 6]))
// A stale entry: listed in the generated data, and its file is gone from the
// assets repository, so no deployed build can serve it.
// A stale entry that only the local cache still holds, which a deployed build
// never has either.
write(path.join(publicDir, 'docs', 'Gallery', 'cache-only.png'), Buffer.from([10, 11, 12]))

write(manifestPath, '[]\n')
write(generatedPath, [
  "import type { CaptureAsset } from '../../types/content'",
  '',
  'export const generatedCaptureAssets: CaptureAsset[] = [',
  '  {',
  '    "id": "docs-Gallery-orphan",',
  '    "image": "/capture-assets/docs/Gallery/orphan.png",',
  '    "title": "Orphan",',
  '    "date": "2026-05-01",',
  '    "tags": [],',
  '    "summary": "",',
  '    "sourceRefs": [],',
  '    "standalone": false',
  '  },',
  '  {',
  '    "id": "docs-Gallery-stale",',
  '    "image": "/capture-assets/docs/Gallery/stale.png",',
  '    "title": "Stale",',
  '    "date": "2026-05-01",',
  '    "tags": [],',
  '    "summary": "",',
  '    "sourceRefs": [],',
  '    "standalone": false',
  '  },',
  '  {',
  '    "id": "docs-Gallery-cache-only",',
  '    "image": "/capture-assets/docs/Gallery/cache-only.png",',
  '    "title": "Cache only",',
  '    "date": "2026-05-01",',
  '    "tags": [],',
  '    "summary": "",',
  '    "sourceRefs": [],',
  '    "standalone": false',
  '  }',
  '] as CaptureAsset[]',
  '',
  'export default generatedCaptureAssets',
  '',
].join('\n'))

const run = spawnSync(process.execPath, [path.join(repoRoot, 'scripts', 'generate-capture.mjs')], {
  cwd: root,
  env: { ...process.env, DIESW_ASSETS_DIR: assetsDir },
  encoding: 'utf8',
})

const generated = fs.readFileSync(generatedPath, 'utf8')
const images = [...generated.matchAll(/"image":\s*"([^"]+)"/g)].map((match) => match[1])
const publicCopy = (name) => path.join(publicDir, 'docs', 'Gallery', name)

const checks = [
  ['the generator succeeds on a docs-only checkout', run.status === 0],
  ['a referenced image is published', images.includes('/capture-assets/docs/Gallery/kept.png')
    && fs.existsSync(publicCopy('kept.png'))],
  // The whole point of the sweep: an entry the gallery still lists has to render,
  // so its file is copied out of the assets repository even without a reference.
  ['an unreferenced entry the assets repository holds is still published', images.includes('/capture-assets/docs/Gallery/orphan.png')
    && fs.existsSync(publicCopy('orphan.png'))],
  ['the copied orphan matches its repository source', fs.existsSync(publicCopy('orphan.png'))
    && fs.readFileSync(publicCopy('orphan.png')).equals(fs.readFileSync(path.join(assetsDir, 'docs', 'Gallery', 'orphan.png')))],
  // An entry no deployed build can serve is dropped rather than advertised.
  ['an unreferenced entry with no repository source is dropped', !images.includes('/capture-assets/docs/Gallery/stale.png')
    && !fs.existsSync(publicCopy('stale.png'))],
  ['an entry only the local cache holds is dropped too', !images.includes('/capture-assets/docs/Gallery/cache-only.png')],
]

try {
  const failures = checks.filter(([, ok]) => !ok)
  for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  if (run.status !== 0) console.error(run.stdout, run.stderr)
  assert.equal(failures.length, 0)
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
