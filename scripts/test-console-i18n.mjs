/**
 * The console names its text rather than holding it: the registry emits i18n keys
 * and the Vue layer resolves them. That split is only safe while every key a
 * component can build actually exists in every locale, so this suite walks the
 * whole `console` namespace from both ends — keys looking for messages, and
 * messages looking for keys.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const read = (relative) => {
  const target = path.join(root, relative)
  if (!fs.existsSync(target)) throw new Error(`Missing file: ${relative}`)
  return fs.readFileSync(target, 'utf8')
}

const LOCALES = ['en', 'zh', 'zh_tw', 'ja', 'de', 'la']
const messages = Object.fromEntries(LOCALES.map((id) => [id, JSON.parse(read(`src/locales/${id}.json`))]))

// The registry is import-free so it can be loaded straight from source, which is
// also the only way to be sure the keys under test are the ones it really emits.
const registrySource = read('src/console/commandRegistry.ts')
const { outputText } = ts.transpileModule(registrySource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: path.join(root, 'src/console/commandRegistry.ts'),
})
const registry = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

const panelView = read('src/components/console/ConsolePanelView.vue')
const shell = read('src/components/console/ConsoleShell.vue')
const overview = read('src/components/console/ConsoleOverviewHeader.vue')
const iconPreference = read('src/composables/useConsoleIconPreference.ts')

const checks = []
function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

/** Every leaf message under a subtree, as `dotted.path` → text pairs. */
function leaves(node, prefix = '') {
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, child]) => (
      leaves(child, prefix ? `${prefix}.${key}` : key)
    ))
  }
  return [[prefix, node]]
}

/** Resolve a key the way vue-i18n does, one dot at a time. */
function message(locale, key) {
  return key.split('.').reduce((node, step) => (node == null ? undefined : node[step]), messages[locale])
}

