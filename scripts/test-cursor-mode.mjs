import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const cursor = fs.readFileSync(path.join(root, 'src', 'components', 'system', 'BounceCursor.vue'), 'utf8')
const defaults = fs.readFileSync(path.join(root, 'src', 'styles', 'cursor', 'default', 'index.scss'), 'utf8')
const pointer = fs.readFileSync(path.join(root, 'src', 'styles', 'cursor', 'pointer', 'index.scss'), 'utf8')
const sakura = fs.readFileSync(path.join(root, 'src', 'styles', 'animation', 'sakura', 'index.scss'), 'utf8')
const input = fs.readFileSync(path.join(root, 'src', 'styles', 'cursor', 'input', 'index.scss'), 'utf8')
const theme = fs.readFileSync(path.join(root, 'src', 'data', 'site', 'theme.ts'), 'utf8')
const exportButton = fs.readFileSync(path.join(root, 'src', 'components', 'content', 'ArticleExportButton.vue'), 'utf8')

const checks = [
  [
    'pointer effects require the dynamic background preference',
    /pointerEffectsEnabled\s*=\s*computed\([\s\S]*?dynamicBackgroundEnabled\.value/.test(cursor),
  ],
  [
    'turning the preference off unbinds events and clears the custom cursor',
    /syncPointerEffects[\s\S]*?unbindEvents\(\)[\s\S]*?stopRing\(\)/.test(cursor)
      && /heart-bounce-active/.test(cursor),
  ],
  [
    'static mode uses the platform cursor',
    /--cursor-default:\s*(?:auto|default)\s*;/.test(defaults)
      && /cursor:\s*var\(--cursor-default\)/.test(defaults)
      && /--cursor-pointer:\s*pointer\s*;/.test(pointer)
      && !/setProperty\(['"]--cursor-pointer['"]/.test(theme),
  ],
  [
    'dynamic mode alone maps default and pointer cursors to heart assets',
    /html\.dynamic-background-enabled[^{]*\{[\s\S]*?--cursor-default:\s*var\(--cursor-heart\)/.test(defaults)
      && /html\.dynamic-background-enabled[^{]*\{[\s\S]*?--cursor-pointer:\s*var\(--cursor-heart-pointer\)/.test(pointer)
      && /setProperty\(['"]--cursor-heart-pointer['"]/.test(theme),
  ],
  [
    'PDF preview respects the mode-aware pointer cursor',
    /\.article-export-button\s*\{[\s\S]*?cursor:\s*var\(--cursor-pointer\)/.test(exportButton),
  ],
  [
    'sakura cursor effects are limited to dynamic backgrounds',
    /html\.dynamic-background-enabled\.sakura-hover/.test(sakura)
      && /html\.dynamic-background-enabled\.sakura-grabbing/.test(sakura)
      && /dynamic-background-enabled\.sakura-hover/.test(input),
  ],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
