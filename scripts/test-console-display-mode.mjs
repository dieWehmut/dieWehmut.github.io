import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/displayMode.ts')
if (!fs.existsSync(modulePath)) throw new Error('Missing module: src/console/displayMode.ts')

const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const mode = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const checks = [
  ['desktop first visit resolves console', mode.resolveStoredDisplayMode(null, null, true) === 'console'],
  ['mobile first visit keeps raw console default', mode.resolveStoredDisplayMode(null, null, false) === 'console'],
  ['mobile effective mode remains standard', mode.resolveActiveDisplayMode('console', false) === 'standard'],
  ['desktop standard preference is honored', mode.resolveActiveDisplayMode('standard', true) === 'standard'],
  ['new preference wins over legacy', mode.resolveStoredDisplayMode('standard', '1', true) === 'standard'],
  ['legacy console values migrate', mode.resolveStoredDisplayMode(null, '1', true) === 'console'],
  ['legacy classic values migrate', mode.resolveStoredDisplayMode(null, '0', true) === 'standard'],
  ['invalid values fall back safely', mode.resolveStoredDisplayMode('invalid', 'unknown', true) === 'console'],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1

