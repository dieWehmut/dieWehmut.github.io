import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { migrateCaptureAssetImage, organizeDocImage } from './organize-doc-images.mjs'

function writeFixture(filePath, content = '') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-doc-images-'))
  const docsRoot = path.join(root, 'src', 'data', 'docs')
  fs.mkdirSync(docsRoot, { recursive: true })
  return { root, docsRoot }
}

function runTest(name, test) {
  const fixture = makeFixture()
  try {
    test(fixture)
    console.log(`PASS ${name}`)
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true })
  }
}

runTest('moves an image into the unique document folder and rewrites the link', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'DigitalSignalProcessing.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '> ![alt text](image.png)\n')
  writeFixture(imagePath, Buffer.from([1, 2, 3]))

  const result = organizeDocImage(imagePath, { docsRoot })
  const destinationPath = path.join(docsRoot, 'notes', 'DigitalSignalProcessing', 'image.png')

  assert.equal(result.status, 'moved')
  assert.equal(result.markdownPath, markdownPath)
  assert.equal(result.destinationPath, destinationPath)
  assert.equal(fs.existsSync(imagePath), false)
  assert.deepEqual(fs.readFileSync(destinationPath), Buffer.from([1, 2, 3]))
  assert.equal(
    fs.readFileSync(markdownPath, 'utf8'),
    '> ![alt text](DigitalSignalProcessing/image.png)\n',
  )
})

runTest('leaves an unreferenced image untouched', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '# Document\n')
  writeFixture(imagePath, Buffer.from([4, 5, 6]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'unreferenced')
  assert.equal(fs.existsSync(imagePath), true)
  assert.equal(fs.readFileSync(markdownPath, 'utf8'), '# Document\n')
})

runTest('reports multiple references without changing either document', ({ docsRoot }) => {
  const firstMarkdownPath = path.join(docsRoot, 'notes', 'First.md')
  const secondMarkdownPath = path.join(docsRoot, 'notes', 'Second.md')
  const imagePath = path.join(docsRoot, 'notes', 'shared.png')
  const firstContent = '![first](shared.png)\n'
  const secondContent = '<img src="shared.png" alt="second">\n'
  writeFixture(firstMarkdownPath, firstContent)
  writeFixture(secondMarkdownPath, secondContent)
  writeFixture(imagePath, Buffer.from([7, 8, 9]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'ambiguous')
  assert.equal(result.references.length, 2)
  assert.equal(fs.existsSync(imagePath), true)
  assert.equal(fs.readFileSync(firstMarkdownPath, 'utf8'), firstContent)
  assert.equal(fs.readFileSync(secondMarkdownPath, 'utf8'), secondContent)
})

runTest('adds a numeric suffix when the document folder already has that file name', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  const existingPath = path.join(docsRoot, 'notes', 'Document', 'image.png')
  writeFixture(markdownPath, '![new](image.png "caption")\n')
  writeFixture(imagePath, Buffer.from([10]))
  writeFixture(existingPath, Buffer.from([11]))

  const result = organizeDocImage(imagePath, { docsRoot })
  const destinationPath = path.join(docsRoot, 'notes', 'Document', 'image-2.png')

  assert.equal(result.status, 'moved')
  assert.equal(result.destinationPath, destinationPath)
  assert.deepEqual(fs.readFileSync(existingPath), Buffer.from([11]))
  assert.deepEqual(fs.readFileSync(destinationPath), Buffer.from([10]))
  assert.equal(
    fs.readFileSync(markdownPath, 'utf8'),
    '![new](Document/image-2.png "caption")\n',
  )
})

runTest('does not reorganize an image already inside its document folder', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'Document', 'diagram.webp')
  writeFixture(markdownPath, '![diagram](Document/diagram.webp)\n')
  writeFixture(imagePath, Buffer.from([12]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'already-organized')
  assert.equal(fs.existsSync(imagePath), true)
  assert.equal(fs.readFileSync(markdownPath, 'utf8'), '![diagram](Document/diagram.webp)\n')
})

runTest('preserves a query or hash suffix while resolving the local image path', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '![image](image.png?raw=1#preview)\n')
  writeFixture(imagePath, Buffer.from([13]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'moved')
  assert.equal(
    fs.readFileSync(markdownPath, 'utf8'),
    '![image](Document/image.png?raw=1#preview)\n',
  )
})

runTest('ignores image-looking text inside a fenced code block', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '```md\n![example](image.png)\n```\n')
  writeFixture(imagePath, Buffer.from([14]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'unreferenced')
  assert.equal(fs.existsSync(imagePath), true)
})

