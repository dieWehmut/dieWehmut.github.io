import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Renders a fixed set of math fixtures with the project's real renderer and
 * prints the structural facts as JSON, for `test-math-placeholder.mjs`.
 *
 * `src/utils/markdown.ts` imports browser-only modules (workers and CSS), so it
 * cannot be imported directly by node. Bundling it first with esbuild — the same
 * bundler Vite uses — keeps the test honest: it runs the shipped parser, not a
 * reimplementation of it.
 *
 * Usage: node scripts/render-math-fixtures.mjs
 */

const root = path.resolve(import.meta.dirname, '..')
const pnpmDir = path.join(root, 'node_modules', '.pnpm')

const FIXTURES = {
  'display then inline': '- 数列极限：\n  $$\n  a=b\n  $$\n  记作 $x=y$。\n- 下一条\n',
  'top-level display then inline': '$$\na=b\n$$\n记作 $x=y$。\n',
  'display then table': '$$\na=b\n$$\n| a | b |\n| - | - |\n| 1 | 2 |\n',
  'plain tight list': '- 第一条\n- 第二条\n',
}

function findEsbuild() {
  const entry = fs.readdirSync(pnpmDir)
    .filter((name) => /^esbuild@/.test(name))
    .sort()
    .pop()
  if (!entry) return null
  const candidate = path.join(pnpmDir, entry, 'node_modules', 'esbuild', 'lib', 'main.js')
  return fs.existsSync(candidate) ? candidate : null
}

const esbuildPath = findEsbuild()
if (!esbuildPath) {
  console.error('esbuild is not installed; run pnpm install first')
  process.exit(2)
}

const { build } = await import(pathToFileURL(esbuildPath).href)

const outfile = path.join(root, 'node_modules', `.math-fixtures-${process.pid}.cjs`)
try {
  await build({
    entryPoints: [path.join(root, 'src', 'utils', 'markdown.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    // Styles and fonts are irrelevant to structure; stub them so bundling does
    // not need Vite's asset pipeline.
    loader: { '.ttf': 'empty', '.woff': 'empty', '.woff2': 'empty', '.css': 'empty', '.svg': 'empty' },
    external: ['vue', 'katex', 'marked', 'marked-katex-extension', 'mermaid', 'dompurify', 'highlight.js'],
    plugins: [{
      name: 'stub-browser-only',
      setup(build) {
        // Monaco's worker imports are browser-only and unrelated to rendering.
        build.onResolve({ filter: /\?worker$/ }, (args) => ({ path: args.path, namespace: 'worker-stub' }))
        build.onLoad({ filter: /.*/, namespace: 'worker-stub' }, () => ({
          contents: 'module.exports = function WorkerStub() {}',
          loader: 'js',
        }))
        build.onResolve({ filter: /monacoMarkdownEditor/ }, (args) => ({ path: args.path, namespace: 'editor-stub' }))
        build.onLoad({ filter: /.*/, namespace: 'editor-stub' }, () => ({
          contents: 'module.exports = {}',
          loader: 'js',
        }))
      },
    }],
    logLevel: 'silent',
  })

  const { renderMarkdown } = await import(pathToFileURL(outfile).href)

  const report = {}
  for (const [name, source] of Object.entries(FIXTURES)) {
    const html = renderMarkdown(source)
    report[name] = {
      // A surviving `$` means an inline formula was emitted as literal text.
      literalDollar: (html.match(/\$/g) || []).length,
      lists: (html.match(/<ul>/g) || []).length,
      // Marked wraps item content in `<p>` only when the list is loose, which is
      // what inserting a blank line around block math used to cause.
      loose: /<li>\s*<p>/.test(html),
      katex: (html.match(/class="katex"/g) || []).length,
      displayBlocks: (html.match(/md-math-block/g) || []).length,
    }
  }

  process.stdout.write(JSON.stringify(report))
} finally {
  fs.rmSync(outfile, { force: true })
}
