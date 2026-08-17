import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')

async function loadTypeScriptModule(relativePath) {
  const filePath = path.join(root, relativePath)
  if (!fs.existsSync(filePath)) throw new Error(`Missing module: ${relativePath}`)
  const source = fs.readFileSync(filePath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: filePath,
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const theme = await loadTypeScriptModule('src/data/site/theme.ts')

const checks = []
function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

const EXPECTED_IDS = ['green', 'purple', 'pink', 'white', 'black']

check(
  'every color scheme id is registered',
  EXPECTED_IDS.every((id) => Boolean(theme.siteColorSchemes?.[id])),
)
check(
  'no unexpected color scheme is registered',
  Object.keys(theme.siteColorSchemes || {}).length === EXPECTED_IDS.length,
)
check(
  'siteColorSchemeIds mirrors the registry keys',
  JSON.stringify(theme.siteColorSchemeIds) === JSON.stringify(Object.keys(theme.siteColorSchemes || {})),
)
check(
  'isSiteColorScheme accepts every registered id',
  EXPECTED_IDS.every((id) => theme.isSiteColorScheme(id) === true),
)
check(
  'isSiteColorScheme rejects unknown values',
  ['blue', '', 'Purple', null, undefined, 0, {}].every((value) => theme.isSiteColorScheme(value) === false),
)
check(
  'isSiteColorScheme rejects inherited object keys',
  ['toString', 'constructor', 'hasOwnProperty'].every((key) => theme.isSiteColorScheme(key) === false),
)
check(
  'resolveSiteColorScheme falls back to the default for unknown values',
  theme.resolveSiteColorScheme('blue') === theme.DEFAULT_SITE_COLOR_SCHEME,
)
check(
  'resolveSiteColorScheme keeps registered ids untouched',
  EXPECTED_IDS.every((id) => theme.resolveSiteColorScheme(id) === id),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'ok' : 'FAIL'} - ${label}`)
if (failures.length) {
  console.error(`\n${failures.length} color scheme check(s) failed.`)
  process.exit(1)
}
console.log(`\nAll ${checks.length} color scheme checks passed.`)
