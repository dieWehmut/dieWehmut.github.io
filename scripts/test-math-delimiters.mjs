import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const markdown = read('src/utils/markdown.ts')
const packageJson = JSON.parse(read('package.json'))
const helperPath = path.join(root, 'src/utils/mathDelimiters.mjs')

let boundaries = null
try {
  boundaries = await import(pathToFileURL(helperPath).href)
} catch {
  // The behavioral checks below report the missing implementation as failures.
}

const { isDisplayMathOpeningBoundary, isDisplayMathClosingBoundary } = boundaries || {}

/**
 * Mirror of `protectMathText` for the `$$` case, used to prove the shared
 * boundary helpers keep display math aligned with its delimiters.
 */
function scanDisplayMath(source) {
  const blocks = []
  const isEscapedAt = (text, index) => {
    let backslashes = 0
    for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) backslashes += 1
    return backslashes % 2 === 1
  }
  const nextDelimiter = (text, from) => {
    let cursor = text.indexOf('$$', from)
    while (cursor !== -1) {
      if (!isEscapedAt(text, cursor)) return cursor
      cursor = text.indexOf('$$', cursor + 2)
    }
    return -1
  }

  let cursor = 0
  while (cursor < source.length) {
    if (source[cursor] === '`') {
      const marker = source.slice(cursor).match(/^`+/)?.[0] || '`'
      const end = source.indexOf(marker, cursor + marker.length)
      if (end === -1) break
      cursor = end + marker.length
      continue
    }
    if (!source.startsWith('$$', cursor) || isEscapedAt(source, cursor)
      || !isDisplayMathOpeningBoundary(source, cursor)) {
      cursor += 1
      continue
    }
    let end = nextDelimiter(source, cursor + 2)
    while (end !== -1 && !isDisplayMathClosingBoundary(source, end)) {
      end = nextDelimiter(source, end + 2)
    }
    if (end === -1) {
      cursor += 2
      continue
    }
    const formula = source.slice(cursor + 2, end)
    if (formula.trim()) blocks.push(formula)
    cursor = end + 2
  }
  return blocks
}

const computingMethod = read('src/data/docs/notes/ComputingMethod.md')
const blocks = scanDisplayMath(computingMethod)
// Display math legitimately includes prose-derived text (e.g. `\\text{其中}`)
// and CJK glyphs, so contamination is detected by block size instead: prose
// swallowed by a mis-paired delimiter always dwarfs a real formula.
const longest = blocks.reduce((max, block) => Math.max(max, block.length), 0)
const oversized = blocks.filter((block) => block.length > 600)

const inlineCase = '函数 $f(x)$ 连续，且\n\n$$\n\\lim_{x\\to x_0} f(x) = f(x_0)\n$$\n\n成立。'
const strayCase = '所以 $g(x) \\equiv 0$ 在 $(a, b)$ 内成立 $$\n\n下一段文字。\n\n$$\n\\int_a^b f = 1\n$$\n'
const quotedCase = '> **定理**：\n>\n> $$\n> \\mathbf{A}\\mathbf{x} = \\mathbf{b}\n> $$\n'

const checks = [
  [
    'display math boundaries are exposed as shared helpers',
    typeof isDisplayMathOpeningBoundary === 'function'
      && typeof isDisplayMathClosingBoundary === 'function',
  ],
  [
    'an opening delimiter must start its line',
    isDisplayMathOpeningBoundary?.(strayCase, strayCase.indexOf('$$')) === false
      && isDisplayMathOpeningBoundary?.(inlineCase, inlineCase.indexOf('$$')) === true,
  ],
  [
    'a closing delimiter must end its line',
    isDisplayMathClosingBoundary?.(inlineCase, inlineCase.indexOf('$$', inlineCase.indexOf('$$') + 2)) === true,
  ],
  [
    'genuine display math survives between paragraphs',
    scanDisplayMath(inlineCase).length === 1
      && scanDisplayMath(inlineCase)[0].includes('\\lim_{x\\to x_0}'),
  ],
  [
    'a stray $$ inside prose does not swallow later paragraphs',
    scanDisplayMath(strayCase).length === 1
      && !scanDisplayMath(strayCase)[0].includes('下一段文字'),
  ],
  [
    'blockquoted display math still parses',
    scanDisplayMath(quotedCase).length === 1
      && scanDisplayMath(quotedCase)[0].includes('\\mathbf{A}\\mathbf{x}'),
  ],
  [
    'the article no longer produces prose-contaminated math blocks',
    blocks.length > 0 && oversized.length === 0,
  ],
  [
    'no single math block swallows an entire section',
    longest > 0 && longest < 600,
  ],
  [
    'the renderer applies the opening boundary before pairing',
    /isDisplayMathOpeningBoundary\(source, cursor\)/.test(markdown),
  ],
  [
    'the renderer applies the closing boundary before pairing',
    /isDisplayMathClosingBoundary\(source, cursor\)/.test(markdown),
  ],
  [
    'the delimiter helper is covered by a package script',
    packageJson.scripts?.['test:math-delimiters'] === 'node scripts/test-math-delimiters.mjs',
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
console.log(`\nComputingMethod display blocks: ${blocks.length}, longest ${longest}, oversized ${oversized.length}`)
if (failures.length) process.exitCode = 1
