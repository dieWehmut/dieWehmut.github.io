import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

// The deployment runner uses Node 20, which cannot import TypeScript directly.
const source = fs.readFileSync(new URL('../src/utils/imageAnnotations.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const {
  annotationImageKey, normalizeImageAnnotations,
  cachedImageAnnotations, writeImageAnnotations, readImageAnnotations, imageAnnotationsAreTemporary,
  subscribeImageAnnotations,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)

const stroke = { id: 'stroke-1', kind: 'pen', color: '#ef476f', width: .003, points: [{ x: .1, y: .2 }, { x: .4, y: .6 }] }
const text = { id: 'text-1', kind: 'text', color: '#ffd43b', size: .02, x: .5, y: .6, text: 'important\n<script>literal text</script>' }

test('the same image opened by a document or gallery shares its local cache', () => {
  const base = 'https://example.test/note/DSP'
  assert.equal(annotationImageKey('/capture-assets/docs/DSP/01.webp#preview', base),
    annotationImageKey('https://example.test/capture-assets/docs/DSP/01.webp', base))
})

test('different images and meaningful URL queries have independent caches', () => {
  const base = 'https://example.test/'
  assert.notEqual(annotationImageKey('/one.webp', base), annotationImageKey('/two.webp', base))
  assert.notEqual(annotationImageKey('/one.webp?version=1', base), annotationImageKey('/one.webp?version=2', base))
})

test('stroke coordinates and text survive a serialization round trip', () => {
  const input = [stroke, { ...stroke, id: 'highlight', kind: 'highlighter' }, text]
  assert.deepEqual(normalizeImageAnnotations(JSON.parse(JSON.stringify(input))), input)
  const copied = normalizeImageAnnotations(input)
  copied[0].points[0].x = 1
  assert.equal(stroke.points[0].x, .1)
})

test('invalid stored coordinates and unsupported marks do not break rendering', () => {
  assert.deepEqual(normalizeImageAnnotations([
    { ...stroke, points: [{ x: Infinity, y: 1 }, { x: -.2, y: .2 }] },
    { ...stroke, color: 'url(javascript:bad)' },
    { ...text, size: NaN }, { ...text, x: 2 }, { ...text, text: '  ' },
    { ...stroke, kind: 'unknown' }, null,
  ]), [])
})

test('unavailable local storage retains the session copy without claiming persistence', async () => {
  // Node has no IndexedDB. A blocked browser storage API follows this same path.
  await assert.rejects(writeImageAnnotations('one', [stroke, text]))
  assert.deepEqual(cachedImageAnnotations('one'), [stroke, text])
  assert.equal(imageAnnotationsAreTemporary('one'), true)
  assert.deepEqual(await readImageAnnotations('one'), [stroke, text])
  await assert.rejects(writeImageAnnotations('two', [text]))
  await assert.rejects(writeImageAnnotations('one', []))
  assert.deepEqual(cachedImageAnnotations('one'), [])
  assert.deepEqual(cachedImageAnnotations('two'), [text])
})

test('original images receive drawing, undo and clear updates even if disk storage fails', async () => {
  const updates = []
  const unsubscribe = subscribeImageAnnotations((key, items) => updates.push({ key, items }))
  await assert.rejects(writeImageAnnotations('inline', [stroke, text]))
  await assert.rejects(writeImageAnnotations('inline', [stroke]))
  await assert.rejects(writeImageAnnotations('inline', []))
  assert.deepEqual(updates.map(({ key, items }) => [key, items.length]), [
    ['inline', 2], ['inline', 1], ['inline', 0],
  ])
  unsubscribe()
  await assert.rejects(writeImageAnnotations('inline', [text]))
  assert.equal(updates.length, 3)
})

test('an initial disk read cannot replace a newer drawing with stale annotations', async () => {
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}#race`)
  const original = globalThis.indexedDB
  let pendingRead
  globalThis.indexedDB = { open() {
    const request = {}
    queueMicrotask(() => {
      request.result = { transaction(_store, mode) {
        const transaction = { objectStore: () => ({
          get() { pendingRead = {}; return pendingRead },
          put() { queueMicrotask(() => transaction.oncomplete?.()) },
        }) }
        assert.ok(['readonly', 'readwrite'].includes(mode))
        return transaction
      } }
      request.onsuccess()
    })
    return request
  } }
  try {
    const reading = isolated.readImageAnnotations('race')
    while (!pendingRead) await new Promise(setImmediate)
    const writing = isolated.writeImageAnnotations('race', [stroke, text])
    pendingRead.result = { items: [] }
    pendingRead.onsuccess()
    assert.deepEqual(await reading, [stroke, text])
    await writing
    assert.deepEqual(await isolated.readImageAnnotations('race'), [stroke, text])
  } finally {
    if (original === undefined) delete globalThis.indexedDB
    else globalThis.indexedDB = original
  }
})

test('editor and original image share safe, aspect-correct annotation rendering', async () => {
  const renderSource = fs.readFileSync(new URL('../src/utils/imageAnnotationRender.ts', import.meta.url), 'utf8')
  const renderCompiled = ts.transpileModule(renderSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  const { renderImageAnnotations } = await import(`data:text/javascript;base64,${Buffer.from(renderCompiled.outputText).toString('base64')}`)
  class Element {
    attributes = {}
    children = []
    textContent = ''
    constructor(tag) { this.tag = tag; this.ownerDocument = document }
    setAttribute(name, value) { this.attributes[name] = value }
    replaceChildren() { this.children = [] }
    append(child) { this.children.push(child) }
  }
  const document = { createElementNS(_namespace, tag) { return new Element(tag) } }
  const layer = new Element('svg')
  const height = renderImageAnnotations(layer, { naturalWidth: 1200, naturalHeight: 600 }, [
    stroke, { ...stroke, id: 'highlighter', kind: 'highlighter' }, text,
  ])
  assert.equal(height, 500)
  assert.equal(layer.attributes.viewBox, '0 0 1000 500')
  assert.equal(layer.children[0].attributes.points, '100,100 400,300')
  assert.equal(layer.children[1].attributes.opacity, '0.35')
  assert.equal(layer.children[2].children[1].textContent, '<script>literal text</script>')
  renderImageAnnotations(layer, { naturalWidth: 1200, naturalHeight: 600 }, [])
  assert.equal(layer.children.length, 0)
})