runTest('resolves pasted Windows-style relative separators', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '![image](.\\nested\\..\\image.png)\n')
  writeFixture(imagePath, Buffer.from([15]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'moved')
  assert.equal(fs.existsSync(path.join(docsRoot, 'notes', 'Document', 'image.png')), true)
})

runTest('ignores image-looking text inside an HTML comment', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '<!-- ![example](image.png) -->\n')
  writeFixture(imagePath, Buffer.from([16]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'unreferenced')
  assert.equal(fs.existsSync(imagePath), true)
})

runTest('rewrites the HTML src attribute even when alt repeats the file name', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '<img alt="image.png" src="image.png">\n')
  writeFixture(imagePath, Buffer.from([17]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'moved')
  assert.equal(
    fs.readFileSync(markdownPath, 'utf8'),
    '<img alt="image.png" src="Document/image.png">\n',
  )
})

runTest('keeps spaces URL-encoded for an unquoted Markdown path', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image file.png')
  writeFixture(markdownPath, '![image](image%20file.png)\n')
  writeFixture(imagePath, Buffer.from([18]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'moved')
  assert.equal(
    fs.readFileSync(markdownPath, 'utf8'),
    '![image](Document/image%20file.png)\n',
  )
})

runTest('ignores lazy-loading attributes and resolves the real HTML src', ({ docsRoot }) => {
  const markdownPath = path.join(docsRoot, 'notes', 'Document.md')
  const imagePath = path.join(docsRoot, 'notes', 'image.png')
  writeFixture(markdownPath, '<img alt="image.png" data-src="image.png" src="real.png">\n')
  writeFixture(imagePath, Buffer.from([19]))
  writeFixture(path.join(docsRoot, 'notes', 'real.png'), Buffer.from([20]))

  const result = organizeDocImage(imagePath, { docsRoot })

  assert.equal(result.status, 'unreferenced')
  assert.equal(fs.existsSync(imagePath), true)
  assert.equal(fs.readFileSync(markdownPath, 'utf8'), '<img alt="image.png" data-src="image.png" src="real.png">\n')
})

runTest('migrates a stale generated capture URL without changing metadata', () => {
  const sourceImage = '/capture-assets/docs/notes/image.png'
  const destinationImage = '/capture-assets/docs/notes/DigitalSignalProcessing/image.png'
  const assets = [
    {
      id: 'legacy-image',
      image: sourceImage,
      title: 'Handwritten title',
      tags: ['Notes'],
      sourceRefs: [{ type: 'note', id: 'DigitalSignalProcessing' }],
    },
  ]

  const migrated = migrateCaptureAssetImage(assets, sourceImage, destinationImage)

  assert.notEqual(migrated, assets)
  assert.equal(migrated.length, 1)
  assert.equal(migrated[0].image, destinationImage)
  assert.equal(migrated[0].id, 'legacy-image')
  assert.equal(migrated[0].title, 'Handwritten title')
  assert.deepEqual(migrated[0].tags, ['Notes'])
})

runTest('drops a stale duplicate when the destination capture asset already exists', () => {
  const sourceImage = '/capture-assets/docs/notes/image.png'
  const destinationImage = '/capture-assets/docs/notes/DigitalSignalProcessing/image.png'
  const currentAsset = { id: 'current-image', image: destinationImage, title: 'Current' }
  const assets = [
    { id: 'legacy-image', image: sourceImage, title: 'Legacy' },
    currentAsset,
  ]

  const migrated = migrateCaptureAssetImage(assets, sourceImage, destinationImage)

  assert.equal(migrated.length, 1)
  assert.equal(migrated[0], currentAsset)
  assert.equal(migrated[0].image, destinationImage)
})

runTest('wires generated capture migration into the dev image watcher', () => {
  const viteConfig = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'vite.config.ts'), 'utf8')

  assert.match(viteConfig, /migrateCaptureAssetImage\(migrated, sourceImage, destinationImage\)/)
  assert.match(viteConfig, /captureDocAssetUrls\(docsRoot, result\.sourcePath\)/)
  assert.match(viteConfig, /map\(\(part\) => encodeURIComponent\(part\)\)/)
  assert.match(viteConfig, /writeGeneratedCaptureAssets\(migrated\)/)
})

runTest('refreshes capture metadata through the local polling API', () => {
  const captureView = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'src', 'views', 'CaptureView.vue'), 'utf8')

  assert.match(captureView, /fetch\(`\/api\/capture\/assets\?t=\$\{Date\.now\(\)\}`/)
  assert.match(captureView, /setInterval\(refreshCaptureAssets, 1500\)/)
})
