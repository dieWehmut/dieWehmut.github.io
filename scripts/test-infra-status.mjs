import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const checks = []

function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

async function loadTypeScriptModule(relativePath) {
  const filePath = path.join(root, relativePath)
  if (!fs.existsSync(filePath)) return null
  const source = fs.readFileSync(filePath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
    fileName: filePath,
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const probe = await loadTypeScriptModule('src/composables/urlProbe.ts')
check('pure binary URL probe module exists', Boolean(probe))

if (probe) {
  const directCalls = []
  const directOnline = await probe.probeDirectUrl(
    'https://service.example',
    async (input, init) => {
      directCalls.push([input, init])
      return { ok: false, status: 503 }
    },
  )
  check('resolved opaque request is online', directOnline === 'online')
  check(
    'production request opts out of CORS status reads',
    directCalls.length === 1 && directCalls[0][1]?.mode === 'no-cors',
  )
  check(
    'production request bypasses cached reachability',
    directCalls.length === 1 && directCalls[0][1]?.cache === 'no-store',
  )

  const directOffline = await probe.probeDirectUrl(
    'https://service.example',
    async () => {
      throw new TypeError('network failure')
    },
  )
  check('rejected opaque request is offline', directOffline === 'offline')

  const proxyOnline = await probe.probeProxyUrl(
    'https://service.example/a?b=1',
    async () => ({ ok: true, json: async () => ({ online: true }) }),
  )
  check('positive local proxy result is online', proxyOnline === 'online')

  const proxyOffline = await probe.probeProxyUrl(
    'https://service.example',
    async () => ({ ok: true, json: async () => ({ online: false }) }),
  )
  check('negative local proxy result is offline', proxyOffline === 'offline')

  const proxyFailure = await probe.probeProxyUrl(
    'https://service.example',
    async () => {
      throw new TypeError('proxy unavailable')
    },
  )
  check('failed local proxy request is offline', proxyFailure === 'offline')

  check(
    'probe results contain only online and offline',
    [directOnline, directOffline, proxyOnline, proxyOffline, proxyFailure].every((status) =>
      ['online', 'offline'].includes(status),
    ),
  )

  check('environment-aware probe dispatcher exists', typeof probe.probeUrl === 'function')
  if (typeof probe.probeUrl === 'function') {
    const productionCalls = []
    const productionStatus = await probe.probeUrl('https://production.example', {
      isDev: false,
      fetchImpl: async (input, init) => {
        productionCalls.push([input, init])
        return { ok: true }
      },
    })
    check(
      'production dispatcher selects direct no-cors probing',
      productionStatus === 'online' &&
        productionCalls.length === 1 &&
        productionCalls[0][0] === 'https://production.example' &&
        productionCalls[0][1]?.mode === 'no-cors',
    )

    const developmentCalls = []
    await probe.probeUrl('https://development.example', {
      isDev: true,
      fetchImpl: async (input, init) => {
        developmentCalls.push([input, init])
        return { ok: true, json: async () => ({ online: true }) }
      },
    })
    check(
      'development dispatcher selects the same-origin proxy',
      developmentCalls.length === 1 &&
        String(developmentCalls[0][0]).startsWith('/api/ping?url=') &&
        developmentCalls[0][1]?.mode === undefined,
    )
  }
}

const composablePath = path.join(root, 'src/composables/useUrlStatus.ts')
const composableSource = fs.readFileSync(composablePath, 'utf8')
const probeSource = fs.readFileSync(path.join(root, 'src/composables/urlProbe.ts'), 'utf8')
const binaryTypeLine = probeSource
  .split(/\r?\n/)
  .find((line) => line.includes('export type BinaryUrlStatus'))
check(
  'status type declares exactly two states',
  /export type StatusKind\s*=\s*BinaryUrlStatus/.test(composableSource) &&
    binaryTypeLine?.trim() === "export type BinaryUrlStatus = 'online' | 'offline'" &&
    !/checking|latency|httpStatus/.test(`${composableSource}\n${probeSource}`),
)

const infraViewSource = fs.readFileSync(path.join(root, 'src/views/InfraView.vue'), 'utf8')
check('Infra view never renders unknown', !/unknown/i.test(infraViewSource))
check(
  'offline count completes the binary endpoint total',
  /offlineCount\s*=\s*computed\(\(\)\s*=>\s*totalCount\.value\s*-\s*onlineCount\.value\)/.test(
    infraViewSource,
  ),
)

const removedComposable = path.join(root, 'src/composables', `use${'Ku' + 'ma'}Status.ts`)
check('status-page integration composable is removed', !fs.existsSync(removedComposable))

const trackedPaths = execFileSync(
  'git',
  ['ls-files'],
  { cwd: root, encoding: 'utf8' },
)
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => fs.existsSync(path.join(root, file)))

const forbiddenProduct = ['ku', 'ma'].join('')
const forbiddenPathMatches = trackedPaths.filter((file) =>
  file.toLowerCase().includes(forbiddenProduct),
)
const trackedTextFiles = trackedPaths
  .filter((file) => /\.(?:ts|tsx|vue|mjs|js|json|ya?ml|md)$/.test(file))
  .filter((file) => file !== 'scripts/test-infra-status.mjs')

const forbiddenContentMatches = trackedTextFiles.filter((file) => {
  const content = fs.readFileSync(path.join(root, file), 'utf8')
  return content.toLowerCase().includes(forbiddenProduct)
})
check(
  'tracked application and starter files contain no status-page product integration',
  forbiddenPathMatches.length === 0 && forbiddenContentMatches.length === 0,
)

const starterSyncPath = path.join(root, '.github/workflows/sync-starter.yml')
if (fs.existsSync(starterSyncPath)) {
  const starterSyncSource = fs.readFileSync(starterSyncPath, 'utf8')
  check(
    'starter repository description advertises binary reachability',
    /binary infrastructure reachability dashboard/i.test(starterSyncSource) &&
      !/server uptime monitoring/i.test(starterSyncSource),
  )
  check(
    'generated starter deployment enforces the Infra status regression',
    /Verify Infra status probing[\s\S]*?pnpm test:infra-status/.test(starterSyncSource),
  )
}

const deploySource = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8')
check(
  'GitHub Pages deployment enforces the Infra status regression',
  /pnpm (?:run )?test:infra-status/.test(deploySource),
)

const pingProxySource = fs
  .readFileSync(path.join(root, 'vite.config.ts'), 'utf8')
  .match(/function pingProxy\(\): Plugin \{[\s\S]*?\r?\n\}\r?\n\r?\nexport default/)?.[0] ?? ''
check(
  'local ping proxy returns no latency or upstream HTTP status detail',
  Boolean(pingProxySource) && !/latency|status:\s*upstream/.test(pingProxySource),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
