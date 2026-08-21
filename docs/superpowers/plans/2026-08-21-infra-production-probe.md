# Infra Production Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route production Infra checks through a configured browser-readable probe service so CORS-blocked HTTP 200 endpoints display online while every non-200 or unverifiable result remains offline.

**Architecture:** Extend the pure probe dispatcher with an optional remote proxy base. Development keeps the Vite same-origin proxy, configured production uses the remote proxy, and unconfigured production retains direct exact-status probing. Inject the public proxy URL through source and exported GitHub Pages workflows, then document the contract in all README variants.

**Tech Stack:** TypeScript Fetch API, Vue 3 composables, Vite environment variables, GitHub Actions, Node regression/export scripts, Markdown.

---

## File structure

- Modify `src/composables/urlProbe.ts`: normalize/build proxy URLs and dispatch local, remote, or direct probes.
- Modify `src/composables/useUrlStatus.ts`: pass `import.meta.env.VITE_INFRA_PROBE_URL` into the dispatcher.
- Modify `src/vite-env.d.ts`: type the public setting.
- Modify `scripts/test-infra-status.mjs`: remote proxy behavior, strict proxy HTTP 200, workflow mapping, and source README contract.
- Modify `.github/workflows/deploy.yml`: prefer the public repository variable and fall back to the existing `API_PROXY_BASE` secret.
- Modify `scripts/prepare-template.mjs`, `scripts/test-template-export.mjs`, and `scripts/validate-template.mjs`: keep exported workflow and README contracts deterministic.
- Modify `README.md` and all `src/data/site/starter-readme*.md` files: document the production probe contract in every exported language.

### Task 1: Remote proxy dispatcher

**Files:**
- Modify: `scripts/test-infra-status.mjs`
- Modify: `src/composables/urlProbe.ts`
- Modify: `src/composables/useUrlStatus.ts`
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Add failing remote-proxy tests**

Extend `scripts/test-infra-status.mjs` with checks that require:

```js
const remoteCalls = []
const remoteOnline = await probe.probeUrl('https://service.example/a?b=1', {
  isDev: false,
  proxyBase: ' https://probe.example/root/ ',
  fetchImpl: async (input, init) => {
    remoteCalls.push([input, init])
    return { status: 200, json: async () => ({ online: true }) }
  },
})
check('configured production dispatcher selects remote proxy',
  remoteOnline === 'online' &&
  remoteCalls[0][0] === 'https://probe.example/root/api/ping?url=https%3A%2F%2Fservice.example%2Fa%3Fb%3D1')

for (const status of [0, 201, 204, 400, 404, 500, 503]) {
  const result = await probe.probeRemoteProxyUrl(
    'https://service.example',
    'https://probe.example',
    async () => ({ status, json: async () => ({ online: true }) }),
  )
  check(`remote proxy HTTP ${status} is offline`, result === 'offline')
}

const malformedRemote = await probe.probeRemoteProxyUrl(
  'https://service.example',
  'https://probe.example',
  async () => ({ status: 200, json: async () => { throw new SyntaxError('bad json') } }),
)
check('malformed remote payload is offline', malformedRemote === 'offline')
```

Update existing local proxy mocks to include `status: 200`, and assert local proxy HTTP 201 with `{ online: true }` is offline. Add a source check that `useUrlStatus.ts` passes `import.meta.env.VITE_INFRA_PROBE_URL` as `proxyBase`.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test:infra-status`

Expected: FAIL because `proxyBase` and `probeRemoteProxyUrl` do not exist and proxy response status is not yet strict.

- [ ] **Step 3: Implement URL normalization and strict proxy parsing**

In `src/composables/urlProbe.ts`, add `proxyBase?: string` to `ProbeUrlOptions` and implement:

```ts
function proxyProbeUrl(base: string, url: string): string {
  return `${base.trim().replace(/\/+$/u, '')}/api/ping?url=${encodeURIComponent(url)}`
}

