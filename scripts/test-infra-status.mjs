import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import {
  findForbiddenIntegrationReferences,
  listProjectFiles,
} from './infra-integration-scan.mjs'

const rootFlag = process.argv.indexOf('--root')
const requestedRoot = rootFlag === -1 ? process.env.INFRA_STATUS_ROOT : process.argv[rootFlag + 1]
const root = requestedRoot
  ? path.resolve(requestedRoot)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
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
      return { ok: true, status: 200 }
    },
  )
  check('HTTP 200 response is online', directOnline === 'online')
  check(
    'production request reads the HTTP status',
    directCalls.length === 1 && directCalls[0][1]?.mode === undefined,
  )
  check(
    'production request bypasses cached reachability',
    directCalls.length === 1 && directCalls[0][1]?.cache === 'no-store',
  )

  const nonOkStatuses = [0, 201, 204, 301, 400, 404, 500, 503]
  const nonOkResults = await Promise.all(
    nonOkStatuses.map((status) =>
      probe.probeDirectUrl(
        `https://service.example/status/${status}`,
        async () => ({ ok: status >= 200 && status < 300, status }),
      ),
    ),
  )
  check(
    'every HTTP status except 200 is offline',
    nonOkResults.every((status) => status === 'offline'),
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
    async () => ({ ok: true, status: 200, json: async () => ({ online: true }) }),
  )
  check('positive local proxy result is online', proxyOnline === 'online')

  const proxyNonOk = await probe.probeProxyUrl(
    'https://service.example/status/503',
    async () => ({ ok: true, status: 200, json: async () => ({ online: false }) }),
  )
  check('local proxy marks a non-200 upstream response offline', proxyNonOk === 'offline')

  const proxyHttpNonOk = await probe.probeProxyUrl(
    'https://service.example/status/201',
    async () => ({ ok: true, status: 201, json: async () => ({ online: true }) }),
  )
  check('local proxy requires exact HTTP 200', proxyHttpNonOk === 'offline')

  const proxyOffline = await probe.probeProxyUrl(
    'https://service.example',
    async () => ({ ok: true, status: 200, json: async () => ({ online: false }) }),
  )
  check('negative local proxy result is offline', proxyOffline === 'offline')

  const proxyFailure = await probe.probeProxyUrl(
    'https://service.example',
    async () => {
      throw new TypeError('proxy unavailable')
    },
  )
  check('failed local proxy request is offline', proxyFailure === 'offline')

  const remoteProxyCalls = []
  const remoteProxyOnline = await probe.probeRemoteProxyUrl(
    'https://service.example/a?b=1',
    '  https://probe.example///  ',
    async (input, init) => {
      remoteProxyCalls.push([input, init])
      return { ok: true, status: 200, json: async () => ({ online: true }) }
    },
  )
  check(
    'remote proxy normalizes its base URL',
    remoteProxyOnline === 'online' &&
      remoteProxyCalls.length === 1 &&
      remoteProxyCalls[0][0] === 'https://probe.example/api/ping?url=' + encodeURIComponent('https://service.example/a?b=1'),
  )

  const remoteProxyStatuses = [201, 204, 301, 400, 404, 500, 503]
  const remoteProxyNonOkResults = await Promise.all(
    remoteProxyStatuses.map((status) =>
      probe.probeRemoteProxyUrl(
        `https://service.example/status/${status}`,
        'https://probe.example',
        async () => ({ ok: true, status, json: async () => ({ online: true }) }),
      ),
    ),
  )
  check(
    'remote proxy requires exact HTTP 200',
    remoteProxyNonOkResults.every((status) => status === 'offline'),
  )

  const emptyRemoteProxy = await probe.probeRemoteProxyUrl(
    'https://service.example',
    '   ',
    async () => ({ ok: true, status: 200, json: async () => ({ online: true }) }),
  )
  check('empty remote proxy base is offline', emptyRemoteProxy === 'offline')

  check(
    'probe results contain only online and offline',
    [directOnline, ...nonOkResults, directOffline, proxyOnline, proxyNonOk, proxyHttpNonOk, proxyOffline, proxyFailure].every((status) =>
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
        return { ok: true, status: 200 }
      },
    })
    check(
      'production dispatcher selects direct strict-status probing',
      productionStatus === 'online' &&
        productionCalls.length === 1 &&
        productionCalls[0][0] === 'https://production.example' &&
        productionCalls[0][1]?.mode === undefined,
    )

    const productionFailureStatus = await probe.probeUrl('https://production.example/failure', {
      isDev: false,
      fetchImpl: async () => ({ ok: false, status: 503 }),
    })
    check('production dispatcher marks HTTP 503 offline', productionFailureStatus === 'offline')

    const productionProxyCalls = []
    const productionProxyStatus = await probe.probeUrl('https://production.example', {
      isDev: false,
      proxyBase: 'https://probe.example///',
      fetchImpl: async (input, init) => {
        productionProxyCalls.push([input, init])
        return { ok: true, status: 200, json: async () => ({ online: true }) }
      },
    })
    check(
      'production dispatcher selects the configured remote proxy',
      productionProxyStatus === 'online' &&
        productionProxyCalls.length === 1 &&
        productionProxyCalls[0][0] === 'https://probe.example/api/ping?url=' + encodeURIComponent('https://production.example'),
    )

    const developmentCalls = []
    const developmentStatus = await probe.probeUrl('https://development.example', {
      isDev: true,
      fetchImpl: async (input, init) => {
        developmentCalls.push([input, init])
        return { ok: true, status: 200, json: async () => ({ online: true }) }
      },
    })
    check(
      'development dispatcher selects the same-origin proxy',
      developmentStatus === 'online' &&
        developmentCalls.length === 1 &&
        String(developmentCalls[0][0]).startsWith('/api/ping?url=') &&
        developmentCalls[0][1]?.mode === undefined,
    )

    const whitespaceProxyCalls = []
    const whitespaceProxyStatus = await probe.probeUrl('https://production.example/direct', {
      isDev: false,
      proxyBase: '   ',
      fetchImpl: async (input, init) => {
        whitespaceProxyCalls.push([input, init])
        return { ok: true, status: 200 }
      },
    })
    check(
      'blank production proxy setting falls back to direct probing',
      whitespaceProxyStatus === 'online' &&
        whitespaceProxyCalls.length === 1 &&
        whitespaceProxyCalls[0][0] === 'https://production.example/direct',
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
check(
  'status composable passes the production proxy setting',
  /proxyBase:\s*import\.meta\.env\.VITE_INFRA_PROBE_URL/.test(composableSource),
)
const envSource = fs.readFileSync(path.join(root, 'src/vite-env.d.ts'), 'utf8')
check('Vite env declares the Infra proxy setting', /VITE_INFRA_PROBE_URL\?:\s*string/.test(envSource))

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

const trackedPaths = listProjectFiles(root)
const forbiddenReferences = findForbiddenIntegrationReferences(root, trackedPaths)
check(
  'tracked application and starter files contain no status-page product integration',
  forbiddenReferences.pathMatches.length === 0 && forbiddenReferences.contentMatches.length === 0,
)

const deploySource = fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8')
check(
  'GitHub Pages deployment enforces the Infra status regression',
  /pnpm (?:run )?test:infra-status/.test(deploySource),
)
check(
  'GitHub Pages deployment injects the Infra proxy setting',
  /VITE_INFRA_PROBE_URL:\s*\$\{\{ vars\.VITE_INFRA_PROBE_URL \|\| secrets\.API_PROXY_BASE \}\}/.test(deploySource),
)

const sourceStarterReadmePath = 'src/data/site/starter-readme.md'
const infraReadmePaths = fs.existsSync(path.join(root, sourceStarterReadmePath))
  ? [
      'README.md',
      sourceStarterReadmePath,
      'src/data/site/starter-readme.en.md',
      'src/data/site/starter-readme.ja.md',
      'src/data/site/starter-readme.zh-TW.md',
    ]
  : [
      'README.md',
      'docs/README.en.md',
      'docs/README.ja.md',
      'docs/README.zh-TW.md',
    ]
check(
  'source and template READMEs document the Infra probe contract',
  infraReadmePaths.every((relative) => {
    const readmePath = path.join(root, relative)
    if (!fs.existsSync(readmePath)) return false
    const source = fs.readFileSync(readmePath, 'utf8')
    return source.includes('VITE_INFRA_PROBE_URL') &&
      source.includes('HTTP') &&
      source.includes('`200`') &&
      source.includes('CORS') &&
      source.includes('SSRF')
  }),
)

const pingProxySource = fs
  .readFileSync(path.join(root, 'vite.config.ts'), 'utf8')
  .match(/function pingProxy\(\): Plugin \{[\s\S]*?\r?\n\}\r?\n\r?\nexport default/)?.[0] ?? ''
check(
  'local ping proxy reports online only for upstream HTTP 200',
  Boolean(pingProxySource) &&
    /online:\s*upstream\.status\s*===\s*200/.test(pingProxySource) &&
    !/latency|status:\s*upstream/.test(pingProxySource),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
