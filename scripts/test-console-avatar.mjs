import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const header = read('src/components/console/ConsoleOverviewHeader.vue')
const config = read('src/data/site/config.ts')
const types = read('src/types/content.ts')
const iconPreference = read('src/composables/useConsoleIconPreference.ts')
const captureGenerator = read('scripts/generate-capture.mjs')

const checks = [
  // The icon used to be `new URL('../../assets/icon.png', import.meta.url)`, which
  // only ever resolved on a machine that had the file: this repository tracks no
  // images at all, so a CI checkout left the expression unrewritten and the
  // deployed page asked for an asset the build had never emitted. Naming a runtime
  // /capture-assets/ path instead keeps the bundler out of it, and the build-time
  // copy is what puts the file there — hence both halves are asserted together.
  ['the console icon is a runtime asset path, not a bundled import', /consoleIcon = '\/capture-assets\/site\/icon\.png'/.test(config)
    && !/new URL\([^)]*\.png/.test(config)],
  ['the build copies that folder out of the private assets repository', /publicAssetFolders = \[[^\]]*'site'/.test(captureGenerator)
    && /for \(const folder of publicAssetFolders\) syncPublicAssetFolder\(/.test(captureGenerator)],
  ['site config supports a custom console icon', types.includes('ConsoleIconForm') && config.includes('icon: consoleIcon')],
  ['site config seeds a starting icon form', /iconForm:\s*'(grayscale|whiten|original|pixelated)'/.test(config)],
  ['header falls back to GitHub avatar when no icon is configured', header.includes('config.console?.icon') && header.includes('getGitHubAvatarUrl(config.githubUser)')],
  ['all four icon forms are drawn', ['grayscale', 'whiten', 'original', 'pixelated'].every((form) => header.includes(`avatar--${form}`))],
  // Every form has to answer in either theme now that a click cycles them, so
  // none may switch itself off in one. Only the silhouette is theme-dependent,
  // and it resolves by inverting rather than by disappearing. The light override
  // reaches the image through a plain ancestor selector: wrapping the ancestor in
  // `:global()` would make Vue's scoped rewriter drop the half that names the
  // image, landing the filter on <html> — see test-scoped-styles.mjs.
  ['the silhouette inverts per theme instead of switching off', /\.console-overview__avatar--whiten\s*\{\s*filter:\s*brightness\(0\)\s*invert\(1\)/.test(header)
    && /\[data-theme="light"\]\s+\.console-overview__avatar--whiten\s*\{\s*filter:\s*brightness\(0\)/.test(header)],
  ['the coarse form resamples with nearest-neighbour sampling', /--pixelated\s*\{[\s\S]*?image-rendering:\s*pixelated/.test(header)
    && /--pixelated\s*\{[\s\S]*?transform:\s*scale\(var\(--console-icon-pixel\)\)/.test(header)],
  ['the portrait plate is a button that cycles the form', /<button[\s\S]{0,200}class="console-overview__portrait"[\s\S]*?@click="cycleIconForm\(\)"/.test(header)],
  // The plate is a third of the banner. Tinting it under a passing cursor was a
  // third of the page changing colour to report a pointer position. Keyboard focus
  // still needs a mark, and console mode draws no rules, so that one keeps the fill.
  ['the plate marks keyboard focus but says nothing on hover', /\.console-overview__portrait:focus-visible\s*\{[^}]*background:\s*var\(--console-control-strong\)/.test(header)
    && !/\.console-overview__portrait:hover/.test(header)],
  // The click ring and the /icon picker read the same ordered list, so the two
  // can never disagree about what comes next.
  ['the cycle order is declared once, in order', /grayscale[\s\S]*?whiten[\s\S]*?original[\s\S]*?pixelated/.test(iconPreference)],
  ['cycling wraps back to the first form', /function cycleConsoleIconForm[\s\S]*?%/.test(iconPreference)],
  ['a chosen form outlives the page', iconPreference.includes('localStorage.setItem(CONSOLE_ICON_FORM_STORAGE_KEY')],
  ['the runtime panel drops the started timestamp', !header.includes('<dt>started</dt>') && !header.includes('config.startedAt')],
  // The status line under the prompt already reads back the theme and the colour
  // scheme, and it reads them back in the words `/theme` and `/color` accept. The
  // banner reporting the same two beside a copyright notice was a second, stiller
  // copy of the same state, so it names only what nothing else does.
  ['the runtime panel leaves the live preferences to the status line', !header.includes('<dt>theme</dt>')
    && !header.includes('<dt>color</dt>')
    && !header.includes('useThemePreference')
    && !header.includes('useColorSchemePreference')],
  // The gaps between the sections have to be the margins' business. Spreading the
  // slack between them made each gap a function of the banner's spare height, so
  // trimming a row widened every gap instead of tightening the column.
  // `[^}]*` keeps the reading inside the one rule: unbounded, it would run on and
  // find the chrome row's own `space-between` further down the stylesheet.
  ['the sections stack from the top rather than being spread apart', /\.console-overview__dashboard\s*\{[^}]*justify-content:\s*flex-start/.test(header)
    && !/\.console-overview__dashboard\s*\{[^}]*justify-content:\s*space-between/.test(header)],
  ['the copyright owner links out to the GitHub profile', /class="console-overview__owner"[^>]*:href="footerMeta\.githubProfileUrl"[^>]*target="_blank"/.test(header)],
  ['the copyright owner underlines on hover like the classic switch', /\.console-overview__owner:hover,[\s\S]*?text-decoration: underline/.test(header)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
