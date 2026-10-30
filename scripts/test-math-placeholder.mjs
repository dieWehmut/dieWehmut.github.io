import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * Guards the block-math placeholder tag.
 *
 * The renderer replaces a `$$…$$` block with a placeholder element and swaps in
 * the real markup afterwards, so the placeholder's tag decides how the Markdown
 * around it is parsed. A `<div>` placeholder opens an HTML block that only ends
 * at a blank line, so the line directly after a display block was copied through
 * raw — inline `$…$` there printed its delimiters instead of rendering.
 *
 * `<pre>` ends at its own closing tag, which hands the next line back to the
 * inline parser. The structural assertions matter just as much: inserting a
 * blank line after the block also fixes the math, but it turns list items loose
 * and splits one list into two, and that is the regression this test pins down.
 *
 * Rendering happens in a child process because `markdown.ts` imports browser
 * modules (workers, CSS) that node cannot load directly.
 */

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const markdown = read('src/utils/markdown.ts')
const packageJson = JSON.parse(read('package.json'))

const checks = []
const check = (label, ok) => checks.push([label, Boolean(ok)])

// ---- source-level assertions -------------------------------------------------

check(
  'block-math placeholder is not a div element',
  !/displayMode && !options\.displayAsInline \? 'div' : 'span'/.test(markdown),
)
check(
  'block-math placeholder uses a pre element',
  /displayMode && !options\.displayAsInline \? 'pre' : 'span'/.test(markdown),
)
check(
  'placeholder keeps the data-md-math-placeholder marker the rewrite step looks for',
  /data-md-math-placeholder/.test(markdown),
)
// Standalone display math already owns its lines; padding it with blank lines is
// exactly what loosens the enclosing list.
check(
  'standalone block math is not padded with extra blank lines',
  /return tag === 'pre' && !standalone \? `\\n\\n\$\{placeholder\}\\n\\n` : placeholder/.test(markdown),
)
check(
  'this regression test is exposed through package scripts',
  packageJson.scripts?.['test:math-placeholder'] === 'node scripts/test-math-placeholder.mjs',
)

// ---- behavioural assertions through the real renderer -----------------------

/**
 * Each fixture states what the reader must see: the number of lists the source
 * produces, whether items stay tight, and whether any `$` survives as text.
 */
const FIXTURES = {
  'display then inline': {
    source: '- 数列极限：\n  $$\n  a=b\n  $$\n  记作 $x=y$。\n- 下一条\n',
    lists: 1,
    loose: false,
  },
  'top-level display then inline': {
    source: '$$\na=b\n$$\n记作 $x=y$。\n',
    lists: 0,
    loose: false,
  },
  'display then table': {
    source: '$$\na=b\n$$\n| a | b |\n| - | - |\n| 1 | 2 |\n',
    lists: 0,
    loose: false,
  },
  'plain tight list': {
    source: '- 第一条\n- 第二条\n',
    lists: 1,
    loose: false,
  },
}

const rendererScript = path.join(root, 'scripts', 'render-math-fixtures.mjs')
let report = null
if (!fs.existsSync(rendererScript)) {
  check('fixture renderer exists', false)
} else {
  const result = spawnSync(process.execPath, [rendererScript], { encoding: 'utf8' })
  if (result.status !== 0) {
    check('fixture renderer runs', false)
    if (result.stderr) console.error(result.stderr.slice(0, 800))
  } else {
    check('fixture renderer runs', true)
    try {
      report = JSON.parse(result.stdout)
    } catch {
      check('fixture renderer emits JSON', false)
    }
  }
}

if (report) {
  check('fixture renderer emits JSON', true)
  for (const [name, expected] of Object.entries(FIXTURES)) {
    const actual = report[name]
    if (!actual) {
      check(`renders "${name}"`, false)
      continue
    }
    check(
      `"${name}": inline math renders instead of showing raw delimiters`,
      actual.literalDollar === 0,
    )
    check(
      `"${name}": structure unchanged (${expected.lists} list(s), loose=${expected.loose})`,
      actual.lists === expected.lists && actual.loose === expected.loose,
    )
  }
}

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
