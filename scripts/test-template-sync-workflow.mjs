import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workflowPath = path.join(projectRoot, '.github', 'workflows', 'sync-starter.yml')
const source = fs.readFileSync(workflowPath, 'utf8')
const freshnessChecks = source.match(/git ls-remote/g) || []
const metadataRequests = source.match(/https:\/\/api\.github\.com\/repos\/dieWehmut\/Vorlage/g) || []

const checks = [
  ['manual dispatch exists', /workflow_dispatch:/.test(source)],
  [
    'staging paths use the runtime environment file',
    /EXPORT_DIR=\$\{RUNNER_TEMP\}\/vorlage-export/.test(source) &&
      /TARGET_DIR=\$\{RUNNER_TEMP\}\/vorlage-repository/.test(source) &&
      source.includes('>> "$GITHUB_ENV"') &&
      !/env:\s*\n\s*EXPORT_DIR:\s*\$\{\{\s*runner\.temp/.test(source),
  ],
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
  ['target clone preserves full main history', /git clone --branch main --single-branch/.test(source) && !/git clone[^\n]*--depth/.test(source)],
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
  ['metadata endpoint is patched then read', /curl -fsSL -X PATCH/.test(source) && metadataRequests.length >= 2],
  [
    'metadata readback asserts repository identity',
    /metadata\.name !== 'Vorlage'/.test(source) && /metadata\.default_branch !== 'main'/.test(source),
  ],
  ['metadata readback asserts the canonical description', /metadata\.description !== 'A blog template/.test(source)],
  ['metadata errors are not ignored', !/continue-on-error:\s*true/.test(source)],
  ['source freshness is checked again before push', freshnessChecks.length >= 2],
  [
    'transient export paths are excluded from mirror',
    [".git/", 'node_modules/', 'dist/', 'public/capture-assets/'].every((entry) => source.includes(`--exclude='${entry}'`)),
  ],
  [
    'stale target build paths are removed before staging',
    ['${TARGET_DIR}/node_modules', '${TARGET_DIR}/dist', '${TARGET_DIR}/public/capture-assets'].every((entry) => source.includes(entry)),
  ],
  [
    'runner temp roots are not recursively deleted',
    !/rm -rf\s+["']?\$\{(?:EXPORT_DIR|TARGET_DIR)\}["']?(?:\s|$)/m.test(source),
  ],
  ['target history is never reconstructed', !/git (?:reset|init)|--orphan/.test(source)],
  ['unconditional force push is absent', !/(?:^|\s)--force(?=\s|$)/m.test(source)],
  ['push credentials are not embedded in the clone URL', !/x-access-token:[^@]*@github\.com/.test(source)],
  ['no-change content does not skip metadata', !/diff --cached --quiet[\s\S]{0,300}?exit 0/.test(source)],
  [
    'target freshness is checked before the no-change decision',
    /git ls-remote https:\/\/github\.com\/dieWehmut\/Vorlage\.git refs\/heads\/main[\s\S]*?latest_target_sha[\s\S]*?target_sha[\s\S]*?git -C "\$\{TARGET_DIR\}" diff --cached --quiet/.test(source),
  ],
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
