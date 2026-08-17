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
  EXPECTED_IDS.every((id) => Boolean(theme.siteColorSchemes[id])),
)
check(
  'no unexpected color scheme is registered',
  Object.keys(theme.siteColorSchemes).length === EXPECTED_IDS.length,
)
check(
  'every registered option carries its own key as id',
  Object.entries(theme.siteColorSchemes).every(([key, option]) => option.id === key),
)
check(
  'siteColorSchemeIds mirrors the registry keys',
  JSON.stringify(theme.siteColorSchemeIds) === JSON.stringify(EXPECTED_IDS),
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
  'the default color scheme is itself registered',
  theme.isSiteColorScheme(theme.DEFAULT_SITE_COLOR_SCHEME) === true,
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
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
