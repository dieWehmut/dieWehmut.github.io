import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const helperPath = path.join(root, 'src/utils/scrollProgress.ts')
const failures = []
const nearlyEqual = (actual, expected, epsilon = 1e-9) => (
  Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon
)

if (!fs.existsSync(helperPath)) {
  failures.push('scroll progress helper is missing')
} else {
  const source = fs.readFileSync(helperPath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: helperPath,
  })
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  const helper = await import(moduleUrl)

  if (helper.clampScrollRatio(-0.2) !== 0 || helper.clampScrollRatio(1.2) !== 1) {
    failures.push('scroll ratios clamp to the inclusive range')
  }
  if (helper.clampScrollRatio(Number.NaN) !== 0 || helper.clampScrollRatio(Number.POSITIVE_INFINITY) !== 0) {
    failures.push('non-finite scroll ratios map to zero')
  }
  if (helper.scrollRatioFromPointer(100, 100, 90) !== 0) {
    failures.push('pointer top maps to zero')
  }
  if (!nearlyEqual(helper.scrollRatioFromPointer(145, 100, 90), 0.5)) {
    failures.push('pointer middle maps to half')
  }
  if (helper.scrollRatioFromPointer(190, 100, 90) !== 1) {
    failures.push('pointer bottom maps to one')
  }
  if (helper.scrollRatioFromPointer(20, 100, 90) !== 0) {
    failures.push('pointer before track clamps to zero')
  }
  if (helper.scrollRatioFromPointer(250, 100, 90) !== 1) {
    failures.push('pointer after track clamps to one')
  }
  if (helper.scrollRatioFromPointer(150, 100, 0) !== 0) {
    failures.push('zero-height track maps to zero')
  }
  if (!nearlyEqual(helper.scrollRatioFromPointer(Number.NaN, 100, 90), 0)) {
    failures.push('non-finite pointer coordinate maps to zero')
  }
  if (helper.scrollTopForRatio(0.5, 2400) !== 1200) {
    failures.push('half progress maps to half scroll range')
  }
  if (helper.scrollTopForRatio(0.5, 0) !== 0) {
    failures.push('non-scrollable document maps to zero')
  }
  if (helper.scrollTopForRatio(2, 2400) !== 2400 || helper.scrollTopForRatio(-1, 2400) !== 0) {
    failures.push('scroll targets clamp their ratio')
  }
  if (helper.scrollTopForRatio(0.5, Number.NaN) !== 0) {
    failures.push('non-finite scroll range maps to zero')
  }
  if (helper.scrollRatioForKey('Home', 0.4) !== 0) {
    failures.push('Home maps to start')
  }
  if (helper.scrollRatioForKey('End', 0.4) !== 1) {
    failures.push('End maps to end')
  }
  if (!nearlyEqual(helper.scrollRatioForKey('ArrowDown', 0.4), 0.42)) {
    failures.push('ArrowDown advances two percent')
  }
  if (!nearlyEqual(helper.scrollRatioForKey('ArrowRight', 0.4), 0.42)) {
    failures.push('ArrowRight advances two percent')
  }
  if (helper.scrollRatioForKey('ArrowUp', 0.01) !== 0) {
    failures.push('ArrowUp clamps at start')
  }
  if (helper.scrollRatioForKey('ArrowLeft', 0.01) !== 0) {
    failures.push('ArrowLeft clamps at start')
  }
  if (!nearlyEqual(helper.scrollRatioForKey('PageDown', 0.4), 0.5)) {
    failures.push('PageDown advances ten percent')
  }
  if (helper.scrollRatioForKey('PageUp', 0.05) !== 0) {
    failures.push('PageUp clamps at start')
  }
  if (helper.scrollRatioForKey('ArrowDown', 0.99) !== 1 || helper.scrollRatioForKey('PageDown', 0.95) !== 1) {
    failures.push('forward keyboard steps clamp at end')
  }
  if (helper.scrollRatioForKey('Enter', 0.4) !== null) {
    failures.push('unhandled key returns null')
  }
}

if (failures.length) {
  failures.forEach((failure) => console.log(`FAIL ${failure}`))
  process.exitCode = 1
} else {
  console.log('PASS scroll progress pure helpers')
}
