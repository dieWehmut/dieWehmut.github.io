import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

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
  'scripts/smoke-sandkasten-doc.mjs',
  'scripts/template-identity.mjs',
  'scripts/prepare-template.mjs',
  'scripts/validate-template.mjs',
  'scripts/test-infra-integration-scan.mjs',
  'scripts/test-markdown-render.mjs',
  'scripts/test-vocabulary-audio.mjs',
  'scripts/test-console-avatar.mjs',
  'scripts/test-template-export.mjs',
  'scripts/test-template-identity.mjs',
  'scripts/test-template-sync-workflow.mjs',
]

function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) continue
    const key = argument.slice(2)
    values[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true
  }
  return values
}

function canonicalPath(value) {
  const resolved = path.resolve(value)
  try {
    return fs.realpathSync.native(resolved).replace(/[\\/]+$/, '').toLowerCase()
  } catch {
    const parent = path.dirname(resolved)
    try {
      return path.join(fs.realpathSync.native(parent), path.basename(resolved)).replace(/[\\/]+$/, '').toLowerCase()
    } catch {
      return resolved.replace(/[\\/]+$/, '').toLowerCase()
    }
  }
}

function isWithin(candidate, parent) {
  return candidate === parent || candidate.startsWith(`${parent}${path.sep}`)
}

function assertSeparatedRoots(sourceRoot, outputRoot) {
  const source = canonicalPath(sourceRoot)
  const output = canonicalPath(outputRoot)
  if (isWithin(output, source) || isWithin(source, output)) {
    throw new Error('Template output must be outside the source repository')
  }
}

function copyRevisionFiles(sourceRoot, outputRoot, sourceSha) {
  const archivePath = path.join(
    os.tmpdir(),
    `vorlage-source-${process.pid}-${Math.random().toString(36).slice(2)}.tar`,
  )
  fs.rmSync(outputRoot, { recursive: true, force: true })
  fs.mkdirSync(outputRoot, { recursive: true })
  try {
    execFileSync(
      'git',
      ['-C', sourceRoot, 'archive', '--format=tar', '--output', archivePath, sourceSha],
      { stdio: 'pipe' },
    )
    execFileSync('tar', ['-xf', archivePath, '-C', outputRoot], { stdio: 'pipe' })
  } finally {
    fs.rmSync(archivePath, { force: true })
  }
}

function removePath(root, relative) {
  fs.rmSync(path.join(root, relative), { recursive: true, force: true })
}

function writeText(root, relative, content) {
  const destination = path.join(root, relative)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
}

function writeJson(root, relative, value) {
  writeText(root, relative, JSON.stringify(value, null, 2))
}

