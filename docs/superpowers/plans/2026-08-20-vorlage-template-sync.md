# Vorlage Template Synchronization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename every active template reference to `Vorlage`, produce a deterministic and self-validating template export, safely synchronize it to `dieWehmut/Vorlage`, and restore the Pages deployment at `/Vorlage/`.

**Architecture:** A shared identity module owns the GitHub name, npm package name, repository URL, Pages URL, and Pages base. A Node export command copies the tracked source tree into a clean staging directory, applies the intentional template transformations, regenerates derived content, and validates the result before the workflow can push it. GitHub Actions becomes orchestration only: prepare, validate, build, mirror with a target-SHA lease, verify repository metadata, and let the template repository deploy itself.

**Tech Stack:** Node.js ESM scripts, pnpm, Vue 3, TypeScript, Vite, GitHub Actions, Git, GitHub REST API.

---

## File Map

- Create `src/data/site/template-identity.json`: canonical template identity values shared by Vue and Node.
- Create `scripts/template-identity.mjs`: Node adapter for the shared identity JSON.
- Create `scripts/test-template-identity.mjs`: tracked-tree identity regression.
- Create `scripts/infra-integration-scan.mjs`: reusable forbidden-integration scanner with generated-history exclusion.
- Create `scripts/test-infra-integration-scan.mjs`: regression for the template deployment failure.
- Create `scripts/prepare-template.mjs`: deterministic tracked-file export and template transformations.
- Create `scripts/validate-template.mjs`: static and built-output parity validator.
- Create `scripts/test-template-export.mjs`: end-to-end temporary export regression.
- Create `scripts/test-template-sync-workflow.mjs`: workflow safety contract.
- Create `.template-source.json` in each generated export: source SHA and canonical repository marker.
- Modify `package.json`: expose the new test, export, and validation commands.
- Modify `.github/workflows/sync-starter.yml`: replace inline mutation with validated orchestration.
- Modify `scripts/test-infra-status.mjs`: consume the reusable scanner and accept an explicit staging root.
- Modify `scripts/generate-docs-data.mjs`: accept source-root and docs-root overrides for staging generation.
- Modify `README.md`, `src/data/site/about.md`, `src/data/site/config.ts`, `src/data/site/config.starter.ts`, `src/data/site/template.ts`, and `src/data/site/starter-readme*.md`: canonical `Vorlage` identity.

### Task 1: Canonicalize the Template Identity

**Branch:** `fix/vorlage-identity`, based on `docs/vorlage-sync-design`

**Files:**
- Create: `src/data/site/template-identity.json`
- Create: `scripts/template-identity.mjs`
- Create: `scripts/test-template-identity.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/sync-starter.yml`
- Modify: `README.md`
- Modify: `src/data/site/about.md`
- Modify: `src/data/site/config.ts`
- Modify: `src/data/site/config.starter.ts`
- Modify: `src/data/site/template.ts`
- Modify: `src/data/site/starter-readme.md`
- Modify: `src/data/site/starter-readme.en.md`
- Modify: `src/data/site/starter-readme.ja.md`
- Modify: `src/data/site/starter-readme.zh-TW.md`

- [ ] **Step 1: Create the identity branch in its own worktree**

Run from `D:\project\Nexus`:

```powershell
git worktree add `
  'C:\Users\30119\.config\superpowers\worktrees\Nexus\vorlage-identity' `
  -b fix/vorlage-identity docs/vorlage-sync-design
```

Expected: the worktree is created at the requested path without changing the dirty `main` worktree.

- [ ] **Step 2: Write the failing tracked-tree identity test**

Create `scripts/test-template-identity.mjs` with a small `check(label, condition, detail)` helper and these contracts:

```js
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const identityPath = path.join(root, 'src', 'data', 'site', 'template-identity.json')
const legacyToken = ['diesuwa', 'starter'].join('-')
const legacyBadgeToken = ['diesuwa', '', 'starter'].join('-')
const textPattern = /\.(?:html|json|md|mjs|ts|vue|ya?ml)$/i
const failures = []

function check(label, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`)
  if (!condition) failures.push(label)
}

check('template identity JSON exists', fs.existsSync(identityPath))

