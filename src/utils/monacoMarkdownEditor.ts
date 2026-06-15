import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

type MonacoModule = typeof Monaco

export type MarkdownMonacoEditor = {
  container: HTMLElement
  editor: Monaco.editor.IStandaloneCodeEditor
  model: Monaco.editor.ITextModel
  dispose: () => void
  focusEnd: () => void
  layout: () => void
  setReadOnly: (readOnly: boolean) => void
  setValue: (value: string) => void
  getValue: () => string
}

type CreateMarkdownMonacoEditorOptions = {
  container: HTMLElement
  language: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

type LanguageContributionLoader = () => Promise<unknown>
type TypeScriptLanguageDefaults = {
  setCompilerOptions: (options: {
    allowJs: boolean
    checkJs: boolean
    jsx: number
    target: number
    moduleResolution: number
    allowNonTsExtensions: boolean
  }) => void
}
type TypeScriptContribution = {
  JsxEmit: { ReactJSX: number }
  ModuleResolutionKind: { NodeJs: number }
  ScriptTarget: { ESNext: number }
  javascriptDefaults: TypeScriptLanguageDefaults
  typescriptDefaults: TypeScriptLanguageDefaults
}

let monacoPromise: Promise<MonacoModule> | null = null
let completionRegistered = false
let extraLanguagesRegistered = false
let themesDefined = false
let typeScriptDefaultsConfigured = false
let typeScriptContributionPromise: Promise<TypeScriptContribution> | null = null
const loadedLanguageContributions = new Map<string, Promise<unknown>>()

const MONACO_THEME_DARK = 'diesw-markdown-dark'
const MONACO_THEME_LIGHT = 'diesw-markdown-light'
const MONACO_LINE_HEIGHT = 21
const MONACO_VERTICAL_PADDING = 8
const MONACO_MIN_HEIGHT = 37
const MONACO_MAX_HEIGHT = 620

const LANGUAGE_ALIASES: Record<string, string> = {
  asm: 'assembly',
  assembly: 'assembly',
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  c: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  csharp: 'csharp',
  cs: 'csharp',
  fsharp: 'fsharp',
  fs: 'fsharp',
  go: 'go',
  golang: 'go',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  jsx: 'javascript',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  mdx: 'mdx',
  python: 'python',
  py: 'python',
  ruby: 'ruby',
  rb: 'ruby',
  rust: 'rust',
  rs: 'rust',
  sql: 'sql',
  sqlite: 'sql',
  sqlite3: 'sql',
  php: 'php',
  perl: 'perl',
  lua: 'lua',
  r: 'r',
  rscript: 'r',
  scala: 'scala',
  java: 'java',
  kotlin: 'kotlin',
  kt: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  elixir: 'elixir',
  ex: 'elixir',
  erlang: 'erlang',
  erl: 'erlang',
  clojure: 'clojure',
  clj: 'clojure',
  haskell: 'haskell',
  hs: 'haskell',
  ocaml: 'ocaml',
  ml: 'ocaml',
  pascal: 'pascal',
  prolog: 'prolog',
  powershell: 'powershell',
  ps1: 'powershell',
  yaml: 'yaml',
  yml: 'yaml',
  ini: 'ini',
  toml: 'ini',
  dockerfile: 'dockerfile',
  graphql: 'graphql',
  protobuf: 'protobuf',
  coffeescript: 'coffeescript',
  coffee: 'coffeescript',
  bat: 'bat',
  batch: 'bat',
  hcl: 'hcl',
  terraform: 'hcl',
  tf: 'hcl',
  mysql: 'mysql',
  postgres: 'pgsql',
  postgresql: 'pgsql',
  pgsql: 'pgsql',
  pg: 'pgsql',
  objc: 'objective-c',
  objectivec: 'objective-c',
  'objective-c': 'objective-c',
  redis: 'redis',
  solidity: 'sol',
  sol: 'sol',
  vue: 'html',
  vue3: 'html',
  qml: 'javascript',
  nextjs: 'typescript',
  next: 'typescript',
  tailwindcss: 'css',
  typst: 'typst',
  typ: 'typst',
  latex: 'latex',
  tex: 'latex',
  graphviz: 'dot',
  dot: 'dot',
  octave: 'octave',
  m: 'octave',
  fortran: 'fortran',
  f90: 'fortran',
  zig: 'zig',
  nim: 'nim',
  crystal: 'ruby',
  racket: 'scheme',
  rkt: 'scheme',
  cangjie: 'cpp',
  mojo: 'python',
  nextflow: 'groovy',
  nf: 'groovy',
  wdl: 'hcl',
  gleam: 'gleam',
  julia: 'julia',
  jl: 'julia',
  vlang: 'go',
  v: 'go',
  lean4: 'lean4',
  lean: 'lean4',
  coq: 'coq',
  gdscript: 'gdscript',
}

const EXTRA_LANGUAGES = new Set([
  'assembly',
  'coq',
  'dot',
  'erlang',
  'fortran',
  'gdscript',
  'gleam',
  'groovy',
  'haskell',
  'latex',
  'lean4',
  'nim',
  'ocaml',
  'octave',
  'prolog',
  'typst',
  'zig',
])

const KNOWN_MONACO_LANGUAGES = new Set([
  'plaintext',
  ...Object.values(LANGUAGE_ALIASES),
  ...EXTRA_LANGUAGES,
])

const LANGUAGE_CONTRIBUTIONS: Record<string, LanguageContributionLoader> = {
  bat: () => import('monaco-editor/esm/vs/basic-languages/bat/bat.contribution.js'),
  clojure: () => import('monaco-editor/esm/vs/basic-languages/clojure/clojure.contribution.js'),
  coffeescript: () => import('monaco-editor/esm/vs/basic-languages/coffee/coffee.contribution.js'),
  cpp: () => import('monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js'),
  csharp: () => import('monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js'),
  css: () => import('monaco-editor/esm/vs/language/css/monaco.contribution.js'),
  dart: () => import('monaco-editor/esm/vs/basic-languages/dart/dart.contribution.js'),
  dockerfile: () => import('monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js'),
  elixir: () => import('monaco-editor/esm/vs/basic-languages/elixir/elixir.contribution.js'),
  fsharp: () => import('monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution.js'),
  go: () => import('monaco-editor/esm/vs/basic-languages/go/go.contribution.js'),
  graphql: () => import('monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js'),
  hcl: () => import('monaco-editor/esm/vs/basic-languages/hcl/hcl.contribution.js'),
  html: () => import('monaco-editor/esm/vs/language/html/monaco.contribution.js'),
  ini: () => import('monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js'),
  java: () => import('monaco-editor/esm/vs/basic-languages/java/java.contribution.js'),
  javascript: () => import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js'),
  json: () => import('monaco-editor/esm/vs/language/json/monaco.contribution.js'),
  julia: () => import('monaco-editor/esm/vs/basic-languages/julia/julia.contribution.js'),
  kotlin: () => import('monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution.js'),
  lua: () => import('monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js'),
  markdown: () => import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'),
  mdx: () => import('monaco-editor/esm/vs/basic-languages/mdx/mdx.contribution.js'),
  mysql: () => import('monaco-editor/esm/vs/basic-languages/mysql/mysql.contribution.js'),
  'objective-c': () => import('monaco-editor/esm/vs/basic-languages/objective-c/objective-c.contribution.js'),
  pascal: () => import('monaco-editor/esm/vs/basic-languages/pascal/pascal.contribution.js'),
  perl: () => import('monaco-editor/esm/vs/basic-languages/perl/perl.contribution.js'),
  pgsql: () => import('monaco-editor/esm/vs/basic-languages/pgsql/pgsql.contribution.js'),
  php: () => import('monaco-editor/esm/vs/basic-languages/php/php.contribution.js'),
  powershell: () => import('monaco-editor/esm/vs/basic-languages/powershell/powershell.contribution.js'),
  protobuf: () => import('monaco-editor/esm/vs/basic-languages/protobuf/protobuf.contribution.js'),
  python: () => import('monaco-editor/esm/vs/basic-languages/python/python.contribution.js'),
  r: () => import('monaco-editor/esm/vs/basic-languages/r/r.contribution.js'),
  redis: () => import('monaco-editor/esm/vs/basic-languages/redis/redis.contribution.js'),
  ruby: () => import('monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution.js'),
  rust: () => import('monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js'),
  scala: () => import('monaco-editor/esm/vs/basic-languages/scala/scala.contribution.js'),
  scheme: () => import('monaco-editor/esm/vs/basic-languages/scheme/scheme.contribution.js'),
  scss: () => import('monaco-editor/esm/vs/basic-languages/scss/scss.contribution.js'),
  shell: () => import('monaco-editor/esm/vs/basic-languages/shell/shell.contribution.js'),
  sol: () => import('monaco-editor/esm/vs/basic-languages/solidity/solidity.contribution.js'),
  sql: () => import('monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js'),
  swift: () => import('monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js'),
  typescript: () => import('monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js'),
  xml: () => import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js'),
  yaml: () => import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'),
}

function currentMonacoTheme(): string {
  return MONACO_THEME_DARK
}

function configureWorkers() {
  globalThis.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      switch (label) {
        case 'json':
          return new JsonWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new CssWorker()
        case 'html':
        case 'handlebars':
        case 'razor':
          return new HtmlWorker()
        case 'typescript':
        case 'javascript':
          return new TsWorker()
        default:
          return new EditorWorker()
      }
    },
  }
}

