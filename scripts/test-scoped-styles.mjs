import fs from 'node:fs'
import path from 'node:path'
import * as sfc from 'vue/compiler-sfc'

// Vue 的 scoped 改写器只给选择器的最后一个复合部分补 [data-v-xxx]，所以祖先本来就是
// 全局匹配的 —— `:root[data-theme="light"] .foo` 无需任何 :global()。反过来，把
// :global() 当前缀用（`:global(X) Y`）会让改写器把 Y 整段丢掉，声明落到 X 身上。
//
// 这不是「写法不够漂亮」，是会静默改错元素：曾经 ConsoleOverviewHeader.vue 里
// `:global(html[data-theme="light"]) .console-overview__avatar--whiten { filter: brightness(0) }`
// 编译成 `html[data-theme="light"] { filter: brightness(0) }` —— 根元素上的 filter 会把
// 整个文档栅格化过一遍，亮色主题于是整页纯黑。只有整条选择器都包在 :global() 里
// （BounceCursor.vue 的用法）才是安全的。
//
// 所以这里不去手写 CSS 解析，而是把每个 scoped 块编译两遍：一遍开 scoped，一遍关。
// 关掉时 :global() 原样留着，开着时它已经生效。把两侧的 :global( / ) / 作用域属性 /
// 空白都抹掉再比 —— 相等说明改写只是加了个属性，不等就说明有一截选择器被吃掉了。
const root = path.resolve(import.meta.dirname, '..')
const SCOPE_ID = 'probe'
const checks = []

function check(label, condition) {
  checks.push([label, Boolean(condition)])
}

function listVueFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return listVueFiles(full)
    return entry.isFile() && entry.name.endsWith('.vue') ? [full] : []
  })
}

function compile(source, filename, scoped) {
  return sfc.compileStyle({ source, filename, id: SCOPE_ID, scoped }).code
}

// compileStyle 输出的规则顺序与源码一致，所以逐条取「{ 之前的那段」就是选择器，两侧
// 下标可以直接对齐。注释先剥掉（scoped=false 那遍会把它们留在原地），@ 开头的规则跳过
// —— @keyframes 的名字也会被打上作用域后缀，那是另一回事。
function selectorsOf(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(^|\n)\s*([^@{}][^{}]*?)\s*\{/g)]
    .map((match) => match[2].trim())
    .filter((selector) => !selector.includes('@'))
}

// :global / :deep / :slotted 只是告诉改写器把属性放到哪里，抹掉它们和括号后，两侧应当
// 剩下同一串选择器 —— 除了 scoped 那侧多一个作用域属性。
function normalize(selector) {
  return selector
    .replace(/:(global|deep|slotted)\(/g, '')
    .replaceAll(`[data-v-${SCOPE_ID}]`, '')
    .replace(/[\s)]/g, '')
}

const offenders = []
for (const file of listVueFiles(path.join(root, 'src'))) {
  const { descriptor } = sfc.parse(fs.readFileSync(file, 'utf8'), { filename: file })
  for (const style of descriptor.styles) {
    if (!style.scoped) continue
    const scoped = selectorsOf(compile(style.content, file, true))
    const source = selectorsOf(compile(style.content, file, false))
    if (scoped.length !== source.length) {
      offenders.push(`${path.relative(root, file).replaceAll('\\', '/')}: rule count changed`)
      continue
    }
    source.forEach((selector, index) => {
      if (normalize(selector) === normalize(scoped[index])) return
      offenders.push(
        `${path.relative(root, file).replaceAll('\\', '/')}: ${selector}  ->  ${scoped[index]}`,
      )
    })
  }
}

check(
  `no scoped selector loses part of itself when compiled${
    offenders.length ? `\n       ${offenders.join('\n       ')}` : ''
  }`,
  offenders.length === 0,
)

// 上面那条规则的理由，钉在编译器行为上：Vue 哪天改了这个语义，这里会红并解释自己。
function compiled(source) {
  return compile(source, 'probe.vue', true).replace(/\s+/g, ' ').trim()
}

check(
  'a :global() prefix drops the descendant it was meant to scope',
  compiled(':global(html[data-theme="light"]) .target { color: red; }')
    === 'html[data-theme="light"] { color: red; }',
)
check(
  'a bare ancestor keeps the descendant and scopes only it',
  compiled(':root[data-theme="light"] .target { color: red; }')
    === `:root[data-theme="light"] .target[data-v-${SCOPE_ID}] { color: red; }`,
)
check(
  'a fully wrapped :global() selector survives intact',
  compiled(':global(html.flag .target) { color: red; }') === 'html.flag .target { color: red; }',
)

// whiten 形态本身落在哪个元素上，由 test-console-avatar.mjs 断言 —— 那是头像的主张，
// 这里只管「编译不会吃掉选择器」这一条通用规则。

const failures = checks.filter(([, ok]) => !ok)
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`)
if (failures.length) process.exitCode = 1
