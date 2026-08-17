import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const header = read('src/components/console/ConsoleOverviewHeader.vue')
const config = read('src/data/site/config.ts')
const types = read('src/types/content.ts')

const checks = [
  ['custom console icon asset exists', fs.existsSync(path.join(root, 'src/assets/icon.png'))],
  ['site config supports a custom console icon', types.includes('darkIconEffect') && config.includes("icon: consoleIcon")],
  ['header falls back to GitHub avatar when no icon is configured', header.includes('config.console?.icon') && header.includes('getGitHubAvatarUrl(config.githubUser)')],
  ['light theme keeps the console icon original', /data-theme="light"[\s\S]*?filter:\s*none/.test(header)],
  ['dark theme supports grayscale, white, and original icon effects', header.includes('avatar--grayscale') && header.includes('avatar--whiten') && header.includes('avatar--original')],
  ['the runtime panel drops the started timestamp', !header.includes('<dt>started</dt>') && !header.includes('config.startedAt')],
  ['the runtime panel reports the live theme and color scheme', header.includes('<dt>theme</dt><dd>{{ theme }}</dd>') && header.includes('<dt>color</dt><dd>{{ colorScheme }}</dd>')],
  ['the copyright owner links out to the GitHub profile', /class="console-overview__owner"[^>]*:href="footerMeta\.githubProfileUrl"[^>]*target="_blank"/.test(header)],
  ['the copyright owner underlines on hover like the classic switch', /\.console-overview__owner:hover,[\s\S]*?text-decoration: underline/.test(header)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
