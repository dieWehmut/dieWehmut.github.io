import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { execFileSync, spawnSync } from 'node:child_process'

const root = process.cwd()
const preparePath = path.join(root, 'scripts', 'prepare-template.mjs')
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-template-export-'))
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

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

const checks = [
  ['package is vorlage', packageJson.name === 'vorlage'],
  ['lockfile is vorlage', packageLock.name === 'vorlage' && packageLock.packages?.['']?.name === 'vorlage'],
  ['source-only workflow removed', !fs.existsSync(path.join(output, '.github/workflows/sync-starter.yml'))],
  ['source-only capture workflow removed', !fs.existsSync(path.join(output, '.github/workflows/sync-capture.yml'))],
  ['source-only design docs removed', !fs.existsSync(path.join(output, 'docs/superpowers'))],
  ['starter config promoted', fs.existsSync(path.join(output, 'src/data/site/config.ts')) && !fs.existsSync(path.join(output, 'src/data/site/config.starter.ts'))],
  ['three sample docs exported', markdownFiles.every((file) => fs.existsSync(path.join(output, 'src/data/docs', file)))],
  ['sample docs indexed', markdownFiles.every((file) => generatedDocs.includes(`./${file}`))],
  ['source SHA recorded', sourceMarker.sourceSha === sourceSha && sourceMarker.repository === 'dieWehmut/Vorlage'],
  ['source update time recorded', /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(sourceMarker.sourceUpdated)],
  ['template title exported', fs.readFileSync(path.join(output, 'index.html'), 'utf8').includes('<title>Vorlage</title>')],
]

for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (checks.some(([, ok]) => !ok)) process.exitCode = 1
