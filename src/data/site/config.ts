import type { SiteConfig } from '../../types/content'
import templateIdentity from './template-identity.json'

// 图标走 `/capture-assets/` 这条构建期公共资源通道（和 InfraView 一样），不让
// 打包器参与解析：本仓库不追踪任何图片（scripts/sync-assets-repo.mjs 有硬性守卫），
// 所以 `src/assets/icon.png` 只在本地存在。CI 检出里没有它时，Vite 会把
// `new URL(..., import.meta.url)` 原样留下，线上就只能 404。真正的文件由
// scripts/generate-capture.mjs 从私有 assets 仓库拷进 public/，本地与 CI 同路。
const consoleIcon = '/capture-assets/site/icon.png'

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
  templateRepoUrl: templateIdentity.repositoryUrl,
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
    iconForm: 'grayscale',
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
