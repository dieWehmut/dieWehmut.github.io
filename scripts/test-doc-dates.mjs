import fs from 'node:fs'
import path from 'node:path'

/**
 * Guards the workflow checkout depth.
 *
 * `pnpm run build` regenerates `src/data/docs/generated.ts`, and the generator
 * dates every doc from the last commit that touched *that* file. With the
 * default `actions/checkout` shallow clone — a single commit — `git log` cannot
 * see any file's history, so every doc reports the repository tip and the whole
 * site claims it was updated the moment the workflow ran. Fetching the full
 * history is what keeps the per-file dates meaningful.
 *
 * Only workflows that build the site or regenerate its data need this; a
 * workflow that merely publishes assets does not.
 */

const root = path.resolve(import.meta.dirname, '..')
const workflowsDir = path.join(root, '.github', 'workflows')
const generatorPath = path.join(root, 'scripts', 'generate-docs-data.mjs')

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

/** Workflows that run `pnpm run build`, directly or through a script. */
const BUILDING_WORKFLOWS = ['deploy.yml', 'sync-capture.yml']

const checks = []
const check = (label, ok) => checks.push([label, Boolean(ok)])

// --- the generator really does depend on per-file history --------------------

const generator = read('scripts/generate-docs-data.mjs')
check(
  'the doc generator dates files from git history',
  /function getGitLastUpdated[\s\S]{0,600}?'log'[\s\S]{0,120}?'-1'/.test(generator),
)
check(
  'the doc generator resolves the date per file rather than once for the repo',
  /getGitLastUpdated\(filePath\)/.test(generator),
)
check(
  'generator script exists where the test expects it',
  fs.existsSync(generatorPath),
)

// --- every workflow that generates data fetches full history -----------------

for (const workflow of BUILDING_WORKFLOWS) {
  const fullPath = path.join(workflowsDir, workflow)
  if (!fs.existsSync(fullPath)) {
    check(`${workflow} exists`, false)
    continue
  }
  const source = fs.readFileSync(fullPath, 'utf8')

  // Only the *site* checkout matters; a nested clone of another repository into
  // a cache directory is unrelated to the site's own doc dates. Find the step
  // that uses actions/checkout and read up to the next step boundary.
  const checkoutIndex = source.indexOf('uses: actions/checkout@')
  check(`${workflow} checks out the site repository`, checkoutIndex !== -1)

  if (checkoutIndex !== -1) {
    // Walk back to the step's `- name:` line, then forward to the next step.
    const stepStart = source.lastIndexOf('\n      - ', checkoutIndex)
    const nextStep = source.indexOf('\n      - ', checkoutIndex)
    const block = source.slice(stepStart === -1 ? 0 : stepStart, nextStep === -1 ? undefined : nextStep)
    check(
      `${workflow} fetches full history (fetch-depth: 0)`,
      /fetch-depth:\s*0/.test(block),
    )
  }
}

// --- and the workflow really does regenerate the data -----------------------

const deploy = read('.github/workflows/deploy.yml')
check('deploy workflow runs the build that regenerates doc data', /pnpm run build/.test(deploy))
check(
  'build regenerates doc data before bundling',
  /"build":\s*"[^"]*content:sync/.test(read('package.json')),
)

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