function rewritePackageMetadata(outputRoot, templateIdentity) {
  const packagePath = path.join(outputRoot, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  packageJson.name = templateIdentity.packageName
  const removedScripts = new Set([
    'test:markdown-render',
    'test:console-avatar',
    'test:console',
    'runner:smoke:docs',
  ])
  for (const scriptName of Object.keys(packageJson.scripts || {})) {
    if (
      removedScripts.has(scriptName) ||
      scriptName === 'assets:push' ||
      scriptName === 'template:prepare' ||
      scriptName === 'template:validate' ||
      scriptName.startsWith('test:template-') ||
      scriptName.startsWith('test:sync-') ||
      scriptName === 'test:infra-integration-scan'
    ) {
      delete packageJson.scripts[scriptName]
    }
  }
  writeJson(outputRoot, 'package.json', packageJson)

  const packageLockPath = path.join(outputRoot, 'package-lock.json')
  if (!fs.existsSync(packageLockPath)) return
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'))
  packageLock.name = templateIdentity.packageName
  if (packageLock.packages?.['']) packageLock.packages[''].name = templateIdentity.packageName
  writeJson(outputRoot, 'package-lock.json', packageLock)
}

function installTemplateReadmes(outputRoot) {
  const siteRoot = path.join(outputRoot, 'src', 'data', 'site')
  const translations = [
    ['starter-readme.en.md', 'README.en.md'],
    ['starter-readme.ja.md', 'README.ja.md'],
    ['starter-readme.zh-TW.md', 'README.zh-TW.md'],
  ].map(([source, destination]) => [
    destination,
    fs.readFileSync(path.join(siteRoot, source), 'utf8'),
  ])
  const rootReadme = fs.readFileSync(path.join(siteRoot, 'starter-readme.md'), 'utf8')
  fs.rmSync(path.join(outputRoot, 'docs'), { recursive: true, force: true })
  fs.mkdirSync(path.join(outputRoot, 'docs'), { recursive: true })
  for (const [destination, content] of translations) {
    writeText(outputRoot, `docs/${destination}`, content)
  }
  writeText(outputRoot, 'README.md', rootReadme)
}

function removeStarterReadmes(outputRoot) {
  const siteRoot = path.join(outputRoot, 'src', 'data', 'site')
  for (const file of fs.readdirSync(siteRoot)) {
    if (file.startsWith('starter-readme') && file.endsWith('.md')) {
      removePath(outputRoot, `src/data/site/${file}`)
    }
  }
}

function promoteStarterConfig(outputRoot) {
  const siteRoot = path.join(outputRoot, 'src', 'data', 'site')
  fs.copyFileSync(path.join(siteRoot, 'config.starter.ts'), path.join(siteRoot, 'config.ts'))
  fs.rmSync(path.join(siteRoot, 'config.starter.ts'), { force: true })
}

function rewriteTemplateGitignore(outputRoot) {
  const gitignorePath = path.join(outputRoot, '.gitignore')
  const source = fs.readFileSync(gitignorePath, 'utf8')
  const lines = source
    .split(/\r?\n/)
    .filter((line) => line.trim() !== 'docs')
  writeText(outputRoot, '.gitignore', lines.join('\n'))
}

function writeSampleSiteData(outputRoot, templateIdentity) {
  writeText(
    outputRoot,
    'src/data/site/about.md',
    `## About This Site

This site is built with the [${templateIdentity.repositoryName}](${templateIdentity.repositoryUrl}) template.

- Template demo: [${templateIdentity.pagesUrl}](${templateIdentity.pagesUrl})
- Production demo: [https://diewehmut.github.io/](https://diewehmut.github.io/)

Replace this page with your own profile and project information.`,
  )
  writeText(
    outputRoot,
    'src/data/site/friends.ts',
    `import type { FriendLink } from '../../types/content'

export const friends: FriendLink[] = [
  {
    id: 'template-author',
    name: 'dieWehmut',
    description: '${templateIdentity.repositoryName} template author',
    url: 'https://diewehmut.github.io/',
    avatar: 'https://avatars.githubusercontent.com/dieWehmut',
  },
]

export default friends`,
  )
  for (const [relative, exportName, label] of [
    ['app.ts', 'apps', 'Apps'],
    ['game.ts', 'games', 'Games'],
  ]) {
    writeText(
      outputRoot,
      `src/data/site/${relative}`,
      `import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'

export const ${exportName} = ref<SiteProjectGroup[]>([
  {
    name: '${label}',
    autoLoad: true,
    description: 'Static ${label.toLowerCase()} list',
    manualItems: [],
  },
])

export default ${exportName}`,
    )
  }
  writeText(
    outputRoot,
    'src/data/site/infra.ts',
    `import { ref } from 'vue'
import type { InfraEntry } from '../../types/content'

const initialInfra: InfraEntry[] = [
  { name: 'Template Demo', key: 'template-demo', url: '${templateIdentity.pagesUrl}', date: '2026-05-01' },
  { name: 'GitHub', key: 'github', url: 'https://github.com', date: '2026-05-01' },
]

initialInfra.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

export const infra = ref(initialInfra)

export default infra`,
  )
  writeText(
    outputRoot,
    'src/data/site/page.ts',
    `import { ref } from 'vue'
import type { WebsiteEntry } from '../../types/content'

export const pages = ref<WebsiteEntry[]>([
  {
    name: '${templateIdentity.repositoryName}',
    displayName: '${templateIdentity.repositoryName}',
    repoUrl: '${templateIdentity.repositoryUrl}',
    date: '2026-05-01',
    url: '${templateIdentity.pagesUrl}',
  },
])

export default pages`,
  )
  writeText(
    outputRoot,
    'src/data/site/tool.ts',
    `import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'
import { siteConfig } from './config'

export const tools = ref<SiteProjectGroup[]>([
  {
    name: 'Tools',
    autoLoad: true,
    owner: siteConfig.githubUser,
    repo: '',
    description: 'Static tools list',
    manualItems: [],
  },
])

export default tools`,
  )
}

function replaceLegacyTemplateIdentity(value, templateIdentity) {
  const legacyRepository = ['diesuwa', 'starter'].join('-')
  const legacyBadge = ['diesuwa', '', 'starter'].join('-')
  const replacements = [
    [
      `https://diewehmut.github.io/${legacyRepository}/`,
      templateIdentity.pagesUrl,
    ],
    [`https://github.com/dieWehmut/${legacyRepository}`, templateIdentity.repositoryUrl],
    [`/${legacyRepository}/`, templateIdentity.pagesBase],
    [legacyBadge, templateIdentity.repositoryName],
    [legacyRepository, templateIdentity.repositoryName],
  ]
  return replacements.reduce(
    (result, [source, replacement]) =>
      result.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement),
    value,
  )
}

