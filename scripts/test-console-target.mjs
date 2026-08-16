import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(root, 'src/console/commandTarget.ts')
if (!fs.existsSync(modulePath)) throw new Error('Missing module: src/console/commandTarget.ts')

const source = fs.readFileSync(modulePath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: modulePath,
})
const target = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const sessionSource = fs.readFileSync(path.join(root, 'src/composables/useConsoleSession.ts'), 'utf8')

const catalog = {
  postIds: ['ExactPost'],
  noteIds: ['CurrentAffairsReading'],
  captureIds: ['capture-2026-08-17', 'Image (1).png'],
  tags: ['Vue', 'Current Affairs'],
}

const command = (...segments) => ({ kind: 'command', segments })
const checks = [
  ['known post id is accepted', target.isKnownConsoleCommandTarget(command('post', 'ExactPost'), catalog)],
  ['post ids remain case sensitive', !target.isKnownConsoleCommandTarget(command('post', 'exactpost'), catalog)],
  ['unknown note id is rejected', !target.isKnownConsoleCommandTarget(command('note', 'missing'), catalog)],
  ['known capture group is accepted', target.isKnownConsoleCommandTarget(command('capture', 'capture-2026-08-17'), catalog)],
  ['known capture asset is accepted', target.isKnownConsoleCommandTarget(command('capture', 'Image (1).png'), catalog)],
  ['unknown capture target is rejected', !target.isKnownConsoleCommandTarget(command('capture', 'missing'), catalog)],
  ['tag targets match case insensitively', target.isKnownConsoleCommandTarget(command('tags', 'vue'), catalog)],
  ['unknown tags are rejected', !target.isKnownConsoleCommandTarget(command('tags', 'missing'), catalog)],
  ['non-dynamic routes pass through', target.isKnownConsoleCommandTarget(command('archive'), catalog)],
  ['console session validates before committing history', sessionSource.includes('isKnownConsoleCommandTarget')],
  ['capture-only tags participate in target validation', sessionSource.includes('getCaptureTagCounts')],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
