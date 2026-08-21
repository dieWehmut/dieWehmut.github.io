import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const helperPath = path.join(root, 'src/utils/scrollProgress.ts')
const sidebarPath = path.join(root, 'src/components/system/ScrollSpySidebar.vue')
const mobileLayoutPath = path.join(root, 'src/layouts/MobileDrawerLayout.vue')
const failures = []
const nearlyEqual = (actual, expected, epsilon = 1e-9) => (
  Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon
)
const check = (message, condition) => {
  if (!condition) failures.push(message)
}

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

const sidebar = fs.readFileSync(sidebarPath, 'utf8')
const mobileLayout = fs.readFileSync(mobileLayoutPath, 'utf8')

check('rail exposes vertical slider semantics',
  /ref="progressBarRef"/.test(sidebar) &&
  /role="slider"/.test(sidebar) &&
  /aria-label="Page reading progress"/.test(sidebar) &&
  /aria-orientation="vertical"/.test(sidebar) &&
  /aria-valuemin="0"/.test(sidebar) &&
  /aria-valuemax="100"/.test(sidebar) &&
  /:aria-valuenow="progress"/.test(sidebar) &&
  /tabindex="0"/.test(sidebar))
check('rail handles pointer drag with capture',
  /@pointerdown="onProgressPointerDown"/.test(sidebar) &&
  /@pointermove="onProgressPointerMove"/.test(sidebar) &&
  /@pointerup="onProgressPointerEnd"/.test(sidebar) &&
  /@pointercancel="onProgressPointerEnd"/.test(sidebar) &&
  /event\.button !== 0/.test(sidebar) &&
  /activeProgressPointerId = event\.pointerId/.test(sidebar) &&
  /setPointerCapture/.test(sidebar) &&
  /releasePointerCapture/.test(sidebar) &&
  /activeProgressPointerId = null/.test(sidebar))
check('rail handles keyboard progress',
  /@keydown="onProgressKeydown"/.test(sidebar) &&
  /scrollRatioForKey\(event\.key, progress\.value \/ 100\)/.test(sidebar))
check('rail uses shared progress calculations',
  /from ['"]\.\.\/\.\.\/utils\/scrollProgress['"]/.test(sidebar) &&
  /scrollRatioFromPointer/.test(sidebar) &&
  /scrollTopForRatio/.test(sidebar) &&
  /scrollRatioForKey/.test(sidebar))
check('progress fill grows from the top',
  /\.scroll-spy__bar span\s*\{[^}]*top:\s*0/.test(sidebar) &&
  !/\.scroll-spy__bar span\s*\{[^}]*bottom:\s*0/.test(sidebar))
check('progress rail widens its hit target without widening layout',
  /\.scroll-spy__bar\s*\{[\s\S]*padding-inline:\s*7px/.test(sidebar) &&
  /\.scroll-spy__bar\s*\{[\s\S]*margin-inline:\s*-7px/.test(sidebar) &&
  /\.scroll-spy__bar\s*\{[\s\S]*box-sizing:\s*content-box/.test(sidebar) &&
  /\.scroll-spy__bar\s*\{[\s\S]*touch-action:\s*none/.test(sidebar))
check('desktop sidebar native scrollbar is hidden',
  /\.scroll-spy\s*\{[\s\S]*overflow-y:\s*auto/.test(sidebar) &&
  /\.scroll-spy\s*\{[\s\S]*scrollbar-width:\s*none/.test(sidebar) &&
  /\.scroll-spy\s*\{[\s\S]*-ms-overflow-style:\s*none/.test(sidebar) &&
  /\.scroll-spy::-webkit-scrollbar/.test(sidebar))
check('mobile drawer native scrollbar is hidden',
  /\.mobile-layout__toc-drawer\s*\{[\s\S]*overflow-y:\s*auto/.test(mobileLayout) &&
  /\.mobile-layout__toc-drawer\s*\{[\s\S]*scrollbar-width:\s*none/.test(mobileLayout) &&
  /\.mobile-layout__toc-drawer\s*\{[\s\S]*-ms-overflow-style:\s*none/.test(mobileLayout) &&
  /\.mobile-layout__toc-drawer::-webkit-scrollbar/.test(mobileLayout))
check('progress input releases pinned heading',
  /function scrollPageToRatio[\s\S]*releasePinnedHeading\(\)/.test(sidebar))
check('progress input bypasses global smooth scrolling',
  /function scrollPageToRatio[\s\S]*behavior:\s*['"]instant['"]/.test(sidebar))
check('console progress bar remains hidden',
  /\.scroll-spy--console \.scroll-spy__bar\s*\{[\s\S]*display:\s*none/.test(sidebar))

if (failures.length) {
  failures.forEach((failure) => console.log(`FAIL ${failure}`))
  process.exitCode = 1
} else {
  console.log('PASS scroll progress pure helpers')
}