function writeSampleDocs(outputRoot, sourceRoot, sourceSha, sourceUpdated, templateIdentity) {
  const docsRoot = path.join(outputRoot, 'src', 'data', 'docs')
  fs.rmSync(path.join(docsRoot, 'notes'), { recursive: true, force: true })
  fs.rmSync(path.join(docsRoot, 'posts'), { recursive: true, force: true })
  writeText(
    outputRoot,
    'src/data/docs/posts/hello-world.md',
    `---
title: Hello World
date: 2026-05-01
tags: [intro, welcome]
---

# Hello World

Welcome to your new ${templateIdentity.repositoryName} site. Edit or replace this post to get started.

This template supports GitHub-flavored Markdown, syntax-highlighted code, links, tables, task lists, and KaTeX math.

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`)
}
\`\`\``,
  )

  const log = execFileSync(
    'git',
    ['-C', sourceRoot, 'log', sourceSha, '--date=iso-strict', '--pretty=format:- %h %cI - %s'],
    { encoding: 'utf8' },
  )
  const sanitizedLog = replaceLegacyTemplateIdentity(log, templateIdentity)
  writeText(
    outputRoot,
    'src/data/docs/posts/development-log.md',
    `---
title: Development Log
date: ${sourceUpdated}
tags: [devlog, commit]
---

# Development Log

Generated from source commit \`${sourceSha}\`.

${sanitizedLog}`,
  )
  writeText(
    outputRoot,
    'src/data/docs/notes/sample-note.md',
    `---
title: Sample Note
date: 2026-05-01
tags: [note]
type: note
---

This is a sample note. Replace it with your own content.`,
  )
}

function writeEmptyCaptureData(outputRoot) {
  writeJson(outputRoot, 'src/data/capture/manifest.json', [])
  writeText(
    outputRoot,
    'src/data/capture/generated.ts',
    `import type { CaptureAsset } from '../../types/content'

export const generatedCaptureAssets: CaptureAsset[] = [] as CaptureAsset[]

export default generatedCaptureAssets`,
  )
  removePath(outputRoot, 'public/capture-assets')
}

function writeTemplateDeployWorkflow(outputRoot) {
  const workflow = [
    'name: Deploy to GitHub Pages',
    '',
    'on:',
    '  push:',
    '    branches: [main]',
    '  workflow_dispatch:',
    '',
    'permissions:',
    '  contents: read',
    '  pages: write',
    '  id-token: write',
    '',
    'concurrency:',
    '  group: pages',
    '  cancel-in-progress: true',
    '',
    'jobs:',
    '  build-and-deploy:',
    '    runs-on: ubuntu-latest',
    '    env:',
    '      VITE_CODE_RUNNER_API_URL: ${{ vars.VITE_CODE_RUNNER_API_URL }}',
    '      VITE_CODE_RUNNER_API_TOKEN: ${{ vars.VITE_CODE_RUNNER_API_TOKEN }}',
    '      VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}',
    '    environment:',
    '      name: github-pages',
    '    steps:',
    '      - name: Checkout',
    '        uses: actions/checkout@v4',
    '      - name: Setup pnpm',
    '        uses: pnpm/action-setup@v4',
    '        with:',
    '          version: 9',
    '      - name: Setup Node.js',
    '        uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 20',
    '          cache: pnpm',
    '      - name: Install dependencies',
    '        run: pnpm install --frozen-lockfile',
    '      - name: Verify Infra status probing',
    '        run: pnpm test:infra-status',
    '      - name: Build',
    '        shell: bash',
    '        run: |',
    '          repo_name="${GITHUB_REPOSITORY#*/}"',
    '          if [ "$repo_name" = "${GITHUB_REPOSITORY_OWNER}.github.io" ]; then',
    '            export BASE_PATH="/"',
    '          else',
    '            export BASE_PATH="/${repo_name}/"',
    '          fi',
    '          pnpm run build',
    '      - name: Setup Pages',
    '        uses: actions/configure-pages@v4',
    '      - name: Upload artifact',
    '        uses: actions/upload-pages-artifact@v3',
    '        with:',
    '          path: dist',
    '      - name: Deploy to GitHub Pages',
    '        id: deploy',
    '        uses: actions/deploy-pages@v4',
    '',
  ].join('\n')
  writeText(outputRoot, '.github/workflows/deploy.yml', workflow)
}

