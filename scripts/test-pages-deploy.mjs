import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import { deployPages } from './deploy-pages.mjs'

const env = {
  GITHUB_REPOSITORY: 'example/site', GITHUB_RUN_ID: '42', GITHUB_SHA: 'abc123',
  PAGES_ARTIFACT_ID: '123', GITHUB_TOKEN: 'test-secret',
  ACTIONS_ID_TOKEN_REQUEST_URL: 'https://oidc.example/token',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'oidc-request-secret',
}
const artifact = { name: 'github-pages', expired: false, workflow_run: { id: 42, head_sha: 'abc123' } }
const deployment = { id: 'deployment-1', page_url: 'https://example.github.io', status_url: 'https://api.github.com/repos/example/site/pages/deployments/deployment-1' }
const ok = (body) => new Response(JSON.stringify(body), { status: 200 })

function harness(responses) {
  const requests = []
  const logs = []
  const fetchImpl = async (url, options) => {
    requests.push({ url, ...options })
    assert.ok(responses.length, `Unexpected request: ${url}`)
    return responses.shift()
  }
  return { requests, logs, options: { env, fetchImpl, sleep: async () => {}, log: (line) => logs.push(line) } }
}

test('deploys the exact uploaded artifact without relying on an artifact listing', async () => {
  const h = harness([ok(artifact), ok({ value: 'oidc-secret' }), ok(deployment), ok({ status: 'deployment_in_progress' }), ok({ status: 'succeed' })])
  assert.equal((await deployPages(h.options)).id, 'deployment-1')
  assert.equal(h.requests[0].url, 'https://api.github.com/repos/example/site/actions/artifacts/123')
  assert.equal(h.requests[1].headers.Authorization, 'Bearer oidc-request-secret')
  assert.deepEqual(JSON.parse(h.requests[2].body), { artifact_id: 123, pages_build_version: 'abc123', oidc_token: 'oidc-secret' })
  assert.ok(!h.requests.some((r) => r.url.includes('/runs/') || r.url.includes('ListArtifacts')))
  assert.ok(!h.logs.join('\n').includes('secret'))
})

for (const [label, invalid] of [
  ['another run', { ...artifact, workflow_run: { id: 7, head_sha: 'abc123' } }],
  ['another commit', { ...artifact, workflow_run: { id: 42, head_sha: 'stale' } }],
  ['expired artifact', { ...artifact, expired: true }],
]) {
  test(`does not deploy ${label}`, async () => {
    const h = harness([ok(invalid)])
    await assert.rejects(deployPages(h.options), /belong to this workflow run/)
    assert.equal(h.requests.length, 1)
  })
}

test('retries a temporary service error and still verifies the artifact identity', async () => {
  const h = harness([new Response('{}', { status: 503 }), ok(artifact), ok({ value: 'oidc-secret' }), ok(deployment), ok({ status: 'succeed' })])
  await deployPages(h.options)
  assert.equal(h.requests[0].url, h.requests[1].url)
})

test('waits for the exact uploaded artifact to become visible after transient 404s', async () => {
  const h = harness([new Response('{}', { status: 404 }), new Response('{}', { status: 404 }),
    ok(artifact), ok({ value: 'oidc-secret' }), ok(deployment), ok({ status: 'succeed' })])
  const delays = []
  await deployPages({ ...h.options, sleep: async (delay) => delays.push(delay) })
  assert.deepEqual(delays, [1000, 2000])
  assert.equal(new Set(h.requests.slice(0, 3).map(request => request.url)).size, 1)
  assert.match(h.logs[0], /artifact lookup: not visible yet/)
  assert.equal(JSON.parse(h.requests[4].body).artifact_id, 123)
})

test('a permanently missing artifact stops after bounded retries before requesting OIDC', async () => {
  const h = harness(Array.from({ length: 25 }, () => new Response('{}', { status: 404 })))
  const delays = []
  await assert.rejects(deployPages({ ...h.options, sleep: async (delay) => delays.push(delay) }), /artifact lookup failed \(404\)/)
  assert.equal(h.requests.length, 25)
  assert.equal(delays.reduce((total, delay) => total + delay, 0), 112000)
  assert.ok(delays.every(delay => delay <= 5000))
  assert.ok(h.requests.every(request => request.url.endsWith('/actions/artifacts/123')))
})

test('permission errors are terminal and redact credentials', async () => {
  const h = harness([new Response(JSON.stringify({ message: 'test-secret forbidden' }), { status: 403 })])
  await assert.rejects(deployPages(h.options), (error) => error.message.includes('403') && !error.message.includes('test-secret'))
  assert.equal(h.requests.length, 1)
})

test('does not report a failed deployment as successful', async () => {
  const h = harness([ok(artifact), ok({ value: 'oidc-secret' }), ok(deployment), ok({ status: 'deployment_content_failed' })])
  await assert.rejects(deployPages(h.options), /deployment_content_failed/)
})

test('cancels its own deployment on timeout', async () => {
  const h = harness([ok(artifact), ok({ value: 'oidc-secret' }), ok(deployment), ok({ status: 'deployment_in_progress' }), ok({})])
  let time = 0
  await assert.rejects(deployPages({ ...h.options, timeout: 100, now: () => time, sleep: async () => { time += 101 } }), /timed out/)
  assert.equal(h.requests.at(-1).url, `${deployment.status_url}/cancel`)
})

test('workflow passes the upload ID and retains Pages and OIDC permissions', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
  assert.match(workflow, /id: pages_artifact[\s\S]*?uses: actions\/upload-pages-artifact@v3/)
  assert.match(workflow, /PAGES_ARTIFACT_ID: \$\{\{ steps\.pages_artifact\.outputs\.artifact_id \}\}/)
  for (const permission of ['actions: read', 'pages: write', 'id-token: write']) assert.ok(workflow.includes(permission))
})
