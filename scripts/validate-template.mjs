import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const textPattern = /\.(?:html|json|md|mjs|js|ts|tsx|vue|ya?ml|css)$/i
const legacyRepository = ['diesuwa', 'starter'].join('-')
const legacyBadge = ['diesuwa', '', 'starter'].join('-')
const canonicalIdentity = Object.freeze({
  owner: 'dieWehmut',
  repositoryName: 'Vorlage',
  packageName: 'vorlage',
  repository: 'dieWehmut/Vorlage',
  repositoryUrl: 'https://github.com/dieWehmut/Vorlage',
  pagesUrl: 'https://diewehmut.github.io/Vorlage/',
  pagesBase: '/Vorlage/',
})

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

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') return []
    const absolute = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(absolute) : [absolute]
  })
}

function readText(root, relative) {
  const filePath = path.join(root, relative)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function isLocalAssetReference(value) {
  return Boolean(value) && !/^(?:[a-z]+:)?\/\//i.test(value) && !/^(?:data:|#|mailto:|javascript:)/i.test(value)
}

function checkDistAssets(distRoot, pagesBase, check) {
  if (!distRoot) return
  const pagesPrefix = pagesBase.endsWith('/') ? pagesBase : `${pagesBase}/`
  const pagesRoot = pagesPrefix.slice(0, -1)
  const distPath = path.resolve(distRoot)
  for (const htmlName of ['index.html', '404.html']) {
    const htmlPath = path.join(distRoot, htmlName)
    const source = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : ''
    check(`built ${htmlName} exists`, Boolean(source))
    const references = [...source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
      .map((match) => match[1].trim())
      .filter(isLocalAssetReference)

    for (const reference of references) {
      const withoutFragment = reference.split(/[?#]/, 1)[0]
      if (!withoutFragment) continue
      const normalized = withoutFragment.replaceAll('\\', '/')
      const usesPagesBase = normalized === pagesRoot || normalized.startsWith(pagesPrefix)
      check(`${htmlName} asset uses ${pagesPrefix}: ${reference}`, usesPagesBase)
      if (!usesPagesBase) continue
      const relative = normalized.slice(pagesPrefix.length)
      const assetPath = relative ? path.resolve(distRoot, relative) : path.resolve(distRoot, 'index.html')
      check(
        `${htmlName} asset exists: ${reference}`,
        (assetPath === distPath || assetPath.startsWith(`${distPath}${path.sep}`)) && fs.existsSync(assetPath),
      )
    }
  }
}

export function validateTemplate({ root, distRoot } = {}) {
  const projectRoot = path.resolve(root || process.cwd())
  const failures = []
  const checks = []
  const identityPath = path.join(projectRoot, 'src', 'data', 'site', 'template-identity.json')
  const identity = fs.existsSync(identityPath) ? JSON.parse(fs.readFileSync(identityPath, 'utf8')) : {}

  function check(label, condition) {
    const ok = Boolean(condition)
    checks.push([label, ok])
    if (!ok) failures.push(label)
  }

  const packagePath = path.join(projectRoot, 'package.json')
  const lockPath = path.join(projectRoot, 'package-lock.json')
  let packageJson = {}
  let packageLock = {}
  try {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  } catch {
    packageJson = {}
  }
  try {
    packageLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
  } catch {
    packageLock = {}
  }

  check('template identity JSON exists', fs.existsSync(identityPath))
  for (const [key, value] of Object.entries(canonicalIdentity)) {
    check(`canonical identity ${key}`, identity[key] === value)
  }
  check('package name is vorlage', packageJson.name === canonicalIdentity.packageName)
  check('lockfile name is vorlage', packageLock.name === canonicalIdentity.packageName && packageLock.packages?.['']?.name === canonicalIdentity.packageName)
  check('template validation script is not exported', !packageJson.scripts?.['template:prepare'] && !packageJson.scripts?.['template:validate'])

  const textFiles = walk(projectRoot).filter((file) => textPattern.test(file))
  const legacyMatches = textFiles.filter((file) => {
    const content = fs.readFileSync(file, 'utf8').toLowerCase()
    return content.includes(legacyRepository) || content.includes(legacyBadge)
  })
  check('export contains no legacy repository token', legacyMatches.length === 0)

  const repoUrlRequirements = {
    'README.md': [canonicalIdentity.repositoryUrl],
    'src/data/site/config.ts': [canonicalIdentity.repositoryUrl, 'templateIdentity.repositoryUrl'],
    'src/data/site/about.md': [canonicalIdentity.repositoryUrl],
    'src/data/site/page.ts': [canonicalIdentity.repositoryUrl],
    'src/data/site/infra.ts': [canonicalIdentity.pagesUrl],
    'src/data/site/template.ts': [canonicalIdentity.repositoryUrl, 'templateIdentity.repositoryUrl'],
  }
  for (const [relative, alternatives] of Object.entries(repoUrlRequirements)) {
    const source = readText(projectRoot, relative)
    check(`canonical repository URL in ${relative}`, alternatives.some((value) => source.includes(value)))
  }
  for (const relative of ['README.md', 'src/data/site/about.md', 'src/data/site/page.ts', 'src/data/site/infra.ts']) {
    check(`canonical Pages URL in ${relative}`, readText(projectRoot, relative).includes(canonicalIdentity.pagesUrl))
  }

  const absentPaths = [
    '.claude',
    '.githooks',
    'CAPTURE.md',
    'prompt',
    'sample',
    '.github/workflows/sync-starter.yml',
    '.github/workflows/sync-capture.yml',
    'src/data/site/config.starter.ts',
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
    'docs/superpowers',
  ]
  for (const relative of absentPaths) check(`source-only path absent: ${relative}`, !fs.existsSync(path.join(projectRoot, relative)))

  const translatedReadmes = ['README.en.md', 'README.ja.md', 'README.zh-TW.md']
  const exportedDocs = fs.existsSync(path.join(projectRoot, 'docs'))
    ? fs.readdirSync(path.join(projectRoot, 'docs')).sort()
    : []
  check('only translated README files exported under docs', JSON.stringify(exportedDocs) === JSON.stringify([...translatedReadmes].sort()))
  for (const relative of translatedReadmes) {
    const source = readText(projectRoot, `docs/${relative}`)
    check(`translated README exists: ${relative}`, Boolean(source))
    check(`translated README uses canonical repository: ${relative}`, source.includes(canonicalIdentity.repositoryUrl))
    check(`translated README uses canonical Pages URL: ${relative}`, source.includes(canonicalIdentity.pagesUrl))
    check(`translated README documents Infra probe: ${relative}`, source.includes('VITE_INFRA_PROBE_URL') && source.includes('HTTP') && source.includes('`200`') && source.includes('SSRF'))
  }

  const docsRoot = path.join(projectRoot, 'src', 'data', 'docs')
  const markdownPaths = walk(docsRoot)
    .filter((file) => file.toLowerCase().endsWith('.md'))
    .map((file) => `./${path.relative(docsRoot, file).replaceAll('\\', '/')}`)
    .sort()
  const expectedMarkdownPaths = [
    './notes/sample-note.md',
    './posts/development-log.md',
    './posts/hello-world.md',
  ]
  check('only sample Markdown files exported', JSON.stringify(markdownPaths) === JSON.stringify(expectedMarkdownPaths))
  const generatedSource = readText(projectRoot, 'src/data/docs/generated.ts')
  const generatedPaths = [...generatedSource.matchAll(/"path":\s*"([^"]+)"/g)]
    .map((match) => match[1])
    .sort()
  check('generated document paths match Markdown files', JSON.stringify(generatedPaths) === JSON.stringify(markdownPaths))
  check('generated document paths are unique', new Set(generatedPaths).size === generatedPaths.length)
  check('generated document paths exist', generatedPaths.every((relative) => fs.existsSync(path.join(docsRoot, relative.slice(2)))))

  const markerPath = path.join(projectRoot, '.template-source.json')
  let marker = {}
  try {
    marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'))
  } catch {
    marker = {}
  }
  check('source marker has full SHA', /^[0-9a-f]{40}$/i.test(marker.sourceSha || ''))
  check('source marker has deterministic timestamp', /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(marker.sourceUpdated || ''))
  check('source marker has canonical repository', marker.repository === canonicalIdentity.repository)

  const deploySource = readText(projectRoot, '.github/workflows/deploy.yml')
  check('deploy workflow runs Infra status regression', /pnpm (?:run )?test:infra-status/.test(deploySource))
  check('deploy workflow exposes the Infra probe setting', /VITE_INFRA_PROBE_URL:\s*\$\{\{ vars\.VITE_INFRA_PROBE_URL \|\| secrets\.API_PROXY_BASE \}\}/.test(deploySource))
  check(
    'deploy workflow derives BASE_PATH from repository',
    /repo_name="\$\{GITHUB_REPOSITORY#\*\/\}"/.test(deploySource) &&
      /if \[ "\$repo_name" = "\$\{GITHUB_REPOSITORY_OWNER\}\.github\.io" \]/.test(deploySource) &&
      /export BASE_PATH="\/\$\{repo_name\}\/"/.test(deploySource) &&
      /pnpm run build/.test(deploySource),
  )
  check('deploy workflow has no escaped expressions', !deploySource.includes('\\${') && !deploySource.includes('\\$'))

  const indexSource = readText(projectRoot, 'index.html')
  check('template index title is Vorlage', /<title>Vorlage<\/title>/i.test(indexSource))
  check('README documents automatic Pages base and Infra probe', readText(projectRoot, 'README.md').includes('GITHUB_REPOSITORY') && readText(projectRoot, 'README.md').includes('VITE_INFRA_PROBE_URL') && readText(projectRoot, 'README.md').includes('HTTP') && readText(projectRoot, 'README.md').includes('`200`') && readText(projectRoot, 'README.md').includes('SSRF') && !readText(projectRoot, 'README.md').includes("const base = '/Vorlage/'"))

  checkDistAssets(distRoot && path.resolve(distRoot), canonicalIdentity.pagesBase, check)

  for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
  return { checks, failures, ok: failures.length === 0 }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const result = validateTemplate({ root: args.root || process.cwd(), distRoot: args.dist })
  if (!result.ok) process.exitCode = 1
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) main()