if (fs.existsSync(identityPath)) {
  const templateIdentity = JSON.parse(fs.readFileSync(identityPath, 'utf8'))
  check('repository name is Vorlage', templateIdentity.repositoryName === 'Vorlage')
  check('package name is lowercase', templateIdentity.packageName === 'vorlage')
  check('repository target is canonical', templateIdentity.repository === 'dieWehmut/Vorlage')
  check('Pages base preserves repository case', templateIdentity.pagesBase === '/Vorlage/')
}

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter((file) => textPattern.test(file))

const matches = tracked.filter((file) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8').toLowerCase()
  return source.includes(legacyToken) || source.includes(legacyBadgeToken)
})

check('tracked text contains no legacy template token', matches.length === 0, matches.join(', '))

if (failures.length) process.exitCode = 1
```

Add to `package.json`:

```json
"test:template-identity": "node scripts/test-template-identity.mjs"
```

- [ ] **Step 3: Run the identity test and verify RED**

Run:

```powershell
pnpm test:template-identity
```

Expected: FAIL because the shared identity JSON does not exist and the tracked source still contains legacy references.

- [ ] **Step 4: Implement the shared identity module**

Create `src/data/site/template-identity.json`:

```json
{
  "owner": "dieWehmut",
  "repositoryName": "Vorlage",
  "packageName": "vorlage",
  "repository": "dieWehmut/Vorlage",
  "repositoryUrl": "https://github.com/dieWehmut/Vorlage",
  "pagesUrl": "https://diewehmut.github.io/Vorlage/",
  "pagesBase": "/Vorlage/"
}
```

Create `scripts/template-identity.mjs` as the Node adapter:

```js
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const identityPath = path.join(root, 'src', 'data', 'site', 'template-identity.json')
export const templateIdentity = Object.freeze(JSON.parse(fs.readFileSync(identityPath, 'utf8')))

export default templateIdentity
```

Import the JSON from `src/data/site/config.ts`, `config.starter.ts`, and
`template.ts` so the Vue source and exporter use the same values. The JSON file
must remain in the generated template.

- [ ] **Step 5: Replace every active repository reference**

Apply these exact semantics across the listed files:

```text
GitHub repository/display name: Vorlage
npm package and lockfile name: vorlage
repository URL: https://github.com/dieWehmut/Vorlage
Pages URL: https://diewehmut.github.io/Vorlage/
Pages base example: /Vorlage/
clone directory examples: Vorlage
```

In `.github/workflows/sync-starter.yml`, update all inline generated package data, sample content, title, clone target, REST API target, and homepage now. The later workflow task will remove the inline block, but this branch must already satisfy the zero-legacy-token invariant.

Do not change `dieWehmut`, `dieWehmut.github.io`, `diesw-assets`, `Sandkasten`, generic `starter`/`template` terms, or the German locale word `Vorlagen`.

- [ ] **Step 6: Run identity verification and source checks**

Run:

```powershell
pnpm test:template-identity
pnpm typecheck
pnpm test:site-overview
```

Expected: all commands exit 0 and the identity test reports no tracked legacy matches.

- [ ] **Step 7: Commit and push the identity branch**

```powershell
git add package.json .github/workflows/sync-starter.yml scripts/template-identity.mjs scripts/test-template-identity.mjs src/data/site/template-identity.json README.md src/data/site
git commit -m "refactor: rename the template repository to Vorlage"
git push -u origin fix/vorlage-identity
```

Expected: one focused commit is pushed to `origin/fix/vorlage-identity`.

### Task 2: Stop Historical Content from Failing the Infra Gate

**Branch:** `fix/template-export`, based on `fix/vorlage-identity`

**Files:**
- Create: `scripts/infra-integration-scan.mjs`
- Create: `scripts/test-infra-integration-scan.mjs`
- Modify: `scripts/test-infra-status.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the export branch in a separate worktree**

```powershell
git worktree add `
  'C:\Users\30119\.config\superpowers\worktrees\Nexus\template-export' `
  -b fix/template-export fix/vorlage-identity
```

- [ ] **Step 2: Write the failing scanner regression**

Create `scripts/test-infra-integration-scan.mjs`. The test builds a temporary tree containing a runtime file and a generated development log. Construct the forbidden product name from fragments so the test does not itself violate the repository-wide scan.

