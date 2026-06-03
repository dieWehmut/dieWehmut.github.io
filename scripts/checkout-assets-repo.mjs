import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const repository = process.env.DIESW_ASSETS_REPOSITORY || 'dieWehmut/diesw-assets'
const token = process.env.DIESW_ASSETS_TOKEN || ''
const targetRef = process.env.DIESW_ASSETS_REF || 'main'
const destination = path.resolve(rootDir, process.env.DIESW_ASSETS_DIR || '.cache/diesw-assets')
const gitEnv = createGitEnv()

function fail(message) {
  console.error(message)
  process.exit(1)
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: options.cwd || rootDir,
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
  if (!token) return { ...process.env, GIT_TERMINAL_PROMPT: '0' }

  const tempDir = process.env.RUNNER_TEMP || rootDir
  const askpassPath = path.join(tempDir, process.platform === 'win32' ? 'diesw-assets-askpass.cmd' : 'diesw-assets-askpass.sh')

  if (process.platform === 'win32') {
    fs.writeFileSync(
      askpassPath,
      '@echo off\r\n' +
      'echo %1 | findstr /I "Username" >nul && echo x-access-token && exit /b 0\r\n' +
      'echo %DIESW_ASSETS_TOKEN%\r\n',
      { mode: 0o700 }
    )
  } else {
    fs.writeFileSync(
      askpassPath,
      '#!/usr/bin/env sh\n' +
      'case "$1" in\n' +
      '  *Username*) printf "%s\\n" "x-access-token" ;;\n' +
      '  *) printf "%s\\n" "$DIESW_ASSETS_TOKEN" ;;\n' +
      'esac\n',
      { mode: 0o700 }
    )
    fs.chmodSync(askpassPath, 0o700)
  }

  return {
    ...process.env,
    GIT_ASKPASS: askpassPath,
    GIT_TERMINAL_PROMPT: '0',
  }
}

function branchExists(remoteUrl, branch) {
  return runGit(['ls-remote', '--exit-code', '--heads', remoteUrl, branch], {
    capture: true,
    allowFailure: true,
  }).ok
}

function resolveDefaultBranch(remoteUrl) {
  const result = runGit(['ls-remote', '--symref', remoteUrl, 'HEAD'], { capture: true })
  const match = result.stdout.match(/^ref:\s+refs\/heads\/(.+)\s+HEAD/m)
  return match?.[1] || ''
}

function createBranchFromDefault(remoteUrl, branch) {
  const defaultBranch = resolveDefaultBranch(remoteUrl)
  if (!defaultBranch) fail(`Unable to resolve default branch for ${repository}.`)
  if (defaultBranch === branch) fail(`Default branch ${branch} exists but could not be fetched.`)

  console.log(`Assets branch ${branch} does not exist. Creating it from ${defaultBranch}.`)
  fs.rmSync(destination, { recursive: true, force: true })
  runGit(['clone', '--depth', '1', '--branch', defaultBranch, remoteUrl, destination])
  runGit(['checkout', '-B', branch], { cwd: destination })
  runGit(['push', 'origin', `${branch}:${branch}`], { cwd: destination })
}

const remoteUrl = githubRemoteUrl()

if (!branchExists(remoteUrl, targetRef)) {
  createBranchFromDefault(remoteUrl, targetRef)
}

fs.rmSync(destination, { recursive: true, force: true })
runGit(['clone', '--depth', '1', '--branch', targetRef, remoteUrl, destination])
runGit(['config', '--global', '--add', 'safe.directory', destination])
console.log(`Checked out ${repository}@${targetRef} to ${destination}.`)
