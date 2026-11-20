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
