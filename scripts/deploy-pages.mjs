import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// The upload already knows the artifact ID. Do not rediscover it through the
// Actions runtime artifact service, which can return an empty list after a
// successful upload even though the run's REST artifact endpoint has it.
export async function deployPages({
  env = process.env,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  log = console.log,
  timeout = 600_000,
} = {}) {
  const required = (name) => {
    if (!env[name]) throw new Error(`${name} is required`)
    return env[name]
  }
  const repository = required('GITHUB_REPOSITORY')
  const runId = required('GITHUB_RUN_ID')
  const sha = required('GITHUB_SHA')
  const artifactId = required('PAGES_ARTIFACT_ID')
  const token = required('GITHUB_TOKEN')
  const oidcUrl = required('ACTIONS_ID_TOKEN_REQUEST_URL')
  const oidcToken = required('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^\d+$/.test(artifactId)) {
    throw new Error('Invalid repository or Pages artifact ID')
  }
  const api = (env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '')
  const base = `${api}/repos/${repository}`
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
  let idToken = ''
  const redact = (value) => [token, oidcToken, idToken].filter(Boolean)
    .reduce((text, secret) => text.replaceAll(secret, '[redacted]'), String(value))

  const request = async (url, options = {}, { attempts = 4, retryNotFound = false, label = 'GitHub Pages request' } = {}) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      let response
      try {
        response = await fetchImpl(url, {
          headers,
          ...options,
          signal: AbortSignal.timeout(30_000),
        })
      } catch (error) {
        if (attempt === attempts - 1) throw new Error(redact(error.message))
        await sleep(Math.min(5000, 1000 * 2 ** attempt))
        continue
      }
      if (response.ok) return response.status === 204 ? {} : response.json()
      if ((response.status === 429 || response.status >= 500 || (retryNotFound && response.status === 404)) && attempt < attempts - 1) {
        if (retryNotFound && response.status === 404) log(`${label}: not visible yet; retrying`)
        await sleep(Math.min(5000, 1000 * 2 ** attempt))
        continue
      }
      const detail = await response.json().catch(() => ({}))
      throw new Error(redact(`${label} failed (${response.status}): ${detail.message || response.statusText}`))
    }
  }

  // Upload finalization can precede REST indexing: the failed run returned 404
  // immediately after upload, but the exact artifact became readable afterwards.
  // Wait up to 112 seconds between attempts; keep all identity checks below.
  const artifact = await request(`${base}/actions/artifacts/${artifactId}`, {}, {
    attempts: 25, retryNotFound: true, label: 'Uploaded Pages artifact lookup',
  })
  if (artifact.name !== 'github-pages' || artifact.expired
    || String(artifact.workflow_run?.id) !== String(runId)
    || artifact.workflow_run?.head_sha !== sha) {
    throw new Error('Pages artifact must be unexpired and belong to this workflow run and commit')
  }
  const identity = await request(oidcUrl, {
    headers: { Authorization: `Bearer ${oidcToken}` },
  })
  idToken = identity.value
  if (!idToken) throw new Error('GitHub did not return an OIDC token')

  const deployment = await request(`${base}/pages/deployments`, {
    method: 'POST',
    body: JSON.stringify({ artifact_id: Number(artifactId), pages_build_version: sha, oidc_token: idToken }),
  })
  const deploymentId = deployment.id || deployment.status_url?.split('/').pop()
  if (!deploymentId) throw new Error('GitHub did not return a Pages deployment ID')
  const statusUrl = deployment.status_url || `${base}/pages/deployments/${encodeURIComponent(deploymentId)}`
  if (!statusUrl.startsWith(`${base}/pages/`)) throw new Error('Unexpected Pages status URL')
  log(`Deploying artifact ${artifactId} for ${sha}`)

  const deadline = now() + timeout
  const terminal = new Set(['deployment_failed', 'deployment_content_failed', 'deployment_cancelled', 'deployment_lost'])
  while (now() < deadline) {
    const result = await request(statusUrl)
    if (result.status === 'succeed') {
      if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `page_url=${deployment.page_url}\n`)
      log(`GitHub Pages deployed: ${deployment.page_url}`)
      return deployment
    }
    if (terminal.has(result.status)) {
      throw new Error(`GitHub Pages deployment ended with ${result.status}`)
    }
    log(`GitHub Pages: ${result.status || 'pending'}`)
    await sleep(5000)
  }
  await request(`${base}/pages/deployments/${encodeURIComponent(deploymentId)}/cancel`, { method: 'POST' })
    .catch(() => undefined)
  throw new Error('GitHub Pages deployment timed out')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  deployPages().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