```js
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath = path.resolve('scripts/infra-integration-scan.mjs')
if (!fs.existsSync(modulePath)) {
  console.error('FAIL reusable infra integration scanner exists')
  process.exit(1)
}

const { findForbiddenIntegrationReferences } = await import(pathToFileURL(modulePath).href)
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-infra-scan-'))
const product = ['ku', 'ma'].join('')
const runtimePath = 'src/composables/runtime-status.ts'
const historyPath = 'src/data/docs/posts/development-log.md'

for (const [relative, content] of [
  [runtimePath, `const provider = '${product}'\n`],
  [historyPath, `- historical commit removed ${product}\n`],
]) {
  const absolute = path.join(root, relative)
  fs.mkdirSync(path.dirname(absolute), { recursive: true })
  fs.writeFileSync(absolute, content)
}

const references = findForbiddenIntegrationReferences(root, [runtimePath, historyPath])
if (references.contentMatches.join(',') !== runtimePath) {
  console.error(`FAIL generated history is excluded: ${references.contentMatches.join(',')}`)
  process.exit(1)
}

console.log('PASS generated history is excluded from runtime integration scanning')
```

Also import `listProjectFiles`, create `node_modules/ignored.js`, and assert that
the no-Git temporary tree returns `runtimePath` and `historyPath` but excludes
`node_modules/ignored.js`. This proves staging validation does not depend on a
`.git` directory.

Add:

```json
"test:infra-integration-scan": "node scripts/test-infra-integration-scan.mjs"
```

- [ ] **Step 3: Run the scanner regression and verify RED**

```powershell
pnpm test:infra-integration-scan
```

Expected: FAIL with `reusable infra integration scanner exists`.

- [ ] **Step 4: Implement and integrate the scanner**

Create `scripts/infra-integration-scan.mjs`:

```js
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const excludedContent = new Set([
  'src/data/docs/posts/development-log.md',
])

const textPattern = /\.(?:ts|tsx|vue|mjs|js|json|ya?ml|md)$/i
const forbiddenProduct = ['ku', 'ma'].join('')

function walk(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

export function findForbiddenIntegrationReferences(root, trackedPaths) {
  const normalized = trackedPaths.map((file) => file.replaceAll('\\', '/'))
  const pathMatches = normalized.filter((file) => file.toLowerCase().includes(forbiddenProduct))
  const contentMatches = normalized
    .filter((file) => textPattern.test(file))
    .filter((file) => file !== 'scripts/test-infra-status.mjs')
    .filter((file) => file !== 'scripts/test-infra-integration-scan.mjs')
    .filter((file) => !excludedContent.has(file))
    .filter((file) => fs.existsSync(path.join(root, file)))
    .filter((file) => fs.readFileSync(path.join(root, file), 'utf8').toLowerCase().includes(forbiddenProduct))

  return { pathMatches, contentMatches }
}

export function listProjectFiles(root) {
  try {
    return execFileSync('git', ['-C', root, 'ls-files', '-z'])
      .toString('utf8')
      .split('\0')
      .filter(Boolean)
  } catch {
    return walk(root)
      .map((file) => path.relative(root, file).replaceAll('\\', '/'))
      .filter((file) => !/^(?:\.git|node_modules|dist)(?:\/|$)/.test(file))
  }
}
```

In `scripts/test-infra-status.mjs`, resolve the project root from `--root`, then
`INFRA_STATUS_ROOT`, then the existing repository default:

```js
const rootFlag = process.argv.indexOf('--root')
const requestedRoot = rootFlag === -1 ? process.env.INFRA_STATUS_ROOT : process.argv[rootFlag + 1]
const root = requestedRoot
  ? path.resolve(requestedRoot)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const trackedPaths = listProjectFiles(root)
```

Replace the duplicated scan block with an import and:

```js
const forbiddenReferences = findForbiddenIntegrationReferences(root, trackedPaths)
check(
  'tracked application and starter files contain no status-page product integration',
  forbiddenReferences.pathMatches.length === 0 && forbiddenReferences.contentMatches.length === 0,
)
```

