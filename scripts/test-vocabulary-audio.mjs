import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const markdown = read('src/utils/markdown.ts')
const styles = read('src/styles/markdown/index.scss')
const note = read('src/data/docs/notes/CurrentAffairsReading.md')

const vocabularyLinePattern = /^\s*[-*+]\s+\*\*[^*]+\*\*\s+英\s+\[[^\]]+\]\s*\/\s*美\s+\[[^\]]+\].*$/gmu
const checks = [
  ['all source vocabulary lines match', (note.match(vocabularyLinePattern) || []).length === 164],
  ['nested definitions remain available', /tokens\.slice\(1\)/.test(markdown)],
  ['word and pronunciation rows render', /md-vocabulary-entry__word/.test(markdown) && /md-vocabulary-entry__row/.test(markdown)],
  ['British and American audio metadata render', /en-GB/.test(markdown) && /en-US/.test(markdown) && /data-md-audio-word/.test(markdown)],
  ['speech synthesis is delegated', /SpeechSynthesisUtterance/.test(markdown) && /action\s*===\s*["']audio["']/.test(markdown)],
  ['SVG speaker clicks reach the delegated handler', /if\s*\(!\(target instanceof Element\)\)\s*return/.test(markdown)],
  ['active state is reset on cleanup', /resetSpeechState/.test(markdown) && /speechSynthesis\?\.cancel/.test(markdown)],
  ['vocabulary styles use semantic theme colors', /md-vocabulary-entry__play/.test(styles) && /md-color-secondary/.test(styles) && /md-color-tertiary/.test(styles)],
  ['vocabulary styles wrap on mobile', /@media\s*\(max-width:\s*640px\)/.test(styles) && /md-vocabulary-entry__suffix/.test(styles)],
]

const failures = checks.filter(([, ok]) => !ok)
for (const [label] of checks) {
  console.log(`${failures.some(([name]) => name === label) ? 'FAIL' : 'PASS'} ${label}`)
}
if (failures.length) process.exitCode = 1
