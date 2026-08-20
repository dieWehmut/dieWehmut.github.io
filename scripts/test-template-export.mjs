import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { execFileSync, spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const preparePath = path.join(root, 'scripts', 'prepare-template.mjs')
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-template-export-'))
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const sourceStatusBefore = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=no'], {
  cwd: root,
  encoding: 'utf8',
})

if (!fs.existsSync(preparePath)) {
  console.error('FAIL template export command exists')
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [preparePath, '--source-root', root, '--output', output, '--source-sha', sourceSha],
  {
    cwd: root,
    encoding: 'utf8',
  },
)

if (result.status !== 0) {
  console.error(result.stdout)
  console.error(result.stderr)
  process.exit(result.status || 1)
}

const packageJson = JSON.parse(fs.readFileSync(path.join(output, 'package.json'), 'utf8'))
const packageLock = JSON.parse(fs.readFileSync(path.join(output, 'package-lock.json'), 'utf8'))
const generatedDocs = fs.readFileSync(path.join(output, 'src/data/docs/generated.ts'), 'utf8')
const sourceMarker = JSON.parse(fs.readFileSync(path.join(output, '.template-source.json'), 'utf8'))
const markdownFiles = ['posts/hello-world.md', 'posts/development-log.md', 'notes/sample-note.md']
const sourceStatusAfter = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=no'], {
  cwd: root,
  encoding: 'utf8',
})

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

const docsRoot = path.join(output, 'src/data/docs')
const exportedMarkdown = walk(docsRoot)
  .filter((file) => file.toLowerCase().endsWith('.md'))
  .map((file) => path.relative(docsRoot, file).replaceAll('\\', '/'))
  .sort()
const expectedMarkdown = [...markdownFiles].sort()
const legacyRepository = ['diesuwa', 'starter'].join('-')
const legacyBadge = ['diesuwa', '', 'starter'].join('-')
const textPattern = /\.(?:html|json|md|mjs|ts|vue|ya?ml)$/i
const legacyMatches = walk(output).filter((file) => {
  if (!textPattern.test(file)) return false
  const content = fs.readFileSync(file, 'utf8').toLowerCase()
  return content.includes(legacyRepository) || content.includes(legacyBadge)
})
const rootReadme = fs.readFileSync(path.join(output, 'README.md'), 'utf8')
const developmentLog = fs.readFileSync(path.join(docsRoot, 'posts/development-log.md'), 'utf8')
const deployWorkflow = fs.readFileSync(path.join(output, '.github/workflows/deploy.yml'), 'utf8')
const { prepareTemplate } = await import(pathToFileURL(preparePath).href)
const guardRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-template-guard-'))
const guardSource = path.join(guardRoot, 'source')
fs.mkdirSync(guardSource)

async function guardError(sourceRoot, outputRoot) {
  try {
    await prepareTemplate({ sourceRoot, outputRoot, sourceSha })
    return ''
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

const ancestorGuard = await guardError(guardSource, guardRoot)
const descendantGuard = await guardError(guardSource, path.join(guardSource, 'output'))

const gitInit = spawnSync('git', ['-C', output, 'init', '--quiet'], { cwd: root, encoding: 'utf8' })
const ignoredProbe = spawnSync(
  'git',
  ['-C', output, 'check-ignore', '--no-index', ...markdownFiles.map((file) => `src/data/docs/${file}`), 'docs/README.en.md', '.template-source.json'],
  { cwd: root, encoding: 'utf8' },
)

const checks = [
  ['package is vorlage', packageJson.name === 'vorlage'],
  ['lockfile is vorlage', packageLock.name === 'vorlage' && packageLock.packages?.['']?.name === 'vorlage'],
  ['source-only workflow removed', !fs.existsSync(path.join(output, '.github/workflows/sync-starter.yml'))],
  ['source-only capture workflow removed', !fs.existsSync(path.join(output, '.github/workflows/sync-capture.yml'))],
  ['source-only design docs removed', !fs.existsSync(path.join(output, 'docs/superpowers'))],
  ['starter config promoted', fs.existsSync(path.join(output, 'src/data/site/config.ts')) && !fs.existsSync(path.join(output, 'src/data/site/config.starter.ts'))],
  ['three sample docs exported', markdownFiles.every((file) => fs.existsSync(path.join(output, 'src/data/docs', file)))],
  ['only sample docs exported', JSON.stringify(exportedMarkdown) === JSON.stringify(expectedMarkdown)],
  ['sample docs indexed', markdownFiles.every((file) => generatedDocs.includes(`./${file}`))],
  ['source SHA recorded', sourceMarker.sourceSha === sourceSha && sourceMarker.repository === 'dieWehmut/Vorlage'],
  ['source update time recorded', /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(sourceMarker.sourceUpdated)],
  ['development log records source SHA', developmentLog.includes(sourceSha)],
  ['template title exported', fs.readFileSync(path.join(output, 'index.html'), 'utf8').includes('<title>Vorlage</title>')],
  ['deploy workflow uses real GitHub expressions', deployWorkflow.includes('VITE_CODE_RUNNER_API_URL: ${{ vars.VITE_CODE_RUNNER_API_URL }}') && deployWorkflow.includes('repo_name="${GITHUB_REPOSITORY#*/}"')],
  ['deploy workflow has no escaped shell expressions', !deployWorkflow.includes('\\${') && !deployWorkflow.includes('\\$repo_name')],
  ['template README exported', rootReadme.includes('Vorlage') && rootReadme.includes('https://github.com/dieWehmut/Vorlage')],
  ['translated READMEs exported', ['README.en.md', 'README.ja.md', 'README.zh-TW.md'].every((file) => fs.existsSync(path.join(output, 'docs', file)))],
  ['starter README sources removed', !walk(path.join(output, 'src/data/site')).some((file) => path.basename(file).startsWith('starter-readme'))],
  ['legacy template identity removed', legacyMatches.length === 0],
  ['generated template files are not ignored', gitInit.status === 0 && ignoredProbe.status === 1],
  ['source worktree unchanged', sourceStatusAfter === sourceStatusBefore],
  ['output ancestor is rejected', ancestorGuard === 'Template output must be outside the source repository'],
  ['output descendant is rejected', descendantGuard === 'Template output must be outside the source repository'],
]

for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (checks.some(([, ok]) => !ok)) process.exitCode = 1