Remove the conditional assertions that inspect the source sync workflow for the
repository description and embedded generated deploy workflow. After extraction,
the source workflow is orchestration; `validate-template.mjs` owns those generated
template contracts. Keep the separate assertion on the source repository's own
`.github/workflows/deploy.yml`.

- [ ] **Step 5: Verify GREEN and commit**

```powershell
pnpm test:infra-integration-scan
pnpm test:infra-status
git add package.json scripts/infra-integration-scan.mjs scripts/test-infra-integration-scan.mjs scripts/test-infra-status.mjs
git commit -m "fix(infra): ignore generated history in integration checks"
```

Expected: both tests pass and the commit contains only the scanner regression and integration.

### Task 3: Export a Deterministic Template Snapshot

**Files:**
- Create: `scripts/prepare-template.mjs`
- Create: `scripts/test-template-export.mjs`
- Modify: `scripts/generate-docs-data.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing export test**

Create `scripts/test-template-export.mjs` with these behaviors:

```js
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

const result = spawnSync(process.execPath, [preparePath, '--source-root', root, '--output', output, '--source-sha', sourceSha], {
  cwd: root,
  encoding: 'utf8',
})

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
```

Add:

```json
"template:prepare": "node scripts/prepare-template.mjs",
"test:template-export": "node scripts/test-template-export.mjs"
```

- [ ] **Step 2: Run the export test and verify RED**

```powershell
pnpm test:template-export
```

Expected: FAIL with `template export command exists`.

- [ ] **Step 3: Implement tracked-file copying and argument parsing**

In `scripts/prepare-template.mjs`, export `prepareTemplate({ sourceRoot, outputRoot, sourceSha })` and provide a CLI wrapper. Use `git -C <source> ls-files -z` as the copy manifest so ignored caches, private local files, `node_modules`, and build output cannot enter the export.

Required guard and copy structure:

```js
function assertSeparatedRoots(sourceRoot, outputRoot) {
  const source = path.resolve(sourceRoot)
  const output = path.resolve(outputRoot)
  if (source === output || output.startsWith(`${source}${path.sep}`)) {
    throw new Error('Template output must be outside the source repository')
  }
}

function copyTrackedFiles(sourceRoot, outputRoot) {
  const files = execFileSync('git', ['-C', sourceRoot, 'ls-files', '-z'])
    .toString('utf8')
    .split('\0')
    .filter(Boolean)

  fs.rmSync(outputRoot, { recursive: true, force: true })
  fs.mkdirSync(outputRoot, { recursive: true })
  for (const relative of files) {
    const source = path.join(sourceRoot, relative)
    if (!fs.existsSync(source)) continue
    const destination = path.join(outputRoot, relative)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(source, destination)
  }
}
```

- [ ] **Step 4: Make document generation root-aware and deterministic**

Modify `scripts/generate-docs-data.mjs` so normal source builds keep their current
behavior while exported templates can provide explicit roots and a stable source
timestamp:

```js
const rootDir = path.resolve(process.env.PROJECT_ROOT || process.cwd())
const docsDir = path.resolve(process.env.DOCS_ROOT || path.join(rootDir, 'src', 'data', 'docs'))
const gitRoot = path.resolve(process.env.GIT_ROOT || rootDir)
const markerPath = path.join(rootDir, '.template-source.json')
const templateMarker = fs.existsSync(markerPath)
  ? JSON.parse(fs.readFileSync(markerPath, 'utf8'))
  : null
