import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const header = read('src/components/console/ConsoleOverviewHeader.vue')
const config = read('src/data/site/config.ts')
const types = read('src/types/content.ts')
const iconPreference = read('src/composables/useConsoleIconPreference.ts')

const checks = [
  ['custom console icon asset exists', fs.existsSync(path.join(root, 'src/assets/icon.png'))],
  ['site config supports a custom console icon', types.includes('ConsoleIconForm') && config.includes("icon: consoleIcon")],
  ['site config seeds a starting icon form', /iconForm:\s*'(grayscale|whiten|original|pixelated)'/.test(config)],
  ['header falls back to GitHub avatar when no icon is configured', header.includes('config.console?.icon') && header.includes('getGitHubAvatarUrl(config.githubUser)')],
  ['all four icon forms are drawn', ['grayscale', 'whiten', 'original', 'pixelated'].every((form) => header.includes(`avatar--${form}`))],
  // Every form has to answer in either theme now that a click cycles them, so
  // none may switch itself off in one. Only the silhouette is theme-dependent,
  // and it resolves by inverting rather than by disappearing.
  ['the silhouette inverts per theme instead of switching off', /\.console-overview__avatar--whiten\s*\{\s*filter:\s*brightness\(0\)\s*invert\(1\)/.test(header)
    && /data-theme="light"\]\)\s*\.console-overview__avatar--whiten\s*\{\s*filter:\s*brightness\(0\)/.test(header)],
  ['the coarse form resamples with nearest-neighbour sampling', /--pixelated\s*\{[\s\S]*?image-rendering:\s*pixelated/.test(header)
    && /--pixelated\s*\{[\s\S]*?transform:\s*scale\(var\(--console-icon-pixel\)\)/.test(header)],
  ['the portrait plate is a button that cycles the form', /<button[\s\S]{0,200}class="console-overview__portrait"[\s\S]*?@click="cycleIconForm\(\)"/.test(header)],
  // The click ring and the /icon picker read the same ordered list, so the two
  // can never disagree about what comes next.
  ['the cycle order is declared once, in order', /grayscale[\s\S]*?whiten[\s\S]*?original[\s\S]*?pixelated/.test(iconPreference)],
  ['cycling wraps back to the first form', /function cycleConsoleIconForm[\s\S]*?%/.test(iconPreference)],
  ['a chosen form outlives the page', iconPreference.includes('localStorage.setItem(CONSOLE_ICON_FORM_STORAGE_KEY')],
  ['the runtime panel drops the started timestamp', !header.includes('<dt>started</dt>') && !header.includes('config.startedAt')],
  ['the runtime panel reports the live theme and color scheme', header.includes('<dt>theme</dt><dd>{{ theme }}</dd>') && header.includes('<dt>color</dt><dd>{{ colorScheme }}</dd>')],
  ['the copyright owner links out to the GitHub profile', /class="console-overview__owner"[^>]*:href="footerMeta\.githubProfileUrl"[^>]*target="_blank"/.test(header)],
  ['the copyright owner underlines on hover like the classic switch', /\.console-overview__owner:hover,[\s\S]*?text-decoration: underline/.test(header)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
