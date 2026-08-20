import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workflowPath = path.join(projectRoot, '.github', 'workflows', 'sync-starter.yml')
const source = fs.readFileSync(workflowPath, 'utf8')

const checks = [
  ['manual dispatch exists', /workflow_dispatch:/.test(source)],
  [
    'sync concurrency is serialized',
    /concurrency:[\s\S]*?group:\s*sync-vorlage[\s\S]*?cancel-in-progress:\s*false/.test(source),
  ],
  ['export command is used', /node scripts\/prepare-template\.mjs/.test(source)],
  ['static export validation runs before push', /node scripts\/validate-template\.mjs --root/.test(source)],
  ['export installs frozen dependencies', /pnpm --dir "?\$EXPORT_DIR"? install --frozen-lockfile/.test(source)],
  ['export runs infra regression', /pnpm --dir "?\$EXPORT_DIR"? test:infra-status/.test(source)],
  ['export runs typecheck', /pnpm --dir "?\$EXPORT_DIR"? typecheck/.test(source)],
  [
    'Vorlage base is built',
    /BASE_PATH="?\/Vorlage\/"?[\s\S]*?pnpm --dir "?\$EXPORT_DIR"? build/.test(source),
  ],
  ['built export is validated', /--dist "?\$EXPORT_DIR\/dist"?/.test(source)],
  ['canonical target is cloned', /github\.com\/dieWehmut\/Vorlage\.git/.test(source)],
  [
    'source freshness is checked',
    /git ls-remote[\s\S]*?refs\/heads\/main[\s\S]*?GITHUB_SHA/.test(source),
  ],
  [
    'target push uses an explicit lease',
    /--force-with-lease=refs\/heads\/main:\$\{?target_sha\}?/.test(source),
  ],
  ['metadata enables template mode', /"is_template":\s*true/.test(source)],
  ['metadata uses the Vorlage homepage', /https:\/\/diewehmut\.github\.io\/Vorlage\//.test(source)],
  ['metadata is read back and asserted', /Repository metadata verified\./.test(source)],
  ['metadata errors are not ignored', !/continue-on-error:\s*true/.test(source)],
  [
    'workflow contains no legacy repository token',
    !source.toLowerCase().includes(['diesuwa', '-starter'].join('')),
  ],
]

let failures = 0
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)
  if (!passed) failures += 1
}

if (failures > 0) {
  console.error(`${failures} workflow contract check(s) failed.`)
  process.exitCode = 1
}