```

Use `execFileSync('git', ['-C', gitRoot, 'log', ...])` instead of a shell command.
Convert each path to a POSIX path relative to `gitRoot`. For the generated
template, prefer `templateMarker.sourceUpdated`; otherwise retain the per-file
Git date:

```js
const updated = templateMarker?.sourceUpdated || getGitLastUpdated(filePath) || ''
```

This makes the committed `generated.ts` and the file regenerated during the
template Pages build identical.

- [ ] **Step 5: Move the intentional template transformations into Node**

Implement helpers in `scripts/prepare-template.mjs` for:

```text
removeSourceOnlyFiles
rewritePackageMetadata
installTemplateReadmes
promoteStarterConfig
writeSampleSiteData
writeSampleDocs
writeEmptyCaptureData
writeTemplateDeployWorkflow
rewriteHtmlTitle
regenerateDocumentMetadata
```

Use `templateIdentity` for every name and URL. Preserve the existing sample data and translated README source files, but remove these paths from the export after their content is copied:

```js
const sourceOnlyPaths = [
  '.claude',
  '.githooks',
  'CAPTURE.md',
  'docs',
  'prompt',
  'sample',
  '.github/workflows/sync-starter.yml',
  '.github/workflows/sync-capture.yml',
  'scripts/checkout-assets-repo.mjs',
  'scripts/sync-assets-repo.mjs',
  'scripts/template-identity.mjs',
  'scripts/prepare-template.mjs',
  'scripts/validate-template.mjs',
  'scripts/test-infra-integration-scan.mjs',
  'scripts/test-template-export.mjs',
  'scripts/test-template-identity.mjs',
  'scripts/test-template-sync-workflow.mjs',
]
```

Before removing `docs`, copy the translated source READMEs into newly created `docs/README.en.md`, `docs/README.ja.md`, and `docs/README.zh-TW.md`. Copy `src/data/site/starter-readme.md` to root `README.md`, then remove every `src/data/site/starter-readme*.md` from the export.

Write the development log from `git log --date=iso-strict --pretty=format:- %h %cI - %s` in the source repository and include `sourceSha` in its introduction. Write the deterministic source marker before validation:

```js
const sourceUpdated = execFileSync(
  'git',
  ['-C', sourceRoot, 'show', '-s', '--format=%ad', '--date=format:%Y/%m/%d %H:%M', sourceSha],
  { encoding: 'utf8' },
).trim()

fs.writeFileSync(
  path.join(outputRoot, '.template-source.json'),
  `${JSON.stringify({ sourceSha, sourceUpdated, repository: templateIdentity.repository }, null, 2)}\n`,
)
```

After all three sample Markdown files exist, run:

```js
execFileSync(process.execPath, ['scripts/generate-docs-data.mjs'], {
  cwd: outputRoot,
  env: {
    ...process.env,
    PROJECT_ROOT: outputRoot,
    DOCS_ROOT: path.join(outputRoot, 'src', 'data', 'docs'),
    GIT_ROOT: sourceRoot,
  },
  stdio: 'inherit',
})
```

Remove source-only package scripts (`assets:push`, `template:prepare`, `template:validate`, `test:template-*`, `test:sync-*`, and `test:infra-integration-scan`) while retaining `test:infra-status`, `typecheck`, and `build` for the generated repository.

- [ ] **Step 6: Verify GREEN and commit the exporter**

```powershell
pnpm test:template-export
pnpm test:template-identity
git add package.json scripts/prepare-template.mjs scripts/test-template-export.mjs scripts/generate-docs-data.mjs
git commit -m "feat(template): export a deterministic Vorlage snapshot"
```

Expected: temporary export succeeds, contains exactly the sample Markdown set, and its generated index points only to files that exist.

### Task 4: Validate Repository and Pages Parity Before Push

**Files:**
- Create: `scripts/validate-template.mjs`
- Modify: `scripts/test-template-export.mjs`
- Modify: `package.json`

- [ ] **Step 1: Extend the export test with a missing-validator failure**

Append to `scripts/test-template-export.mjs` before the final success result:

```js
const validatePath = path.join(root, 'scripts', 'validate-template.mjs')
if (!fs.existsSync(validatePath)) {
  console.error('FAIL template validator exists')
  process.exit(1)
}

const validation = spawnSync(process.execPath, [validatePath, '--root', output], {
  cwd: root,
  encoding: 'utf8',
})
process.stdout.write(validation.stdout)
process.stderr.write(validation.stderr)
if (validation.status !== 0) process.exit(validation.status || 1)
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
pnpm test:template-export
```

Expected: FAIL with `template validator exists`.

- [ ] **Step 3: Implement static export validation**

Create `scripts/validate-template.mjs` with `validateTemplate({ root, distRoot })`. It must recursively inspect text files and assert:

```text
package.json and package-lock.json names are vorlage
no legacy repository or badge token appears
README, config.ts, about.md, page.ts, infra.ts, and template.ts use the canonical repository/Pages URLs
source-only workflow, config source, private asset scripts, and design docs are absent
generated.ts contains one path for every Markdown file and every generated path exists
.template-source.json contains a full source SHA, sourceUpdated, and dieWehmut/Vorlage
generated deploy.yml includes pnpm test:infra-status and derives BASE_PATH from GITHUB_REPOSITORY
index.html title is Vorlage
```

Use this metadata-path comparison:

```js
const markdownPaths = walk(path.join(root, 'src/data/docs'))
  .filter((file) => file.toLowerCase().endsWith('.md'))
  .map((file) => `./${path.relative(path.join(root, 'src/data/docs'), file).replaceAll('\\', '/')}`)
  .sort()

