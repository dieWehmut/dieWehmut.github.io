import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/utils/siteOverview.ts')

async function loadTypeScriptModule(filePath) {
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

const overview = await loadTypeScriptModule(modulePath)
const checks = []

function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

function same(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

function call(name, ...args) {
  if (typeof overview?.[name] !== 'function') return undefined
  try {
    return overview[name](...args)
  } catch {
    return undefined
  }
}

check('pure site overview utility exists', Boolean(overview))
check(
  'overview exports the canonical six-stat order',
  same(overview?.SITE_OVERVIEW_STAT_ORDER, ['posts', 'notes', 'infra', 'capture', 'project', 'tags']),
)

const allStats = call(
  'buildSiteOverviewStats',
  { posts: 12, notes: 8, infra: 4, capture: 9, project: 3, tags: 7 },
  { enableInfra: true, enableProject: true },
)
check(
  'overview statistics retain the classic Home order',
  same(allStats?.map((item) => item.key), ['posts', 'notes', 'infra', 'capture', 'project', 'tags']),
)
check(
  'overview statistics retain their canonical destinations',
  same(allStats?.map((item) => item.path), ['/archive', '/notes', '/infra', '/capture', '/project', '/tags']),
)
check(
  'overview statistics retain authoritative count values',
  same(allStats?.map((item) => item.value), [12, 8, 4, 9, 3, 7]),
)

const filteredStats = call(
  'buildSiteOverviewStats',
  { posts: 12, notes: 8, infra: 4, capture: null, project: 3, tags: 7 },
  { enableInfra: false, enableProject: false },
)
check(
  'disabled feature statistics are omitted without reordering the rest',
  same(filteredStats?.map((item) => item.key), ['posts', 'notes', 'capture', 'tags']),
)
check('capture loading state remains explicit', filteredStats?.find((item) => item.key === 'capture')?.value === null)

const uniqueProjects = call('countUniqueProjects', [
  { name: 'Nexus' },
  { name: ' nexus ' },
  { name: 'Sandkasten' },
  { name: 'SANDKASTEN' },
  { name: '' },
  { name: '   ' },
])
check('project totals deduplicate trimmed names case-insensitively', uniqueProjects === 2)

const uptime = call(
  'formatSiteUptime',
  '2026-08-15T01:02:03.000Z',
  new Date('2026-08-17T04:05:09.000Z').getTime(),
)
check(
  'uptime uses stable day and zero-padded clock fields',
  same(uptime, { days: '2', hours: '03', minutes: '03', seconds: '06' }),
)
const futureUptime = call(
  'formatSiteUptime',
  '2026-08-18T00:00:00.000Z',
  new Date('2026-08-17T00:00:00.000Z').getTime(),
)
check(
  'uptime clamps dates before launch to zero',
  same(futureUptime, { days: '0', hours: '00', minutes: '00', seconds: '00' }),
)

const footerMeta = call(
  'buildSiteFooterMeta',
  {
    displayName: 'diesw',
    githubUser: 'configured-user',
    icpNumber: '20260803',
    icpText: 'ICP 20260803',
  },
  {
    hostname: 'dieWehmut.github.io',
    now: new Date('2032-03-04T05:06:07.000Z'),
  },
)
check('GitHub Pages hostname owns the footer profile', footerMeta?.githubUser === 'dieWehmut')
check('footer profile links to the resolved GitHub owner', footerMeta?.githubProfileUrl === 'https://github.com/dieWehmut')
check('copyright metadata is deterministic', footerMeta?.copyrightText === '\u00a9 2032 diesw')
check(
  'ICP metadata keeps its text and canonical lookup URL',
  same(footerMeta?.icp, {
    text: 'ICP 20260803',
    href: 'https://icp.gov.moe/?keyword=20260803',
  }),
)

const noIcpMeta = call(
  'buildSiteFooterMeta',
  {
    displayName: 'diesw',
    githubUser: 'configured-user',
    icpNumber: '',
    icpText: 'must not render',
  },
  {
    hostname: 'example.com',
    now: new Date('2032-03-04T05:06:07.000Z'),
  },
)
check('custom hosts retain the configured GitHub owner', noIcpMeta?.githubUser === 'configured-user')
check('empty ICP numbers omit filing metadata', noIcpMeta?.icp === null)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
