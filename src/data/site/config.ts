import type { SiteConfig } from '../../types/content'

// 用 `new URL(..., import.meta.url)` 而不是 `import icon from '...png'`：
// vite.config.ts 也引这个模块拿 githubUser/owner，esbuild 预打包配置时没有
// png loader，静态 import 会让整个 build 起不来。这种写法 Vite 构建时照样会
// 重写成带 hash 的资源 URL，但对 esbuild 只是个普通运行时表达式。
const consoleIcon = new URL('../../assets/icon.png', import.meta.url).href

type CodeRunnerEnv = {
  VITE_CODE_RUNNER_API_URL?: string
  VITE_CODE_RUNNER_API_TOKEN?: string
  DEV?: boolean
}

const viteEnv = (import.meta.env || {}) as CodeRunnerEnv
const processEnv = typeof process === 'undefined' ? {} : process.env
const codeRunnerApiUrl = viteEnv.VITE_CODE_RUNNER_API_URL || processEnv.VITE_CODE_RUNNER_API_URL || ''
const codeRunnerApiToken = viteEnv.VITE_CODE_RUNNER_API_TOKEN || processEnv.VITE_CODE_RUNNER_API_TOKEN || ''
const isDevRuntime = viteEnv.DEV === true || processEnv.NODE_ENV === 'development'

/**
 * Site-wide personal configuration.
 * All personal / private data is centralized here.
 * When using this project as a template, only this file (plus the data/site/*.ts lists)
 * needs to be modified.
 */

export const siteConfig: SiteConfig = {
  // --- Identity ---
  githubUser: 'dieWehmut',
  githubRepo: 'dieWehmut.github.io',
  owner: 'dieWehmut',
  displayName: 'diesw',
  email: 'diewehmut@outlook.com',

  // --- Site Meta ---
  title: 'diesw-nexus',
  subtitle: 'diesw-nexus',
  description: 'Hi!This is dieWehmut.',
  siteUrl: 'https://diewehmut.github.io',
  startedAt: '2025-08-24T22:00:00+08:00',
  colorScheme: 'purple',
  console: {
    icon: consoleIcon,
    darkIconEffect: 'grayscale',
  },

  // --- External Services ---
  googleAnalyticsId: 'G-TZG91QDSZ5',

  // --- ICP Filing (optional, set empty to hide) ---
  icpNumber: '20260803',
  icpText: '萌ICP备20260803号',

  // --- Feature Flags (set false to hide page & nav entry) ---
  enableInfra: true,
  enableProject: true,

  // --- Code Runner ---
  codeRunner: {
    backendApiUrl: codeRunnerApiUrl || (isDevRuntime ? 'http://127.0.0.1:8080' : ''),
    backendToken: codeRunnerApiToken,
  },

  // --- Social Links ---
  links: [
    { label: 'GitHub', url: 'https://github.com/dieWehmut' },
    { label: 'Website', url: 'https://diewehmut.github.io' },
  ],
}

export default siteConfig