const generatedSource = fs.readFileSync(path.join(root, 'src/data/docs/generated.ts'), 'utf8')
const generatedPaths = [...generatedSource.matchAll(/"path":\s*"([^"]+)"/g)]
  .map((match) => match[1])
  .sort()

check('generated document paths match Markdown files', JSON.stringify(generatedPaths) === JSON.stringify(markdownPaths))
check('generated document paths are unique', new Set(generatedPaths).size === generatedPaths.length)
```

When `--dist <path>` is present, parse `dist/index.html`. Every local `src` or `href` ending in `.js` or `.css` must start with `templateIdentity.pagesBase`; then resolve it below the dist directory and assert the asset exists.

Add:

```json
"template:validate": "node scripts/validate-template.mjs"
```

- [ ] **Step 4: Verify static validation GREEN**

```powershell
pnpm test:template-export
```

Expected: exporter and validator both pass on the temporary staging tree.

- [ ] **Step 5: Build and validate a real `/Vorlage/` artifact**

Use a new temporary directory and run:

```powershell
$exportRoot = Join-Path $env:TEMP ("vorlage-export-" + [guid]::NewGuid().ToString('N'))
$sourceSha = git rev-parse HEAD
node scripts/prepare-template.mjs --source-root (Get-Location).Path --output $exportRoot --source-sha $sourceSha
pnpm --dir $exportRoot install --frozen-lockfile
pnpm --dir $exportRoot test:infra-status
pnpm --dir $exportRoot typecheck
$env:BASE_PATH = '/Vorlage/'
pnpm --dir $exportRoot build
Remove-Item Env:BASE_PATH
node scripts/validate-template.mjs --root $exportRoot --dist (Join-Path $exportRoot 'dist')
```

Expected: all commands exit 0; `dist/index.html` and all referenced local assets resolve under `/Vorlage/`.

- [ ] **Step 6: Commit and push the export branch**

```powershell
git add package.json scripts/validate-template.mjs scripts/test-template-export.mjs
git commit -m "test(template): validate exported repository parity"
git push -u origin fix/template-export
```

Expected: `origin/fix/template-export` contains the infra fix, deterministic exporter, and validator as separate commits.

### Task 5: Make GitHub Actions Validate Before Synchronizing

**Branch:** `fix/template-sync-workflow`, based on `fix/template-export`

**Files:**
- Create: `scripts/test-template-sync-workflow.mjs`
- Modify: `.github/workflows/sync-starter.yml`
- Modify: `scripts/test-infra-status.mjs` (remove inline-workflow coupling after orchestration extraction)
- Modify: `package.json`

- [ ] **Step 1: Create the workflow branch**

```powershell
git worktree add `
  'C:\Users\30119\.config\superpowers\worktrees\Nexus\template-sync-workflow' `
  -b fix/template-sync-workflow fix/template-export
