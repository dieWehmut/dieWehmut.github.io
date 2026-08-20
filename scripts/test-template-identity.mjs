import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const root = process.cwd()
const identityPath = path.join(root, 'src', 'data', 'site', 'template-identity.json')
const legacyToken = ['diesuwa', 'starter'].join('-')
const legacyBadgeToken = ['diesuwa', '', 'starter'].join('-')
const textPattern = /\.(?:html|json|md|mjs|ts|vue|ya?ml)$/i
const failures = []

function check(label, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`)
  if (!condition) failures.push(label)
}

check('template identity JSON exists', fs.existsSync(identityPath))

if (fs.existsSync(identityPath)) {
  const templateIdentity = JSON.parse(fs.readFileSync(identityPath, 'utf8'))
  check('repository name is Vorlage', templateIdentity.repositoryName === 'Vorlage')
  check('package name is lowercase', templateIdentity.packageName === 'vorlage')
  check('repository target is canonical', templateIdentity.repository === 'dieWehmut/Vorlage')
  check('Pages base preserves repository case', templateIdentity.pagesBase === '/Vorlage/')
}

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter((file) => textPattern.test(file))

const matches = tracked.filter((file) => {
  const source = fs.readFileSync(path.join(root, file), 'utf8').toLowerCase()
  return source.includes(legacyToken) || source.includes(legacyBadgeToken)
})

check('tracked text contains no legacy template token', matches.length === 0, matches.join(', '))

if (failures.length) process.exitCode = 1
