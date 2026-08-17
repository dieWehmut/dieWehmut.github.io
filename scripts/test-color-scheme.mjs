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
const parser = await loadTypeScriptModule('src/console/commandParser.ts')
const registry = await loadTypeScriptModule('src/console/commandRegistry.ts')

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

const MODE_BACKGROUND = { light: '#ffffff', dark: '#000000' }
const TOKEN_KEYS = ['accent', 'secondary', 'tertiary']

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function relativeLuminance(hex) {
  const channels = hexToRgb(hex).map((channel) => {
    const ratio = channel / 255
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const [lighter, darker] = a >= b ? [a, b] : [b, a]
  return (lighter + 0.05) / (darker + 0.05)
}

function grayLevel(hex) {
  return hexToRgb(hex)[0]
}

check(
  'every scheme declares a tone',
  theme.siteColorSchemeIds.every((id) =>
    ['chromatic', 'monochrome'].includes(theme.siteColorSchemes[id].tone),
  ),
)
check(
  'exactly green, purple and pink are chromatic',
  JSON.stringify(
    theme.siteColorSchemeIds.filter((id) => theme.siteColorSchemes[id].tone === 'chromatic'),
  ) === JSON.stringify(['green', 'purple', 'pink']),
)
check(
  'exactly white and black are monochrome',
  JSON.stringify(
    theme.siteColorSchemeIds.filter((id) => theme.siteColorSchemes[id].tone === 'monochrome'),
  ) === JSON.stringify(['white', 'black']),
)
check(
  'every scheme exposes a non-empty label and a hex preview swatch',
  theme.siteColorSchemeIds.every((id) => {
    const option = theme.siteColorSchemes[id]
    return (
      typeof option.label === 'string' &&
      option.label.length > 0 &&
      /^#[0-9a-f]{6}$/.test(option.preview)
    )
  }),
)
check(
  'monochrome previews stay grayscale with white brighter than black',
  ['white', 'black'].every((id) => {
    const [r, g, b] = hexToRgb(theme.siteColorSchemes[id].preview)
    return r === g && g === b
  }) &&
    grayLevel(theme.siteColorSchemes.white.preview) >
      grayLevel(theme.siteColorSchemes.black.preview),
)
check(
  'every scheme carries a full token set for both modes',
  theme.siteColorSchemeIds.every((id) =>
    ['light', 'dark'].every((mode) => {
      const tokens = theme.siteColorSchemes[id][mode]
      return (
        TOKEN_KEYS.every((key) => /^#[0-9a-f]{6}$/.test(tokens?.[key] || '')) &&
        TOKEN_KEYS.every((key) => /^\d{1,3} \d{1,3} \d{1,3}$/.test(tokens?.[`${key}Rgb`] || '')) &&
        typeof tokens?.tagColor === 'string' &&
        tokens.tagColor.length > 0
      )
    }),
  ),
)
check(
  'every rgb triplet matches its hex token',
  theme.siteColorSchemeIds.every((id) =>
    ['light', 'dark'].every((mode) =>
      TOKEN_KEYS.every((key) => {
        const tokens = theme.siteColorSchemes[id][mode]
        return tokens[`${key}Rgb`] === hexToRgb(tokens[key]).join(' ')
      }),
    ),
  ),
)
check(
  'monochrome tokens are pure grayscale',
  ['white', 'black'].every((id) =>
    ['light', 'dark'].every((mode) =>
      TOKEN_KEYS.every((key) => {
        const [r, g, b] = hexToRgb(theme.siteColorSchemes[id][mode][key])
        return r === g && g === b
      }),
    ),
  ),
)
check(
  'white stays brighter than black at every step in both modes',
  ['light', 'dark'].every((mode) =>
    TOKEN_KEYS.every(
      (key) =>
        grayLevel(theme.siteColorSchemes.white[mode][key]) >
        grayLevel(theme.siteColorSchemes.black[mode][key]),
    ),
  ),
)
check(
  'white and black keep their accents at least 100 gray levels apart',
  ['light', 'dark'].every(
    (mode) =>
      grayLevel(theme.siteColorSchemes.white[mode].accent) -
        grayLevel(theme.siteColorSchemes.black[mode].accent) >=
      100,
  ),
)
check(
  'monochrome accents clear 4.5:1 against their own background',
  ['white', 'black'].every((id) =>
    ['light', 'dark'].every(
      (mode) =>
        contrastRatio(theme.siteColorSchemes[id][mode].accent, MODE_BACKGROUND[mode]) >= 4.5,
    ),
  ),
)
check(
  'monochrome supporting tokens clear 2.5:1 against their own background',
  ['white', 'black'].every((id) =>
    ['light', 'dark'].every((mode) =>
      ['secondary', 'tertiary'].every(
        (key) => contrastRatio(theme.siteColorSchemes[id][mode][key], MODE_BACKGROUND[mode]) >= 2.5,
      ),
    ),
  ),
)
check(
  'monochrome contrast decreases from accent to tertiary',
  ['white', 'black'].every((id) =>
    ['light', 'dark'].every((mode) => {
      const tokens = theme.siteColorSchemes[id][mode]
      const ratios = TOKEN_KEYS.map((key) => contrastRatio(tokens[key], MODE_BACKGROUND[mode]))
      return ratios[0] > ratios[1] && ratios[1] > ratios[2]
    }),
  ),
)

check(
  'the random pool is exactly the chromatic schemes',
  JSON.stringify(theme.siteRandomColorSchemeOptions.map((option) => option.id)) ===
    JSON.stringify(['green', 'purple', 'pink']),
)
check(
  'the random pool never offers a monochrome scheme',
  theme.siteRandomColorSchemeOptions.every((option) => option.tone === 'chromatic'),
)
check(
  'the random pool is a strict subset of all options',
  theme.siteRandomColorSchemeOptions.length < theme.siteColorSchemeOptions.length,
)

// 命令层的方案白名单是手写字面量，无法从 theme.ts import（见 commandParser.ts 的注释）。
// 下面五条从行为侧看住漂移：新增方案却忘了扩集合，这里就会红。
function colorCommand(value) {
  return {
    kind: 'command',
    rawInput: `/color/${value}`,
    segments: ['color', value],
    canonicalInput: `/color/${value}`,
    query: '',
    hash: '',
  }
}

check(
  'the parser normalizes every registered scheme to lower case',
  theme.siteColorSchemeIds.every(
    (id) => parser.parseConsoleInput(`/COLOR/${id.toUpperCase()}`).canonicalInput === `/color/${id}`,
  ),
)
check(
  'the parser leaves unknown scheme values untouched',
  parser.parseConsoleInput('/COLOR/BLUE').canonicalInput === '/color/BLUE',
)
check(
  'the registry opens the color panel for every registered scheme',
  theme.siteColorSchemeIds.every((id) => {
    const resolution = registry.resolveConsoleCommand(colorCommand(id))
    return resolution.kind === 'panel' && resolution.panel === 'color' && resolution.value === id
  }),
)
check(
  'the registry silences unknown scheme values',
  registry.resolveConsoleCommand(colorCommand('blue')).kind === 'silent',
)
check(
  'the color help entry does not enumerate scheme names',
  registry
    .listConsoleCommands()
    .some((entry) => entry.input === '/color' && !/green|purple|pink|white|black/i.test(entry.description)),
)

// applySiteColorScheme 还负责重编三个原生爱心光标的 data URL（CSS 没法把变量插进
// url()），所以这里用一个假的 documentElement 记录它到底写了什么。
function captureAppliedProperties(scheme, mode) {
  const written = new Map()
  const root = {
    setAttribute() {},
    style: {
      setProperty(name, value) {
        written.set(name, value)
      },
    },
  }
  globalThis.document = { documentElement: root }
  try {
    theme.applySiteColorScheme(scheme, mode)
  } finally {
    delete globalThis.document
  }
  return written
}

const CURSOR_KEYS = ['--cursor-heart', '--cursor-pointer', '--cursor-sakura-hover']

// 断言一律走这个读取器：漏写一个变量时才会得到干净的 FAIL，而不是 TypeError
// 把整条 test:console 链后面的输出一起带走。
function cursorValue(written, key) {
  const value = written.get(key)
  return typeof value === 'string' ? value : ''
}

check(
  'applying a scheme writes all three native heart cursors',
  theme.siteColorSchemeIds.every((id) =>
    ['light', 'dark'].every((mode) => {
      const written = captureAppliedProperties(id, mode)
      return CURSOR_KEYS.every((key) =>
        cursorValue(written, key).startsWith('url("data:image/svg+xml,'),
      )
    }),
  ),
)
check(
  'every native heart cursor carries the active accent',
  theme.siteColorSchemeIds.every((id) =>
    ['light', 'dark'].every((mode) => {
      const written = captureAppliedProperties(id, mode)
      const encodedAccent = encodeURIComponent(theme.siteColorSchemes[id][mode].accent)
      return CURSOR_KEYS.every((key) => cursorValue(written, key).includes(encodedAccent))
    }),
  ),
)
check(
  // pink 方案的 accent 本来就是 #ff69b4，所以只能对单色方案断言「没有粉」——
  // 那才是 SCSS 里写死的默认值漏出来的信号。
  'monochrome schemes never leak the hardcoded pink fill',
  ['white', 'black'].every((id) =>
    ['light', 'dark'].every((mode) => {
      const written = captureAppliedProperties(id, mode)
      return CURSOR_KEYS.every((key) => !/ff69b4/i.test(cursorValue(written, key)))
    }),
  ),
)
check(
  'native heart cursors keep the (12, 21) hotspot and a keyword fallback',
  (() => {
    const written = captureAppliedProperties('purple', 'dark')
    return (
      cursorValue(written, '--cursor-heart').endsWith(' 12 21, auto') &&
      cursorValue(written, '--cursor-pointer').endsWith(' 12 21, pointer') &&
      cursorValue(written, '--cursor-sakura-hover').endsWith(' 12 21, auto')
    )
  })(),
)
check(
  'native heart cursor data URLs are fully percent-encoded',
  CURSOR_KEYS.every((key) => {
    const value = cursorValue(captureAppliedProperties('white', 'light'), key)
    const inner = value.slice(value.indexOf('data:'), value.indexOf('") '))
    return !/["#<>]/.test(inner) && decodeURIComponent(inner).includes('<svg')
  }),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
