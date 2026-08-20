import type { SiteConfig } from '../../types/content'

/**
 * Site-wide personal configuration.
 * All personal / private data is centralized here.
 * ⚠️  Modify this file to personalize your site.
 *
 * Maintainer note: in the upstream repository this file is named `config.starter.ts`
 * and `.github/workflows/sync-starter.yml` copies it over `config.ts` when exporting
 * the template. It is type-annotated and lives in the source tree so that `vue-tsc`
 * checks it: a new required field on `SiteConfig` breaks the build upstream instead
 * of silently shipping an incomplete `config.ts` to every fork.
 */

type CodeRunnerEnv = {
  VITE_CODE_RUNNER_API_URL?: string
  VITE_CODE_RUNNER_API_TOKEN?: string
}

const viteEnv = (import.meta.env || {}) as CodeRunnerEnv
const processEnv = typeof process === 'undefined' ? {} : process.env

export const siteConfig: SiteConfig = {
  // --- Identity ---
  githubUser: 'your-github-username',
  githubRepo: 'your-github-username.github.io',
  // Where this code came from. Keep it as-is after forking: your own repository
  // is not the template you forked from.
  templateRepoUrl: 'https://github.com/dieWehmut/diesuwa-starter',
  owner: 'your-name',
  displayName: 'your-name',
  email: 'you@example.com',

  // --- Site Meta ---
  title: 'my-nexus',
  subtitle: 'my-nexus',
  description: 'Hi! This is my personal site.',
  siteUrl: 'https://your-github-username.github.io/your-repo/',
  startedAt: '2026-05-01T00:00:00+08:00',
  colorScheme: 'purple',

  // --- External Services ---
  googleAnalyticsId: '',

  // --- ICP Filing (optional, set empty to hide) ---
  icpNumber: '',
  icpText: '',

  // --- Feature Flags (set false to hide page & nav entry) ---
  enableInfra: true,
  enableProject: true,

  // --- Code Runner ---
  codeRunner: {
    backendApiUrl: viteEnv.VITE_CODE_RUNNER_API_URL || processEnv.VITE_CODE_RUNNER_API_URL || '',
    backendToken: viteEnv.VITE_CODE_RUNNER_API_TOKEN || processEnv.VITE_CODE_RUNNER_API_TOKEN || '',
  },

  // --- Social Links ---
  links: [
    { label: 'GitHub', url: 'https://github.com/your-github-username' },
    { label: 'Website', url: 'https://your-github-username.github.io/your-repo/' },
  ],
}

export default siteConfig