```

- [ ] **Step 2: Write the failing workflow safety contract**

Create `scripts/test-template-sync-workflow.mjs`. Read `.github/workflows/sync-starter.yml` and make each condition a named `check`:

```js
const checks = [
  ['manual dispatch exists', /workflow_dispatch:/.test(source)],
  ['sync concurrency is serialized', /concurrency:[\s\S]*?group:\s*sync-vorlage[\s\S]*?cancel-in-progress:\s*false/.test(source)],
  ['export command is used', /node scripts\/prepare-template\.mjs/.test(source)],
  ['static export validation runs before push', /node scripts\/validate-template\.mjs --root/.test(source)],
  ['export installs frozen dependencies', /pnpm --dir "?\$EXPORT_DIR"? install --frozen-lockfile/.test(source)],
  ['export runs infra regression', /pnpm --dir "?\$EXPORT_DIR"? test:infra-status/.test(source)],
  ['export runs typecheck', /pnpm --dir "?\$EXPORT_DIR"? typecheck/.test(source)],
  ['Vorlage base is built', /BASE_PATH="?\/Vorlage\/"?[\s\S]*?pnpm --dir "?\$EXPORT_DIR"? build/.test(source)],
  ['built export is validated', /--dist "?\$EXPORT_DIR\/dist"?/.test(source)],
  ['canonical target is cloned', /github\.com\/dieWehmut\/Vorlage\.git/.test(source)],
  ['source freshness is checked', /git ls-remote[\s\S]*?refs\/heads\/main[\s\S]*?GITHUB_SHA/.test(source)],
  ['target push uses an explicit lease', /--force-with-lease=refs\/heads\/main:\$\{?target_sha\}?/.test(source)],
  ['metadata enables template mode', /"is_template":\s*true/.test(source)],
  ['metadata uses the Vorlage homepage', /https:\/\/diewehmut\.github\.io\/Vorlage\//.test(source)],
  ['metadata is read back and asserted', /Repository metadata verified/.test(source)],
  ['metadata errors are not ignored', !/continue-on-error:\s*true/.test(source)],
  ['workflow contains no legacy repository token', !source.toLowerCase().includes(['diesuwa', '-starter'].join(''))],
]
```

Add:

```json
"test:template-sync-workflow": "node scripts/test-template-sync-workflow.mjs"
```

- [ ] **Step 3: Run the workflow test and verify RED**

```powershell
pnpm test:template-sync-workflow
```

Expected: FAIL for manual dispatch, concurrency, exporter usage, validation, freshness, lease, and metadata verification.

- [ ] **Step 4: Replace the inline workflow with orchestration**

Rewrite `.github/workflows/sync-starter.yml` with this order:

```text
on push main + workflow_dispatch
concurrency group sync-vorlage, cancel-in-progress false
checkout full history with persisted credentials disabled
validate STARTER_PUSH_TOKEN
setup pnpm 9 and Node 20 with pnpm cache
pnpm install --frozen-lockfile in source
prepare export into $RUNNER_TEMP/vorlage-export
run static validator
install frozen dependencies in export
run export test:infra-status
run export typecheck
build export with BASE_PATH=/Vorlage/
run validator with --dist
check source main still equals GITHUB_SHA
clone Vorlage and record target_sha
rsync validated export while excluding .git and dist
commit sync: mirror source <full SHA>
push with --force-with-lease=refs/heads/main:${target_sha}
PATCH canonical repository metadata
GET metadata and assert homepage plus is_template
```

The push block must create a new commit on top of the cloned target history. `--force-with-lease` is only a race guard; it must not be paired with a reset to the source repository history.

At the same time, remove the obsolete source-workflow assertions from
`scripts/test-infra-status.mjs`; the source workflow no longer contains the
generated template body. Keep the runtime probe assertions and the source
deployment workflow gate. The generated deploy workflow contract belongs in
`validate-template.mjs` and `test-template-export.mjs`.

Use this freshness check immediately before cloning the target:

```bash
latest_source_sha="$(git ls-remote "https://github.com/${GITHUB_REPOSITORY}.git" refs/heads/main | cut -f1)"
if [ "$latest_source_sha" != "$GITHUB_SHA" ]; then
  echo "Source main advanced from $GITHUB_SHA to $latest_source_sha; refusing stale template sync." >&2
  exit 1
fi
```

Use this metadata assertion after PATCH:

```bash
metadata="$(curl -fsSL \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${STARTER_PUSH_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/dieWehmut/Vorlage)"

METADATA_JSON="$metadata" node --input-type=module <<'NODE'
const metadata = JSON.parse(process.env.METADATA_JSON)
if (metadata.homepage !== 'https://diewehmut.github.io/Vorlage/' || metadata.is_template !== true) {
  console.error('Repository metadata did not converge.', metadata.homepage, metadata.is_template)
  process.exit(1)
}
console.log('Repository metadata verified.')
NODE
```

- [ ] **Step 5: Verify GREEN and commit**

```powershell
pnpm test:template-sync-workflow
pnpm test:template-identity
pnpm test:template-export
pnpm test:infra-status
git add package.json scripts/test-template-sync-workflow.mjs scripts/test-infra-status.mjs .github/workflows/sync-starter.yml
git commit -m "ci(template): validate Vorlage before synchronization"
git push -u origin fix/template-sync-workflow
```

Expected: all tests pass and the workflow branch is available remotely.

### Task 6: Final Local Verification and Review

**Files:**
- Modify only files required by review findings.

- [ ] **Step 1: Run focused regressions**

```powershell
pnpm test:template-identity
pnpm test:infra-integration-scan
pnpm test:template-export
pnpm test:template-sync-workflow
pnpm test:infra-status
pnpm test:site-overview
```

Expected: every command exits 0.

- [ ] **Step 2: Run source typecheck and production build**

```powershell
pnpm typecheck
pnpm build
```

Expected: both commands exit 0. Build warnings already present at baseline are recorded but do not become errors.

- [ ] **Step 3: Re-run the complete template build proof**

Repeat Task 4 Step 5 with a fresh temporary directory. Do not reuse a previous export or build artifact.

Expected: install, infra regression, typecheck, build, and built-output validation all pass in the generated repository itself.

- [ ] **Step 4: Request two-stage review**

Request a spec-compliance review against:

```text
docs/superpowers/specs/2026-08-20-vorlage-template-sync-design.md
```

After all spec findings are fixed and re-reviewed, request code-quality review for the range:

```powershell
git diff origin/main...HEAD
```

Fix every Critical or Important finding, rerun the affected tests, and commit fixes with focused messages.

- [ ] **Step 5: Push reviewed branch state**

```powershell
git push origin fix/template-sync-workflow
```

Expected: remote workflow branch equals the reviewed local HEAD.

### Task 7: Fast-forward Main and Verify Remote Convergence

**Files:**
- No source edits expected.

- [ ] **Step 1: Ensure remote main has not advanced unexpectedly**

```powershell
git fetch origin
git merge-base --is-ancestor origin/main fix/template-sync-workflow
```

Expected: exit 0. If it fails, rebase the stacked branches onto current `origin/main`, rerun Task 6, and push updated branch tips before continuing.

- [ ] **Step 2: Push the reviewed stack to main**

```powershell
git push origin fix/template-sync-workflow:main
```

Expected: a fast-forward update containing the design, plan, identity, export, validation, and workflow commits. The dirty local `main` worktree remains untouched.

- [ ] **Step 3: Monitor source workflows**

Using authenticated GitHub API requests, poll the runs created for the new `main` SHA until all are terminal:

```text
Deploy to GitHub Pages
Sync Starter Template
Sync Capture Assets
```

Expected: all conclude `success`. If Sync Capture creates a follow-up source commit, wait for the corresponding second generation of source workflows and use that final source SHA for parity checks.

- [ ] **Step 4: Verify the template repository commit and content**

```powershell
git ls-remote https://github.com/dieWehmut/Vorlage.git HEAD refs/heads/main
```

Clone the resulting SHA into a temporary directory and run:

```powershell
pnpm install --frozen-lockfile
pnpm test:infra-status
pnpm typecheck
$env:BASE_PATH = '/Vorlage/'
pnpm build
Remove-Item Env:BASE_PATH
```

Expected: all commands pass, the latest commit message contains the final source SHA, no legacy token is present, and generated document paths match the three sample Markdown files.

- [ ] **Step 5: Verify repository metadata and Pages**

Read `https://api.github.com/repos/dieWehmut/Vorlage` with authenticated API access and assert:

```text
homepage == https://diewehmut.github.io/Vorlage/
is_template == true
default_branch == main
```

Then fetch `https://diewehmut.github.io/Vorlage/`. Parse local script and stylesheet URLs, assert they start with `/Vorlage/`, and fetch each one.

Expected: HTML and every referenced local asset return HTTP 200; the page title is `Vorlage`; no active URL or repository metadata references the legacy path.

- [ ] **Step 6: Record completion evidence**

Capture the final source SHA, template SHA, workflow run URLs/IDs, metadata values, Pages HTTP status, asset HTTP statuses, and local verification command results. Only after every item is proven should the active goal be marked complete.
