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
  setValue: (value: string) => void
  getValue: () => string
}

type CreateMarkdownMonacoEditorOptions = {
  container: HTMLElement
  language: string
  value: string
  onChange: (value: string) => void
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

const MONACO_THEME_DARK = 'diesw-markdown-dark'
const MONACO_THEME_LIGHT = 'diesw-markdown-light'

const LANGUAGE_ALIASES: Record<string, string> = {
  asm: 'shell',
  assembly: 'shell',
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
  vue: 'html',
  vue3: 'html',
  qml: 'javascript',
  nextjs: 'typescript',
  next: 'typescript',
  tailwindcss: 'css',
  typst: 'markdown',
  typ: 'markdown',
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
  vlang: 'go',
  v: 'go',
  lean4: 'lean4',
  lean: 'lean4',
  coq: 'coq',
  gdscript: 'gdscript',
}

const EXTRA_LANGUAGES = new Set([
  'coq',
  'dot',
  'fortran',
  'gdscript',
  'latex',
  'lean4',
  'nim',
  'octave',
  'zig',
])

const LANGUAGE_CONTRIBUTIONS: LanguageContributionLoader[] = [
  () => import('monaco-editor/esm/vs/basic-languages/clojure/clojure.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/css/css.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/dart/dart.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/dockerfile/dockerfile.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/elixir/elixir.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/go/go.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/html/html.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/ini/ini.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/java/java.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/julia/julia.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/kotlin/kotlin.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/lua/lua.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/mdx/mdx.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/pascal/pascal.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/perl/perl.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/php/php.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/powershell/powershell.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/protobuf/protobuf.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/python/python.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/r/r.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/ruby/ruby.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/rust/rust.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/scala/scala.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/scss/scss.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/shell/shell.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/swift/swift.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/xml/xml.contribution.js'),
  () => import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'),
  () => import('monaco-editor/esm/vs/language/json/monaco.contribution.js'),
  () => import('monaco-editor/esm/vs/language/css/monaco.contribution.js'),
  () => import('monaco-editor/esm/vs/language/html/monaco.contribution.js'),
]

function currentMonacoTheme(): string {
  if (typeof document === 'undefined') return MONACO_THEME_DARK
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? MONACO_THEME_LIGHT
    : MONACO_THEME_DARK
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
      const [monaco, typescriptContribution] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api.js'),
        import('monaco-editor/esm/vs/language/typescript/monaco.contribution.js'),
      ])
      await Promise.all(LANGUAGE_CONTRIBUTIONS.map((loadContribution) => loadContribution()))
      defineThemes(monaco)
      registerExtraLanguages(monaco)
      registerSnippetCompletions(monaco)
      configureLanguageDefaults(typescriptContribution as unknown as TypeScriptContribution)
      return monaco
    })()
  }
  return monacoPromise
}

function defineThemes(monaco: MonacoModule) {
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
    },
  })
}

function registerExtraLanguages(monaco: MonacoModule) {
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
  return LANGUAGE_ALIASES[normalized] || normalized || 'plaintext'
}

function editorHeightFor(value: string): number {
  const lines = Math.max(6, value.split('\n').length + 1)
  return Math.min(Math.max(lines * 21 + 18, 160), 620)
}

function updateContainerHeight(container: HTMLElement, value: string) {
  container.style.height = `${editorHeightFor(value)}px`
}

export async function createMarkdownMonacoEditor(options: CreateMarkdownMonacoEditorOptions): Promise<MarkdownMonacoEditor> {
  const monaco = await loadMonaco()
  const language = resolveMonacoLanguage(options.language)
  const model = monaco.editor.createModel(options.value, language)
  const container = options.container
  updateContainerHeight(container, options.value)

  const editor = monaco.editor.create(container, {
    model,
    theme: currentMonacoTheme(),
    automaticLayout: true,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    glyphMargin: true,
    folding: true,
    foldingStrategy: 'auto',
    foldingHighlight: true,
    showFoldingControls: 'mouseover',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    minimap: {
      enabled: true,
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
    lineHeight: 21,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    wordWrap: 'off',
    stickyScroll: { enabled: true },
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
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
      editor.dispose()
      model.dispose()
    },
  }

  requestAnimationFrame(() => {
    editor.layout()
    api.focusEnd()
  })

  return api
}
