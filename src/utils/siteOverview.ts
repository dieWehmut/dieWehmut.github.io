export const SITE_OVERVIEW_STAT_ORDER = [
  'posts',
  'notes',
  'infra',
  'capture',
  'project',
  'tags',
] as const

export type SiteOverviewStatKey = (typeof SITE_OVERVIEW_STAT_ORDER)[number]

export interface SiteOverviewCounts {
  posts: number
  notes: number
  infra: number
  capture: number | null
  project: number
  tags: number
}

export interface SiteOverviewFeatureFlags {
  enableInfra?: boolean
  enableProject?: boolean
}

export interface SiteOverviewStat {
  key: SiteOverviewStatKey
  label: string
  value: number | null
  path: string
}

const STAT_LABELS: Record<SiteOverviewStatKey, string> = {
  posts: 'Posts',
  notes: 'Notes',
  infra: 'Infra',
  capture: 'Capture',
  project: 'Project',
  tags: 'Tags',
}

const STAT_PATHS: Record<SiteOverviewStatKey, string> = {
  posts: '/archive',
  notes: '/notes',
  infra: '/infra',
  capture: '/capture',
  project: '/project',
  tags: '/tags',
}

export function buildSiteOverviewStats(
  counts: SiteOverviewCounts,
  featureFlags: SiteOverviewFeatureFlags = {},
): SiteOverviewStat[] {
  return SITE_OVERVIEW_STAT_ORDER
    .filter((key) => {
      if (key === 'infra') return featureFlags.enableInfra !== false
      if (key === 'project') return featureFlags.enableProject !== false
      return true
    })
    .map((key) => ({
      key,
      label: STAT_LABELS[key],
      value: counts[key],
      path: STAT_PATHS[key],
    }))
}

export function countUniqueProjects(items: Array<{ name?: string }> = []): number {
  const names = new Set<string>()
  for (const item of items) {
    const name = String(item?.name || '').trim().toLowerCase()
    if (name) names.add(name)
  }
  return names.size
}

export interface SiteUptimeParts {
  days: string
  hours: string
  minutes: string
  seconds: string
}

export function formatSiteUptime(startedAt: string | number | Date, now = Date.now()): SiteUptimeParts {
  const start = startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime()
  const elapsed = Math.max(0, Number.isFinite(start) ? Math.floor((now - start) / 1000) : 0)
  let diff = elapsed

  const days = Math.floor(diff / 86400)
  diff -= days * 86400
  const hours = Math.floor(diff / 3600)
  diff -= hours * 3600
  const minutes = Math.floor(diff / 60)
  const seconds = diff - minutes * 60

  return {
    days: String(days),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

export interface SiteFooterConfig {
  displayName: string
  githubUser: string
  icpNumber?: string
  icpText?: string
}

export interface SiteFooterRuntime {
  hostname?: string
  now?: Date | number
}

export interface SiteFooterIcp {
  text: string
  href: string
}

export interface SiteFooterMeta {
  displayName: string
  githubUser: string
  githubProfileUrl: string
  copyrightYear: string
  copyrightText: string
  icp: SiteFooterIcp | null
}

export function buildSiteFooterMeta(
  config: SiteFooterConfig,
  runtime: SiteFooterRuntime = {},
): SiteFooterMeta {
  const hostname = String(runtime.hostname || '').trim()
  const githubUser = hostname.toLowerCase().endsWith('github.io')
    ? hostname.split('.')[0] || config.githubUser
    : config.githubUser
  const now = runtime.now instanceof Date ? runtime.now : new Date(runtime.now ?? Date.now())
  const copyrightYear = String(Number.isNaN(now.getTime()) ? new Date().getFullYear() : now.getFullYear())
  const icpNumber = String(config.icpNumber || '').trim()

  return {
    displayName: config.displayName,
    githubUser,
    githubProfileUrl: `https://github.com/${githubUser}`,
    copyrightYear,
    copyrightText: `\u00a9 ${copyrightYear} ${config.displayName}`,
    icp: icpNumber
      ? {
          text: config.icpText || icpNumber,
          href: `https://icp.gov.moe/?keyword=${icpNumber}`,
        }
      : null,
  }
}
