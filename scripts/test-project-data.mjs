import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

const agentPath = path.join(root, 'src', 'data', 'site', 'agent.ts')
const agent = fs.existsSync(agentPath) ? fs.readFileSync(agentPath, 'utf8') : ''
const contentTypes = read('src/types/content.ts')
const dataIndex = read('src/data/index.ts')
const projectView = read('src/views/ProjectView.vue')
const projectItem = read('src/components/project/ProjectListItem.vue')
const pages = read('src/data/site/page.ts')
const template = read('scripts/prepare-template.mjs')
const packageJson = JSON.parse(read('package.json'))
const locales = ['en', 'zh', 'zh_tw', 'ja', 'de', 'la'].map((locale) => ({
  locale,
  messages: JSON.parse(read(`src/locales/${locale}.json`)),
}))

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasWebsite(name, repoUrl, pageUrl) {
  const block = new RegExp(
    `name:\\s*['"]${escaped(name)}['"][\\s\\S]*?displayName:\\s*['"]${escaped(name)}['"][\\s\\S]*?repoUrl:\\s*['"]${escaped(repoUrl)}['"][\\s\\S]*?date:\\s*['"]2026-09-11['"][\\s\\S]*?url:\\s*['"]${escaped(pageUrl)}['"]`,
  )
  return block.test(pages)
}

const checks = [
  ['agent data module exists', Boolean(agent)],
  ['Orchester agent points at its repository', /name:\s*['"]Orchester['"][\s\S]*?repo_url:\s*['"]https:\/\/github\.com\/dieWehmut\/Orchester['"]/.test(agent)],
  ['Orchester agent records the verified update date', /lastModified:\s*['"]2026-09-11['"]/.test(agent)],
  ['project category type includes agents', /ProjectCategory\s*=\s*[^\n]*['"]agents['"]/.test(contentTypes)],
  ['project aggregation imports the agent data', /import\s*\{\s*agents\s*\}\s*from\s*['"]\.\/site\/agent['"]/.test(dataIndex)],
  ['project aggregation emits the agents category', /category:\s*['"]agents['"]/.test(dataIndex) && /\.\.\.agentEntries/.test(dataIndex)],
  ['project page orders and labels agents', /const order[^\n]*['"]agents['"]/.test(projectView) && /agents:\s*['"]project\.categories\.agents['"]/.test(projectView)],
  ['project page and cards map an agents icon', /agents:\s*Cpu/.test(projectView) && /agents:\s*Cpu/.test(projectItem)],
  ['all locales label the agents category', locales.every(({ messages }) => Boolean(messages.project?.categories?.agents))],
  ['template export writes an empty agent data module', /\[['"]agent\.ts['"],\s*['"]agents['"],\s*['"]Agents['"]\]/.test(template)],
  ['Orchester website pairs the repository and Pages URL', hasWebsite('Orchester', 'https://github.com/dieWehmut/Orchester', 'https://diewehmut.github.io/Orchester/')],
  ['Sandkasten website pairs the repository and Pages URL', hasWebsite('Sandkasten', 'https://github.com/dieWehmut/Sandkasten', 'https://diewehmut.github.io/Sandkasten/')],
  ['Selbstlauf website pairs the repository and Pages URL', hasWebsite('Selbstlauf', 'https://github.com/dieWehmut/Selbstlauf', 'https://diewehmut.github.io/Selbstlauf/')],
  ['Vorlage website pairs the repository and Pages URL', hasWebsite('Vorlage', 'https://github.com/dieWehmut/Vorlage', 'https://diewehmut.github.io/Vorlage/')],
  ['project data regression is exposed through package scripts', packageJson.scripts?.['test:project-data'] === 'node scripts/test-project-data.mjs'],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
