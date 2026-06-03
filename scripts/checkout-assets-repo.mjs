import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const repository = process.env.DIESW_ASSETS_REPOSITORY || 'dieWehmut/diesw-assets'
const token = process.env.DIESW_ASSETS_TOKEN || ''
const targetRef = process.env.DIESW_ASSETS_REF || 'main'
const destination = path.resolve(rootDir, process.env.DIESW_ASSETS_DIR || '.cache/diesw-assets')
const gitWorkDir = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'diesw-assets-git-'))
const gitEnv = createGitEnv()

function fail(message) {
  console.error(message)
  process.exit(1)
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: options.cwd || gitWorkDir,
    env: gitEnv,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  })

  if (result.status !== 0 && !options.allowFailure) {
    if (options.capture && result.stderr) console.error(result.stderr.trim())
    fail(`git ${args.join(' ')} failed`)
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
  }
}

function githubRemoteUrl() {
  if (!token) fail('DIESW_ASSETS_TOKEN is not set in this repository\'s Actions secrets.')
  return `https://github.com/${repository}.git`
}

function createGitEnv() {
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
  }

  for (const key of Object.keys(env)) {
    if (/^GIT_CONFIG_(?:COUNT|KEY_\d+|VALUE_\d+)$/.test(key)) {
      delete env[key]
    }
  }

  if (!token) return env

  const encoded = Buffer.from(`x-access-token:${token}`).toString('base64')

  return {
    ...env,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${encoded}`,
  }
}

function githubApiRepositoryUrl() {
  const [owner, repoName] = repository.split('/')
  if (!owner || !repoName) fail(`DIESW_ASSETS_REPOSITORY must be in owner/repo format: ${repository}`)
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`
}

async function loadRepositoryAccess() {
  if (!token) fail('DIESW_ASSETS_TOKEN is not set in this repository\'s Actions secrets.')

  const response = await fetch(githubApiRepositoryUrl(), {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (response.ok) return response.json()

  if (response.status === 404) {
    fail(`Cannot access ${repository}. Check that DIESW_ASSETS_REPOSITORY is correct and DIESW_ASSETS_TOKEN has access to this private repository.`)
  }

  if (response.status === 401) {
    fail('DIESW_ASSETS_TOKEN is invalid or expired.')
  }

  if (response.status === 403) {
    fail(`DIESW_ASSETS_TOKEN cannot access ${repository}. It needs read/write contents permission.`)
  }

  fail(`GitHub API failed while checking ${repository}: HTTP ${response.status}`)
}

function tokenCanPush(repositoryInfo) {
  const permissions = repositoryInfo?.permissions
  return Boolean(permissions?.admin || permissions?.maintain || permissions?.push)
}

function branchExists(remoteUrl, branch) {
  return runGit(['ls-remote', '--exit-code', '--heads', remoteUrl, branch], {
    capture: true,
    allowFailure: true,
  }).ok
}

function resolveDefaultBranch(remoteUrl) {
  const result = runGit(['ls-remote', '--symref', remoteUrl, 'HEAD'], {
    capture: true,
    allowFailure: true,
  })
  if (!result.ok) return ''
  const match = result.stdout.match(/^ref:\s+refs\/heads\/(.+)\s+HEAD/m)
  return match?.[1] || ''
}

function createInitialBranch(remoteUrl, branch) {
  console.log(`Assets repository has no default branch. Creating initial ${branch} branch.`)
  fs.rmSync(destination, { recursive: true, force: true })
  fs.mkdirSync(destination, { recursive: true })
  runGit(['init', '--initial-branch', branch], { cwd: destination })
  runGit(['remote', 'add', 'origin', remoteUrl], { cwd: destination })
  fs.writeFileSync(path.join(destination, '.gitkeep'), '')
  runGit(['add', '.gitkeep'], { cwd: destination })
  runGit(['config', 'user.name', 'github-actions[bot]'], { cwd: destination })
  runGit(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], { cwd: destination })
  runGit(['commit', '-m', 'chore: initialize assets repository'], { cwd: destination })
  runGit(['push', 'origin', `${branch}:${branch}`], { cwd: destination })
}

function createBranchFromDefault(remoteUrl, branch, repositoryInfo) {
  if (!tokenCanPush(repositoryInfo)) {
    fail(`Assets branch ${branch} does not exist, and DIESW_ASSETS_TOKEN cannot create it. Grant write contents permission to ${repository}.`)
  }

  const defaultBranch = resolveDefaultBranch(remoteUrl)
  if (!defaultBranch) {
    createInitialBranch(remoteUrl, branch)
    return
  }
  if (defaultBranch === branch) fail(`Default branch ${branch} exists but could not be fetched.`)

  console.log(`Assets branch ${branch} does not exist. Creating it from ${defaultBranch}.`)
  fs.rmSync(destination, { recursive: true, force: true })
  runGit(['clone', '--depth', '1', '--branch', defaultBranch, remoteUrl, destination])
  runGit(['checkout', '-B', branch], { cwd: destination })
  runGit(['push', 'origin', `${branch}:${branch}`], { cwd: destination })
}

const repositoryInfo = await loadRepositoryAccess()
const remoteUrl = githubRemoteUrl()

if (!branchExists(remoteUrl, targetRef)) {
  createBranchFromDefault(remoteUrl, targetRef, repositoryInfo)
}

fs.rmSync(destination, { recursive: true, force: true })
runGit(['clone', '--depth', '1', '--branch', targetRef, remoteUrl, destination])
runGit(['config', '--global', '--add', 'safe.directory', destination])
console.log(`Checked out ${repository}@${targetRef} to ${destination}.`)