async function loadMonaco(): Promise<MonacoModule> {
  if (!monacoPromise) {
    configureWorkers()
    monacoPromise = (async () => {
      const monaco = await import('monaco-editor/esm/vs/editor/editor.api.js')
      defineThemes(monaco)
      registerExtraLanguages(monaco)
      registerSnippetCompletions(monaco)
      return monaco
    })()
  }
  return monacoPromise
}

async function ensureTypeScriptDefaults() {
  if (!typeScriptContributionPromise) {
    typeScriptContributionPromise = import('monaco-editor/esm/vs/language/typescript/monaco.contribution.js') as unknown as Promise<TypeScriptContribution>
  }

  if (typeScriptDefaultsConfigured) return
  const typescriptContribution = await typeScriptContributionPromise
  configureLanguageDefaults(typescriptContribution)
  typeScriptDefaultsConfigured = true
}

async function loadLanguageContribution(language: string) {
  const loader = LANGUAGE_CONTRIBUTIONS[language]
  if (!loader) return

  let loading = loadedLanguageContributions.get(language)
  if (!loading) {
    loading = loader()
    loadedLanguageContributions.set(language, loading)
  }

  await loading
}

async function prepareMonacoLanguage(language: string) {
  await loadLanguageContribution(language)
  if (language === 'javascript' || language === 'typescript') {
    await ensureTypeScriptDefaults()
  }
}

