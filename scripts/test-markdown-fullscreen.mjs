import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const markdown = fs.readFileSync(path.join(root, 'src', 'utils', 'markdown.ts'), 'utf8')
const styles = fs.readFileSync(path.join(root, 'src', 'styles', 'markdown', 'index.scss'), 'utf8')

const checks = [
  [
    'fullscreen toggles a document-level state class',
    /markdown-editor-fullscreen-active/.test(markdown)
      && /classList\.add\(['"]markdown-editor-fullscreen-active['"]\)/.test(markdown)
      && /classList\.remove\(['"]markdown-editor-fullscreen-active['"]\)/.test(markdown),
  ],
  [
    'fullscreen cleanup restores global state',
    /releaseFullscreen[\s\S]*?classList\.remove\(['"]markdown-editor-fullscreen-active['"]\)/.test(markdown)
      && /body\.style\.overflow\s*=\s*bodyOverflowBeforeFullscreen/.test(markdown),
  ],
  [
    'fullscreen covers the viewport with a stable stacking context',
    /\.md-editable-block\.is-fullscreen\s*\{[\s\S]*?position:\s*fixed[\s\S]*?inset:\s*0[\s\S]*?width:\s*100vw[\s\S]*?height:\s*100dvh[\s\S]*?z-index:\s*1100/.test(styles),
  ],
  [
    'fullscreen escapes progressive chunk containment',
    /markdown-editor-fullscreen-active[^{}]*\.markdown-content__chunk\s*\{[\s\S]*?content-visibility:\s*visible/.test(styles),
  ],
  [
    'fullscreen hides global navigation and floating controls',
    /markdown-editor-fullscreen-active[^{}]*\.route-breadcrumb/.test(styles)
      && /markdown-editor-fullscreen-active[^{}]*\.float-controls/.test(styles)
      && /markdown-editor-fullscreen-active[^{}]*\.page-scroll-progress/.test(styles),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
