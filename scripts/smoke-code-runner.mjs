const apiUrl = (process.env.VITE_CODE_RUNNER_API_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
const token = process.env.VITE_CODE_RUNNER_API_TOKEN || ''

const headers = {
  'content-type': 'text/plain;charset=UTF-8',
}
if (token) {
  headers.authorization = `Bearer ${token}`
}

function isTerminal(status) {
  return [
    'JOB_STATUS_SUCCEEDED',
    'JOB_STATUS_COMPILE_FAILED',
    'JOB_STATUS_RUNTIME_FAILED',
    'JOB_STATUS_TIME_LIMIT_EXCEEDED',
    'JOB_STATUS_MEMORY_LIMIT_EXCEEDED',
    'JOB_STATUS_OUTPUT_LIMIT_EXCEEDED',
    'JOB_STATUS_CANCELED',
    'JOB_STATUS_SYSTEM_ERROR',
  ].includes(status)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readJson(response) {
  return await response.json().catch(() => null)
}

async function runLanguage({ language, source, expectedStdout }) {
  const response = await fetch(`${apiUrl}/v1/${language}/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source,
      wait: true,
      waitTimeoutMs: 30000,
    }),
  })

  let body = await readJson(response)
  if (!response.ok) {
    throw new Error(`Sandkasten API returned ${response.status}: ${JSON.stringify(body)}`)
  }
  for (let attempt = 0; body?.jobId && !isTerminal(body.status) && attempt < 120; attempt += 1) {
    await sleep(500)
    const pollResponse = await fetch(`${apiUrl}/v1/jobs/${encodeURIComponent(body.jobId)}`, { headers })
    body = await readJson(pollResponse)
    if (!pollResponse.ok) {
      throw new Error(`Sandkasten job poll returned ${pollResponse.status}: ${JSON.stringify(body)}`)
    }
  }
  if (body?.status !== 'JOB_STATUS_SUCCEEDED') {
    throw new Error(`${language} run failed: ${JSON.stringify(body)}`)
  }
  if (!String(body.stdout || '').includes(expectedStdout)) {
    throw new Error(`Unexpected ${language} stdout: ${JSON.stringify(body.stdout)}`)
  }
}

await runLanguage({
  language: 'go',
  expectedStdout: 'sandkasten-smoke {"runner":"sandkasten"}',
  source: `package main

import (
  "encoding/json"
  "fmt"
)

func main() {
  data, err := json.Marshal(map[string]string{"runner": "sandkasten"})
  if err != nil {
    panic(err)
  }
  fmt.Printf("sandkasten-smoke %s\\n", data)
}
`,
})

await runLanguage({
  language: 'r',
  expectedStdout: 'sandkasten-smoke {"runner":"sandkasten"}',
  source: 'cat("sandkasten-smoke {\\"runner\\":\\"sandkasten\\"}\\n")',
})

console.log(`Sandkasten code runner smoke passed via ${apiUrl}`)
