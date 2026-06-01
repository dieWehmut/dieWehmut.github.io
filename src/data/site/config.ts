import type { SiteConfig } from '../../types/content'

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
  email: 'diesehnsucht0@gmail.com',

  // --- Site Meta ---
  title: 'diesw-nexus',
  subtitle: 'diesw-nexus',
  description: 'Hi!This is dieWehmut.',
  siteUrl: 'https://diesw.tech',
  startedAt: '2025-08-24T22:00:00+08:00',

  // --- External Services ---
  googleAnalyticsId: 'G-TZG91QDSZ5',

  // --- ICP Filing (optional, set empty to hide) ---
  icpNumber: '20260803',
  icpText: '萌ICP备20260803号',

  // --- Feature Flags (set false to hide page & nav entry) ---
  enableInfra: true,
  enableProject: true,

  // --- Social Links ---
  links: [
    { label: 'GitHub', url: 'https://github.com/dieWehmut' },
    { label: 'Website', url: 'https://diesw.tech' },
  ],
}

export default siteConfig