function defineThemes(monaco: MonacoModule) {
  if (themesDefined) return
  themesDefined = true

  monaco.editor.defineTheme(MONACO_THEME_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'bb9af7' },
      { token: 'string', foreground: '9ece6a' },
      { token: 'number', foreground: 'ff9e64' },
      { token: 'type', foreground: '7dcfff' },
      { token: 'function', foreground: '7aa2f7' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#c9d1d9',
      'editorGutter.background': '#0d1117',
      'editorCursor.foreground': '#58a6ff',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#1f2937',
      'editorIndentGuide.background1': '#30363d',
      'editorIndentGuide.activeBackground1': '#8b949e',
      'editor.foldBackground': '#1f6feb26',
      'editorWidget.background': '#161b22',
      'editorWidget.border': '#30363d',
      'editorSuggestWidget.background': '#161b22',
      'editorSuggestWidget.border': '#30363d',
      'editorSuggestWidget.selectedBackground': '#1f6feb44',
      'editorHoverWidget.background': '#161b22',
      'editorHoverWidget.border': '#30363d',
      'scrollbarSlider.background': '#1fc41f66',
      'scrollbarSlider.hoverBackground': '#1fc41f99',
      'scrollbarSlider.activeBackground': '#1fc41fcc',
      'minimapSlider.background': '#1fc41f33',
      'minimapSlider.hoverBackground': '#1fc41f55',
      'minimapSlider.activeBackground': '#1fc41f77',
    },
  })

  monaco.editor.defineTheme(MONACO_THEME_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cf222e' },
      { token: 'string', foreground: '0a3069' },
      { token: 'number', foreground: '0550ae' },
      { token: 'type', foreground: '953800' },
      { token: 'function', foreground: '8250df' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292f',
      'editorLineNumber.foreground': '#6e7781',
      'editorLineNumber.activeForeground': '#24292f',
      'editorGutter.background': '#ffffff',
      'editorCursor.foreground': '#0969da',
      'editor.selectionBackground': '#0969da33',
      'editor.inactiveSelectionBackground': '#afb8c133',
      'editorIndentGuide.background1': '#d8dee4',
      'editorIndentGuide.activeBackground1': '#6e7781',
      'editor.foldBackground': '#0969da18',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#d0d7de',
      'editorSuggestWidget.background': '#ffffff',
      'editorSuggestWidget.border': '#d0d7de',
      'editorSuggestWidget.selectedBackground': '#ddf4ff',
      'editorHoverWidget.background': '#ffffff',
      'editorHoverWidget.border': '#d0d7de',
      'scrollbarSlider.background': '#1f9d5566',
      'scrollbarSlider.hoverBackground': '#1f9d5599',
      'scrollbarSlider.activeBackground': '#1f9d55cc',
      'minimapSlider.background': '#1f9d5533',
      'minimapSlider.hoverBackground': '#1f9d5555',
      'minimapSlider.activeBackground': '#1f9d5577',
    },
  })
}