function rewriteHtmlTitle(outputRoot, templateIdentity) {
  const htmlPath = path.join(outputRoot, 'index.html')
  let html = fs.readFileSync(htmlPath, 'utf8').replace(
    /<title>[^<]*<\/title>/i,
    `<title>${templateIdentity.repositoryName}</title>`,
  )
  html = html.replace(/\s*<link\s+rel=["']icon["'][^>]*>/i, '')
  writeText(outputRoot, 'index.html', html)
}

function removeSourceOnlyFiles(outputRoot) {
  for (const relative of sourceOnlyPaths) {
    if (relative === 'docs') continue
    removePath(outputRoot, relative)
  }
}

function getSourceUpdated(sourceRoot, sourceSha) {
  return execFileSync(
    'git',
    ['-C', sourceRoot, 'show', '-s', '--format=%ad', '--date=format:%Y/%m/%d %H:%M', sourceSha],
    { encoding: 'utf8' },
  ).trim()
}

function writeSourceMarker(outputRoot, sourceSha, sourceUpdated, templateIdentity) {
  writeJson(outputRoot, '.template-source.json', {
    sourceSha,
    sourceUpdated,
    repository: templateIdentity.repository,
  })
}

function regenerateDocumentMetadata(outputRoot, sourceRoot) {
  execFileSync(process.execPath, [path.join(outputRoot, 'scripts/generate-docs-data.mjs')], {
    cwd: outputRoot,
    env: {
      ...process.env,
      PROJECT_ROOT: outputRoot,
      DOCS_ROOT: path.join(outputRoot, 'src', 'data', 'docs'),
      GIT_ROOT: sourceRoot,
    },
    stdio: 'inherit',
  })
}

export async function prepareTemplate({ sourceRoot, outputRoot, sourceSha }) {
  const source = path.resolve(sourceRoot)
  const output = path.resolve(outputRoot)
  assertSeparatedRoots(source, output)

  const requestedSha = sourceSha || execFileSync(
    'git',
    ['-C', source, 'rev-parse', 'HEAD'],
    { encoding: 'utf8' },
  ).trim()
  const resolvedSha = execFileSync(
    'git',
    ['-C', source, 'rev-parse', `${requestedSha}^{commit}`],
    { encoding: 'utf8' },
  ).trim()
  const sourceUpdated = getSourceUpdated(source, resolvedSha)

  copyRevisionFiles(source, output, resolvedSha)
  const templateIdentity = Object.freeze(
    JSON.parse(fs.readFileSync(path.join(output, 'src/data/site/template-identity.json'), 'utf8')),
  )
  installTemplateReadmes(output)
  removeSourceOnlyFiles(output)
  rewriteTemplateGitignore(output)
  rewritePackageMetadata(output, templateIdentity)
  promoteStarterConfig(output)
  writeSampleSiteData(output, templateIdentity)
  writeSampleDocs(output, source, resolvedSha, sourceUpdated, templateIdentity)
  writeEmptyCaptureData(output)
  writeTemplateDeployWorkflow(output)
  rewriteHtmlTitle(output, templateIdentity)
  writeSourceMarker(output, resolvedSha, sourceUpdated, templateIdentity)
  regenerateDocumentMetadata(output, source)
  removeStarterReadmes(output)

  return { outputRoot: output, sourceSha: resolvedSha, templateIdentity }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceRoot = args['source-root'] || process.cwd()
  const outputRoot = args.output || fs.mkdtempSync(path.join(os.tmpdir(), 'vorlage-template-'))
  await prepareTemplate({ sourceRoot, outputRoot, sourceSha: args['source-sha'] })
  console.log(`Prepared template at ${path.resolve(outputRoot)}`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : error)
    process.exitCode = 1
  })
}
