import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/commandParser.ts')

async function loadTypeScriptModule(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing module: ${path.relative(root, filePath)}`)
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

const parser = await loadTypeScriptModule(modulePath)
const checks = []

function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

const rootCommand = parser.parseConsoleInput('/')
check('root command keeps the console landing path', rootCommand?.kind === 'command' && rootCommand.canonicalInput === '/')

const homeCommand = parser.parseConsoleInput('/HOME')
check('home command is case insensitive', homeCommand?.segments?.[0] === 'home')
check('home command uses its canonical route', homeCommand?.canonicalInput === '/home')

const commentCommand = parser.parseConsoleInput('/COMMENT')
check('comment action is case insensitive', commentCommand?.segments?.[0] === 'comment')
check('comment action has a stable canonical command', commentCommand?.canonicalInput === '/comment')

const noteCommand = parser.parseConsoleInput('/NOTE/CurrentAffairsReading')
check('fixed command segments are case insensitive', noteCommand?.segments?.[0] === 'note')
check('dynamic document ids preserve case', noteCommand?.segments?.[1] === 'CurrentAffairsReading')
check('canonical document path is encoded once', noteCommand?.canonicalInput === '/note/CurrentAffairsReading')

const fixedLookingId = parser.parseConsoleInput('/note/Theme')
check('dynamic ids matching command words preserve case', fixedLookingId?.segments?.[1] === 'Theme')
check('fixed-looking id remains unchanged in canonical path', fixedLookingId?.canonicalInput === '/note/Theme')

const spacedCapture = parser.parseConsoleInput('/capture/My Image (1).png')
check('dynamic path segments preserve spaces', spacedCapture?.segments?.[1] === 'My Image (1).png')
check('route path encodes dynamic values once', parser.toConsoleRoutePath(spacedCapture) === '/capture/My%20Image%20(1).png')

const settings = parser.parseConsoleInput('///MODE//CLASSIC/')
check('extra slashes normalize for fixed commands', settings?.canonicalInput === '/mode/classic')
const colorCommand = parser.parseConsoleInput('/COLOR/PURPLE')
check('settings command words normalize case', colorCommand?.canonicalInput === '/color/purple')

const withHash = parser.parseConsoleInput('/note/CurrentAffairsReading?view=full#section-one')
check('query is retained', withHash?.query === 'view=full')
check('hash is retained', withHash?.hash === '#section-one')

check('non slash input stays silent', parser.parseConsoleInput('archive')?.kind === 'silent')
check('blank input stays silent', parser.parseConsoleInput('   ')?.kind === 'silent')
check('malformed percent encoding stays silent', parser.parseConsoleInput('/note/bad%2')?.kind === 'silent')

const removedCommands = [
  '/agent',
  '/list',
  '/status',
  '/permissions',
  '/docker',
  '/workspace',
  '/model',
]
for (const input of removedCommands) {
  check(`${input} stays silent after removal`, parser.parseConsoleInput(input)?.kind === 'silent')
  check(`${input.toUpperCase()} stays silent after removal`, parser.parseConsoleInput(input.toUpperCase())?.kind === 'silent')
}

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