async function probeProxyEndpoint(
  endpoint: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<BinaryUrlStatus> {
  try {
    const response = await fetchImpl(endpoint, { cache: 'no-store', signal })
    if (response.status !== 200) return 'offline'
    const data = (await response.json()) as { online?: unknown }
    return data.online === true ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}

export function probeUrl(url: string, options: ProbeUrlOptions): Promise<BinaryUrlStatus> {
  const { isDev, proxyBase, fetchImpl = fetch, signal } = options
  if (isDev) return probeProxyUrl(url, fetchImpl, signal)
  if (proxyBase?.trim()) return probeRemoteProxyUrl(url, proxyBase, fetchImpl, signal)
  return probeDirectUrl(url, fetchImpl, signal)
}

export function probeProxyUrl(...) {
  return probeProxyEndpoint(`/api/ping?url=${encodeURIComponent(url)}`, fetchImpl, signal)
}

export function probeRemoteProxyUrl(...) {
  return probeProxyEndpoint(proxyProbeUrl(proxyBase, url), fetchImpl, signal)
}
```

- [ ] **Step 4: Wire the Vite environment value**

Pass this option from `useUrlStatus.ts`:

```ts
proxyBase: import.meta.env.VITE_INFRA_PROBE_URL,
```

Add to `src/vite-env.d.ts`:

```ts
readonly VITE_INFRA_PROBE_URL?: string
```

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
pnpm test:infra-status
pnpm typecheck
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit the remote dispatcher**

```bash
git add scripts/test-infra-status.mjs src/composables/urlProbe.ts src/composables/useUrlStatus.ts src/vite-env.d.ts
git commit -m "fix(infra): use the configured production probe"
```

### Task 2: Source and Vorlage deployment wiring

**Files:**
- Modify: `scripts/test-infra-status.mjs`
- Modify: `.github/workflows/deploy.yml`
- Modify: `scripts/test-template-export.mjs`
- Modify: `scripts/validate-template.mjs`
- Modify: `scripts/prepare-template.mjs`

- [ ] **Step 1: Add failing workflow/export checks**

Require this exact mapping in the source deployment test, exported workflow test, and template validator:

```yaml
VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}
```

In `scripts/test-template-export.mjs`, extend `deploy workflow uses real GitHub expressions` to require the mapping. In `scripts/validate-template.mjs`, add a named check for the same text.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
pnpm test:infra-status
pnpm test:template-export
```

Expected: workflow mapping checks fail.

- [ ] **Step 3: Add the source deployment environment mapping**

In `.github/workflows/deploy.yml`, add under the job-level `env` block:

```yaml
VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}
```

- [ ] **Step 4: Add the exported deployment mapping**

In `writeTemplateDeployWorkflow()` inside `scripts/prepare-template.mjs`, add this generated line next to the code-runner variables:

```js
'      VITE_INFRA_PROBE_URL: ${{ vars.VITE_INFRA_PROBE_URL || secrets.API_PROXY_BASE }}',
```

- [ ] **Step 5: Run source and export tests**

Run:

```bash
pnpm test:infra-status
pnpm test:template-export
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit deployment wiring**

```bash
git add .github/workflows/deploy.yml scripts/test-infra-status.mjs scripts/test-template-export.mjs scripts/validate-template.mjs scripts/prepare-template.mjs
git commit -m "ci(infra): inject the production probe URL"
```

### Task 3: README and exported documentation

**Files:**
- Modify: `scripts/test-infra-status.mjs`
- Modify: `scripts/test-template-export.mjs`
- Modify: `scripts/validate-template.mjs`
- Modify: `README.md`
- Modify: `src/data/site/starter-readme.md`
- Modify: `src/data/site/starter-readme.en.md`
- Modify: `src/data/site/starter-readme.zh-TW.md`
- Modify: `src/data/site/starter-readme.ja.md`

- [ ] **Step 1: Add failing documentation checks**

The source README check must require all of these tokens:

```js
['VITE_INFRA_PROBE_URL', '/api/ping?url=', 'HTTP 200', 'Access-Control-Allow-Origin']
```

The export test and validator must require the generated root README and all three translated README files to contain `VITE_INFRA_PROBE_URL`, `/api/ping?url=`, and `200`.

- [ ] **Step 2: Run documentation tests and verify RED**

Run:

```bash
pnpm test:infra-status
pnpm test:template-export
```

Expected: README contract checks fail.

- [ ] **Step 3: Add the source README section**

Add a Chinese `## Infra 状态探测` section describing:

```md
- 浏览器只有拿到最终 HTTP 200 才显示 online；其他状态、超时、网络错误和无法读取的 CORS 响应均显示 offline。
- 生产环境设置公开构建变量 `VITE_INFRA_PROBE_URL=https://probe.example.com` 后，前端请求 `https://probe.example.com/api/ping?url=<encoded-target>`，接口返回 `{ "online": true }` 才视为在线。
- GitHub Pages workflow 优先读取仓库变量 `VITE_INFRA_PROBE_URL`，并兼容现有 Secret `API_PROXY_BASE`。该地址会进入公开的前端产物，不能包含密钥。
- 探测服务必须允许 Pages Origin 的无凭证 CORS 请求（例如合适的 `Access-Control-Allow-Origin`），并通过目标域名 allowlist 防止 SSRF/开放代理。
- 未配置代理时退回浏览器直连，因此没有合法 CORS 的服务会显示 offline。
```

- [ ] **Step 4: Add equivalent Vorlage sections**

Add the same contract to all four starter README sources. Use the language of each file. The English section must explicitly say:

```md
An endpoint is online only when the probe confirms a final HTTP 200 response. Configure the public repository variable `VITE_INFRA_PROBE_URL`; the frontend calls `<base>/api/ping?url=<encoded-target>` and accepts only proxy HTTP 200 with `{ "online": true }`. The value is embedded in public JavaScript and must not contain credentials. The probe must provide CORS and protect outbound requests with a hostname allowlist.
```

Traditional Chinese and Japanese sections must communicate the same exact-200, public-value, CORS, allowlist, and direct-fallback rules rather than merely naming the variable.

- [ ] **Step 5: Run documentation and export validation**

Run:

```bash
pnpm test:infra-status
pnpm test:template-export
```

Expected: both commands exit 0 and the generated Vorlage README variants contain the new setup section.

- [ ] **Step 6: Commit the documentation**

```bash
git add README.md src/data/site/starter-readme.md src/data/site/starter-readme.en.md src/data/site/starter-readme.zh-TW.md src/data/site/starter-readme.ja.md scripts/test-infra-status.mjs scripts/test-template-export.mjs scripts/validate-template.mjs
git commit -m "docs(infra): explain production status probing"
```

### Task 4: Infra feature verification

**Files:**
- No production changes expected.

- [ ] **Step 1: Run focused and template tests**

Run:

```bash
pnpm test:infra-status
pnpm test:template-export
pnpm test:template-sync-workflow
pnpm typecheck
```

Expected: every command exits 0.

- [ ] **Step 2: Run the production build**

Run: `pnpm build`

Expected: Vite exits 0 and produces `dist/`.

- [ ] **Step 3: Verify the deployment workflow and live browser behavior**

Push the completed branch/main according to the repository's established deployment flow, wait for GitHub Pages deployment success, and open the production Infra page in a real browser.

Expected:

- `https://nezha.hc-dsw-nexus.me/` displays online when the remote probe confirms final HTTP 200.
- `https://dashboard.netmaker.hc-dsw-nexus.me/` displays online when the remote probe confirms final HTTP 200.
- A known non-200 target remains offline.
- Browser requests go to the configured probe base rather than directly to the two CORS-blocked targets.