/** The interpolations a message carries, normalised so order cannot matter. */
function placeholders(text) {
  return [...String(text).matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort().join(',')
}

/** The body of a named array or object literal, so a regex can read one declaration. */
function literalBlock(source, declaration) {
  return source.match(new RegExp(`${declaration}[^[{]*[[{]([\\s\\S]*?)\\n(?:\\]|\\})`))?.[1] || ''
}

check('every locale carries a console namespace', LOCALES.every((id) => messages[id].console))

// ── Parity ────────────────────────────────────────────────────────────────────
// English is the reference only because it is the fallback locale; the check is
// symmetric, so a key added to any other file without English fails just as loudly.
const englishKeys = leaves(messages.en.console).map(([key]) => key).sort()
for (const id of LOCALES.filter((locale) => locale !== 'en')) {
  const localeKeys = leaves(messages[id].console).map(([key]) => key).sort()
  const missing = englishKeys.filter((key) => !localeKeys.includes(key))
  const extra = localeKeys.filter((key) => !englishKeys.includes(key))
  check(
    `${id} declares exactly the console keys English does`,
    !missing.length && !extra.length,
  )
  if (missing.length) console.log(`   :: ${id} missing ${missing.join(', ')}`)
  if (extra.length) console.log(`   :: ${id} has stray ${extra.join(', ')}`)
}

check(
  'no console message is blank',
  LOCALES.every((id) => leaves(messages[id].console).every(([, text]) => (
    typeof text === 'string' && text.trim().length > 0
  ))),
)

// A dropped `{value}` fails silently at runtime — the sentence simply loses its
// subject — so placeholders are compared rather than merely counted.
for (const id of LOCALES.filter((locale) => locale !== 'en')) {
  const mismatched = leaves(messages.en.console)
    .filter(([key, text]) => placeholders(text) !== placeholders(message(id, `console.${key}`)))
    .map(([key]) => key)
  check(`${id} keeps every interpolation English declares`, !mismatched.length)
  if (mismatched.length) console.log(`   :: ${id} differs on ${mismatched.join(', ')}`)
}

// ── Keys the registry emits ───────────────────────────────────────────────────
const commands = registry.listConsoleCommands()
const commandKeys = commands.map((item) => item.descriptionKey)
const groupKeys = registry.consoleCommandGroups.map((group) => group.titleKey)

check(
  'every command description resolves in every locale',
  LOCALES.every((id) => commandKeys.every((key) => typeof message(id, key) === 'string')),
)
check(
  'every group heading resolves in every locale',
  LOCALES.every((id) => groupKeys.every((key) => typeof message(id, key) === 'string')),
)

// Sub-commands spell their segments with `_` because vue-i18n reads a dot as a
// step down the message tree, and `/mode/classic` is one message, not two.
check(
  'sub-command keys stay flat instead of nesting under their parent',
  commandKeys.includes('console.command.mode_classic')
    && commandKeys.includes('console.command.mode_console')
    && typeof messages.en.console.command.mode === 'string',
)

// The other direction: a command deleted from the registry must not leave its
// wording behind, or the locale files slowly fill with text nothing can reach.
const declaredCommandKeys = Object.keys(messages.en.console.command).map((key) => `console.command.${key}`)
const orphanCommands = declaredCommandKeys.filter((key) => !commandKeys.includes(key))
check('no command message outlives the command it describes', !orphanCommands.length)
if (orphanCommands.length) console.log(`   :: orphaned ${orphanCommands.join(', ')}`)

const declaredGroupKeys = Object.keys(messages.en.console.group).map((key) => `console.group.${key}`)
check(
  'no group heading outlives its group',
  declaredGroupKeys.every((key) => groupKeys.includes(key)),
)

// ── Keys the components build ─────────────────────────────────────────────────
// These are assembled from an id at render time, so nothing static points at them
// and only a check like this can catch a name that was never written down.
// Only the right-hand side: the map's own keys are panel ids, some of them
// hyphenated, and it is the camelCase names they translate to that are looked up.
const panelKeys = [...literalBlock(panelView, 'const PANEL_KEYS').matchAll(/:\s*'(\w+)'/g)]
  .map(([, key]) => key)
check('the panel key map was found', panelKeys.length === 8)
check(
  'every panel resolves both a heading and a list label, in every locale',
  LOCALES.every((id) => panelKeys.every((key) => (
    typeof message(id, `console.panel.heading.${key}`) === 'string'
      && typeof message(id, `console.panel.list.${key}`) === 'string'
  ))),
)

const iconForms = [...literalBlock(iconPreference, 'export const consoleIconForms').matchAll(/'(\w+)'/g)]
  .map(([, form]) => form)
check('the icon form ring was found', iconForms.length === 4)
check(
  'every icon form the ring cycles has wording in every locale',
  LOCALES.every((id) => iconForms.every((form) => (
    typeof message(id, `console.option.icon.${form}`) === 'string'
  ))),
)

const colorIds = [...(registrySource.match(/color:\s*\{[^}]*new Set\(\[([^\]]*)\]/)?.[1] || '')
  .matchAll(/'(\w+)'/g)].map(([, id]) => id)
check('the color scheme ids were found', colorIds.length === 5)
check(
  'every color scheme /color accepts has a name in every locale',
  LOCALES.every((id) => colorIds.every((scheme) => (
    typeof message(id, `console.option.color.${scheme}`) === 'string'
  ))),
)

// ── Wording the console depends on ────────────────────────────────────────────
// `/search` is the one command that takes free text, and the row is where that is
// taught. The example has to survive translation: the literal is the lesson.
check(
  'every locale teaches the free-text search form by example',
  LOCALES.every((id) => String(message(id, 'console.command.search')).includes('/search vue')),
)

// Latin is written, not borrowed. Sharing a message with English would mean a key
// had been left to the fallback rather than translated.
const borrowedFromEnglish = leaves(messages.en.console)
  .filter(([key, text]) => message('la', `console.${key}`) === text)
  .map(([key]) => key)
check('Latin translates the console rather than echoing English', !borrowedFromEnglish.length)
if (borrowedFromEnglish.length) console.log(`   :: la still English on ${borrowedFromEnglish.join(', ')}`)

// ── No English left in the console's own markup ───────────────────────────────
check(
  'the shell reads its chrome out of the message tree',
  ["t('console.shell.label')", "t('console.shell.recentLabel')", "t('console.shell.recent')",
    "t('console.shell.commandLabel')", "t('console.shell.suggestionsLabel')", "t('console.shell.insert')",
    "t('console.shell.run')"].every((call) => shell.includes(call))
    && !/aria-label="(?:Nexus Console|Recent commands|Console command|Command suggestions|Run command)"/.test(shell)
    && !shell.includes('-- INSERT --'),
)
check(
  'the panel reads its headings and rows out of the message tree',
  ["t('console.panel.back')", "t('console.panel.empty')", 'console.panel.heading.',
    'console.panel.list.', 'console.option.theme.', 'console.option.color.',
    'console.option.background.', 'console.option.icon.', 'console.option.mode.']
    .every((call) => panelView.includes(call))
    && !/'Select (?:theme|colou?r scheme|icon form|language|display mode)'/.test(panelView),
)
check(
  'the portrait announces its form out of the message tree',
  overview.includes("t('console.overview.iconCycle'")
    && overview.includes("t('console.overview.iconForm'")
    && !overview.includes('Activate to cycle.`'),
)
// The key caption is deliberately literal: it names a key on the keyboard, and a
// keyboard does not relabel itself when the site changes language.
check('the submit caption stays the name of the key', />Enter<\/button>/.test(shell))
// A language names itself, so the picker stays legible to the reader hunting for
// their own tongue even while the console speaks one they cannot read.
check(
  'the language rows keep their endonyms',
  ['简体中文', '繁體中文', 'English', '日本語', 'Deutsch', 'Latina'].every((name) => panelView.includes(name)),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
