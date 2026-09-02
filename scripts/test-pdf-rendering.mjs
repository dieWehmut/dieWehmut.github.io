import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const pdf = read('src/utils/exportPdf.ts')
const fallback = read('src/utils/pdfMainFallback.ts')
const worker = read('src/workers/articlePdf.worker.ts')
const packageJson = JSON.parse(read('package.json'))
const cognitiveScience = read('src/data/docs/notes/CognitiveScience.md')

const checks = [
  [
    'PDF display math uses a complete TeX-to-SVG renderer',
    Boolean(packageJson.dependencies?.['mathjax-full'])
      && /function\s+(?:render|convert|tex).*Svg/i.test(worker)
      && /mathjax\.document/.test(worker),
  ],
  [
    'display math is emitted to pdfmake as SVG instead of raw TeX',
    /nexusMath/.test(pdf)
      && /renderMathSvg\(marker\.formula,\s*display\)/.test(worker)
      && /display\s*\?\s*\{[\s\S]*?text:\s*marker\.formula/.test(worker),
  ],
  [
    'inline KaTeX formulas are converted to SVG when possible',
    /classList\.contains\(['"]katex['"]\)[\s\S]*?svg:\s*null/.test(pdf)
      && /display:\s*false/.test(pdf)
      && /inlineMathFit\(svg\)/.test(worker),
  ],
  [
    'inline formula SVG is emitted as standalone stack content',
    /function\s+inlineNodesToContent/.test(pdf)
      && /kind:\s*['"]math['"]/.test(pdf)
      && /stack:\s*segments/.test(pdf)
      && !/return\s+svg\s*\?\s*\{\s*svg,\s*fit:\s*\[72,\s*18\]/.test(pdf),
  ],
  [
    'Mermaid figures are emitted to pdfmake as rendered SVG',
    /classes\.contains\(['"]md-mermaid['"]\)/.test(pdf)
      && /querySelector(?:<[^>]+>)?\(['"]svg['"]\)/.test(pdf)
      && /svg\s*:/.test(pdf),
  ],
  [
    'PDF generation hydrates Mermaid before converting the DOM',
    /ensureMermaidRendered/.test(pdf)
      && /await\s+ensureMermaidRendered\(source\.element\)/.test(pdf),
  ],
  [
    'diagram and math conversion retain readable fallbacks',
    /text:\s*marker\.formula/.test(worker)
      && /diagramFallback/.test(pdf),
  ],
  [
    'the Cognitive Science fixture exercises PDF math and diagrams',
    /```mermaid\s*\r?\n(?:graph|flowchart)\s+(?:LR|TD)/.test(cognitiveScience)
      && /\$\$[\s\S]+?\$\$/.test(cognitiveScience),
  ],
  [
    'the existing download output remains available',
    /const\s+pdf\s*=\s*pdfMake\.createPdf\(fallbackDefinition\)/.test(fallback)
      && /anchor\.download/.test(pdf)
      && /pdf\.download\(/.test(fallback),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