function registerExtraLanguages(monaco: MonacoModule) {
  if (extraLanguagesRegistered) return
  extraLanguagesRegistered = true

  const existing = new Set(monaco.languages.getLanguages().map((language) => language.id))
  EXTRA_LANGUAGES.forEach((language) => {
    if (!existing.has(language)) monaco.languages.register({ id: language })
  })

  monaco.languages.setMonarchTokensProvider('latex', {
    tokenizer: {
      root: [
        [/%.*/, 'comment'],
        [/\\[a-zA-Z@]+/, 'keyword'],
        [/\\./, 'keyword'],
        [/[{}()[\]]/, '@brackets'],
        [/\$[^$]*\$/, 'string'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('dot', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/\b(digraph|graph|subgraph|node|edge|strict)\b/, 'keyword'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/[{}[\]=;,]/, '@brackets'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('assembly', {
    tokenizer: {
      root: [
        [/[;#].*$/, 'comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/^\s*[A-Za-z_.$][\w.$]*:/, 'type'],
        [/\b(section|global|extern|bits|align|db|dw|dd|dq|resb|resw|resd|text|data|bss)\b/i, 'keyword'],
        [/\b(mov|lea|push|pop|add|sub|mul|imul|div|idiv|inc|dec|and|or|xor|not|shl|shr|cmp|test|jmp|je|jne|jg|jge|jl|jle|call|ret|nop|syscall|int)\b/i, 'function'],
        [/\b(eax|ebx|ecx|edx|esi|edi|esp|ebp|rax|rbx|rcx|rdx|rsi|rdi|rsp|rbp|r8|r9|r10|r11|r12|r13|r14|r15)\b/i, 'type'],
        [/\b(0x[0-9a-f]+|\d+)\b/i, 'number'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('erlang', {
    tokenizer: {
      root: [
        [/%.*/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'[^']*'/, 'string'],
        [/\b(after|begin|case|catch|cond|end|fun|if|let|of|query|receive|try|when)\b/, 'keyword'],
        [/\b(module|export|import|define|record|spec|callback)\b/, 'keyword'],
        [/\b[A-Z_][\w@]*/, 'type'],
        [/\b[a-z][\w@]*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [/[{}()[\],.;]/, '@brackets'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('fortran', {
    tokenizer: {
      root: [
        [/!.*/, 'comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(program|module|subroutine|function|end|implicit|none|integer|real|logical|character|if|then|else|do|while|select|case|contains|call|return|use|only|intent|in|out|inout|print|write|read)\b/i, 'keyword'],
        [/\b(true|false)\b/i, 'keyword'],
        [/\b[a-z_]\w*(?=\()/i, 'function'],
        [/\b\d+(\.\d+)?([ed][+-]?\d+)?\b/i, 'number'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('gdscript', {
    tokenizer: {
      root: [
        [/#.*/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\b(class_name|extends|func|var|const|signal|enum|if|elif|else|for|while|match|break|continue|return|pass|await|yield|preload|load|self|super)\b/, 'keyword'],
        [/\b(true|false|null|PI|TAU|INF|NAN)\b/, 'keyword'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b[a-z_]\w*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('gleam', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\b(import|pub|fn|let|const|type|opaque|external|if|case|todo|panic|use|as|assert)\b/, 'keyword'],
        [/\b(True|False|Nil|Ok|Error)\b/, 'keyword'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b[a-z_]\w*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [/[{}()[\],|]/, '@brackets'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('groovy', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(abstract|as|assert|break|case|catch|class|const|continue|def|default|do|else|enum|extends|final|finally|for|if|implements|import|in|instanceof|interface|new|null|package|return|super|switch|this|throw|throws|trait|try|while)\b/, 'keyword'],
        [/\b(true|false)\b/, 'keyword'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b[a-zA-Z_$][\w$]*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('haskell', {
    tokenizer: {
      root: [
        [/--.*$/, 'comment'],
        [/\{-/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(case|class|data|default|deriving|do|else|foreign|if|import|in|infix|infixl|infixr|instance|let|module|newtype|of|then|type|where)\b/, 'keyword'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b[a-z_]\w*(?=\s*(::|=))/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      comment: [
        [/[^\-{}]+/, 'comment'],
        [/\}-/, 'comment', '@pop'],
        [/[-{}]/, 'comment'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('lean4', {
    tokenizer: {
      root: [
        [/--.*$/, 'comment'],
        [/\/-/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\b(def|theorem|lemma|example|inductive|structure|class|instance|namespace|section|end|open|import|where|by|match|with|if|then|else|let|have|show|fun|forall|exists)\b/, 'keyword'],
        [/\b(Type|Prop|Sort|Nat|Int|String|Bool|True|False)\b/, 'type'],
        [/\b[a-zA-Z_]\w*(?=\s*[:=])/, 'function'],
        [/\b\d+\b/, 'number'],
      ],
      comment: [
        [/[^/-]+/, 'comment'],
        [/-\//, 'comment', '@pop'],
        [/[/-]/, 'comment'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('coq', {
    tokenizer: {
      root: [
        [/\(\*/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/\b(Theorem|Lemma|Definition|Fixpoint|Inductive|CoInductive|Record|Module|Section|End|Proof|Qed|Defined|Admitted|Require|Import|From|Check|Compute|Search|match|with|end|fun|forall|exists|let|in|if|then|else)\b/, 'keyword'],
        [/\b(Prop|Set|Type|nat|bool|true|false)\b/, 'type'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b\d+\b/, 'number'],
      ],
      comment: [
        [/[^*(]+/, 'comment'],
        [/\*\)/, 'comment', '@pop'],
        [/[*(]/, 'comment'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('nim', {
    tokenizer: {
      root: [
        [/#.*/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(addr|and|as|asm|bind|block|break|case|cast|concept|const|continue|converter|defer|discard|distinct|div|do|elif|else|end|enum|except|export|finally|for|from|func|if|import|in|include|interface|is|isnot|iterator|let|macro|method|mixin|mod|nil|not|notin|object|of|or|out|proc|ptr|raise|ref|return|shl|shr|static|template|try|tuple|type|using|var|when|while|xor|yield)\b/, 'keyword'],
        [/\b(true|false)\b/, 'keyword'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b[a-zA-Z_]\w*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('ocaml', {
    tokenizer: {
      root: [
        [/\(\*/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(and|as|assert|begin|class|constraint|do|done|downto|else|end|exception|external|false|for|fun|function|functor|if|in|include|inherit|initializer|lazy|let|match|method|module|mutable|new|nonrec|object|of|open|or|private|rec|sig|struct|then|to|true|try|type|val|virtual|when|while|with)\b/, 'keyword'],
        [/\b[A-Z]\w*\b/, 'type'],
        [/\b[a-z_]\w*(?=\s*=)/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      comment: [
        [/[^*(]+/, 'comment'],
        [/\*\)/, 'comment', '@pop'],
        [/[*(]/, 'comment'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('octave', {
    tokenizer: {
      root: [
        [/[#%].*/, 'comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(break|case|catch|classdef|continue|do|else|elseif|end|end_try_catch|end_unwind_protect|endclassdef|endenumeration|endevents|endfor|endif|endmethods|endparfor|endproperties|endswitch|endwhile|for|function|global|if|otherwise|persistent|return|switch|try|until|unwind_protect|while)\b/, 'keyword'],
        [/\b(true|false|pi|eps|inf|nan)\b/, 'keyword'],
        [/\b[a-zA-Z_]\w*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('prolog', {
    tokenizer: {
      root: [
        [/%.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/(:-|\\\+|->|;|,|\.)/, 'keyword'],
        [/\b(is|not|mod|div|fail|true|false|call|once|findall|bagof|setof)\b/, 'keyword'],
        [/\b[A-Z_]\w*/, 'type'],
        [/\b[a-z]\w*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('typst', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/#(let|set|show|import|include|if|else|for|while|return|align|figure|table|grid|image|link|ref|cite|bibliography)\b/, 'keyword'],
        [/#\w+(?=\()/, 'function'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\$[^$]*\$/, 'string'],
        [/\b\d+(\.\d+)?(pt|em|cm|mm|in|deg|rad|%?)\b/, 'number'],
        [/\*[^\*]+\*/, 'keyword'],
        [/\[[^\]]+\]/, 'type'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
  monaco.languages.setMonarchTokensProvider('zig', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\b(addrspace|align|allowzero|and|anyframe|anytype|asm|async|await|break|callconv|catch|comptime|const|continue|defer|else|enum|errdefer|error|export|extern|fn|for|if|inline|linksection|noalias|noinline|nosuspend|null|opaque|or|orelse|packed|pub|resume|return|struct|suspend|switch|test|threadlocal|try|union|unreachable|usingnamespace|var|volatile|while)\b/, 'keyword'],
        [/\b(true|false|undefined)\b/, 'keyword'],
        [/\b(u8|u16|u32|u64|usize|i8|i16|i32|i64|isize|f16|f32|f64|bool|void)\b/, 'type'],
        [/\b[a-zA-Z_]\w*(?=\()/, 'function'],
        [/\b\d+(\.\d+)?\b/, 'number'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  })
}

function configureLanguageDefaults(typescriptContribution: TypeScriptContribution) {
  const compilerOptions = {
    allowJs: true,
    checkJs: true,
    jsx: typescriptContribution.JsxEmit.ReactJSX,
    target: typescriptContribution.ScriptTarget.ESNext,
    moduleResolution: typescriptContribution.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
  }
  typescriptContribution.typescriptDefaults.setCompilerOptions(compilerOptions)
  typescriptContribution.javascriptDefaults.setCompilerOptions(compilerOptions)
}

function snippet(label: string, insertText: string, detail: string): Omit<Monaco.languages.CompletionItem, 'range'> {
  return {
    label,
    kind: 27,
    insertText,
    insertTextRules: 4,
    detail,
  }
}

function registerSnippetCompletions(monaco: MonacoModule) {
  if (completionRegistered) return
  completionRegistered = true

  const snippets: Record<string, Array<Omit<Monaco.languages.CompletionItem, 'range'>>> = {
    go: [
      snippet('main package', 'package main\n\nimport "fmt"\n\nfunc main() {\n\t$0\n}', 'Sandkasten Go entrypoint'),
      snippet('fmt.Println', 'fmt.Println($0)', 'Print line'),
    ],
    python: [
      snippet('main guard', 'def main():\n    $0\n\nif __name__ == "__main__":\n    main()', 'Python entrypoint'),
      snippet('print', 'print($0)', 'Print value'),
    ],
    rust: [
      snippet('main fn', 'fn main() {\n    $0\n}', 'Rust entrypoint'),
      snippet('println!', 'println!("{}"$0);', 'Print line'),
    ],
    cpp: [
      snippet('main', '#include <iostream>\n\nint main() {\n    $0\n    return 0;\n}', 'C/C++ entrypoint'),
    ],
    java: [
      snippet('Main class', 'public class Main {\n    public static void main(String[] args) {\n        $0\n    }\n}', 'Java entrypoint'),
    ],
    javascript: [
      snippet('console.log', 'console.log($0)', 'Print value'),
    ],
    typescript: [
      snippet('console.log', 'console.log($0)', 'Print value'),
    ],
    shell: [
      snippet('strict mode', 'set -euo pipefail\n$0', 'Strict shell script'),
    ],
    sql: [
      snippet('select', 'SELECT $0;', 'SQL select'),
    ],
    latex: [
      snippet('article document', '\\documentclass{article}\n\\begin{document}\n$0\n\\end{document}', 'LaTeX document'),
    ],
    octave: [
      snippet('disp', 'disp("$0");', 'Octave output'),
    ],
  }

  Object.entries(snippets).forEach(([language, suggestions]) => {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }
        return {
          suggestions: suggestions.map((item) => ({ ...item, range })),
        }
      },
    })
  })
}

export function resolveMonacoLanguage(language: string): string {
  const normalized = language.trim().toLowerCase()
  if (!normalized) return 'plaintext'
  const aliased = LANGUAGE_ALIASES[normalized] || normalized
  return KNOWN_MONACO_LANGUAGES.has(aliased) ? aliased : 'plaintext'
}

export async function preloadMarkdownMonacoEditor(language = ''): Promise<void> {
  const monaco = await loadMonaco()
  const resolvedLanguage = resolveMonacoLanguage(language)
  if (resolvedLanguage === 'plaintext') return
  await prepareMonacoLanguage(resolvedLanguage)
  monaco.editor.setTheme(currentMonacoTheme())
}

function editorHeightFor(value: string): number {
  const lines = Math.max(1, value.split('\n').length)
  const contentHeight = lines * MONACO_LINE_HEIGHT + MONACO_VERTICAL_PADDING * 2
  return Math.min(Math.max(contentHeight, MONACO_MIN_HEIGHT), MONACO_MAX_HEIGHT)
}

function updateContainerHeight(container: HTMLElement, value: string) {
  container.style.height = `${editorHeightFor(value)}px`
}

export async function createMarkdownMonacoEditor(options: CreateMarkdownMonacoEditorOptions): Promise<MarkdownMonacoEditor> {
  const monaco = await loadMonaco()
  const language = resolveMonacoLanguage(options.language)
  const initialLanguage = language === 'plaintext' || EXTRA_LANGUAGES.has(language) ? language : 'plaintext'
  const model = monaco.editor.createModel(options.value, initialLanguage)
  if (language !== initialLanguage) {
    void prepareMonacoLanguage(language).then(() => {
      if (!model.isDisposed()) monaco.editor.setModelLanguage(model, language)
    })
  }
  const container = options.container
  const initialReadOnly = options.readOnly ?? false
  updateContainerHeight(container, options.value)

  const editor = monaco.editor.create(container, {
    model,
    theme: currentMonacoTheme(),
    automaticLayout: true,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    glyphMargin: false,
    lineDecorationsWidth: 0,
    folding: true,
    foldingStrategy: 'auto',
    foldingHighlight: true,
    showFoldingControls: 'always',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    minimap: {
      enabled: !initialReadOnly,
      side: 'right',
      showSlider: 'mouseover',
      maxColumn: 80,
    },
    overviewRulerBorder: false,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    fontSize: 13,
    lineHeight: MONACO_LINE_HEIGHT,
    padding: {
      top: 8,
      bottom: 8,
    },
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    wordWrap: 'off',
    stickyScroll: { enabled: true },
    quickSuggestions: !initialReadOnly,
    suggestOnTriggerCharacters: !initialReadOnly,
    acceptSuggestionOnEnter: 'smart',
    tabCompletion: 'on',
    formatOnPaste: true,
    formatOnType: true,
    renderWhitespace: 'selection',
    renderLineHighlight: 'all',
    fixedOverflowWidgets: true,
    contextmenu: true,
    links: true,
    mouseWheelZoom: true,
    scrollbar: {
      horizontalScrollbarSize: 3,
      verticalScrollbarSize: 3,
      useShadows: false,
      alwaysConsumeMouseWheel: false,
    },
    readOnly: initialReadOnly,
    domReadOnly: initialReadOnly,
    renderValidationDecorations: initialReadOnly ? 'off' : 'editable',
  })

  const sizeDisposable = editor.onDidContentSizeChange(() => {
    const height = Math.min(Math.max(editor.getContentHeight(), MONACO_MIN_HEIGHT), MONACO_MAX_HEIGHT)
    container.style.height = `${height}px`
    editor.layout()
  })

  const changeDisposable = model.onDidChangeContent(() => {
    const value = model.getValue()
    updateContainerHeight(container, value)
    editor.layout()
    options.onChange(value)
  })

  const themeObserver = new MutationObserver(() => {
    monaco.editor.setTheme(currentMonacoTheme())
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  const api: MarkdownMonacoEditor = {
    container,
    editor,
    model,
    getValue: () => model.getValue(),
    setValue(value: string) {
      if (model.getValue() !== value) model.setValue(value)
      updateContainerHeight(container, value)
      editor.layout()
    },
    layout: () => editor.layout(),
    setReadOnly(readOnly: boolean) {
      editor.updateOptions({
        readOnly,
        domReadOnly: readOnly,
        minimap: { enabled: !readOnly },
        quickSuggestions: !readOnly,
        suggestOnTriggerCharacters: !readOnly,
        renderValidationDecorations: readOnly ? 'off' : 'editable',
      })
      editor.layout()
    },
    focusEnd() {
      const lastLine = Math.max(1, model.getLineCount())
      const lastColumn = model.getLineMaxColumn(lastLine)
      editor.setPosition({ lineNumber: lastLine, column: lastColumn })
      editor.revealPositionInCenter({ lineNumber: lastLine, column: lastColumn })
      editor.focus()
    },
    dispose() {
      themeObserver.disconnect()
      changeDisposable.dispose()
      sizeDisposable.dispose()
      editor.dispose()
      model.dispose()
    },
  }

  requestAnimationFrame(() => {
    editor.layout()
    if (!initialReadOnly) api.focusEnd()
  })

  return api
}
