import type { SiteColorScheme } from '../../types/content'

export type SiteThemeMode = 'light' | 'dark'

export type SiteColorSchemeTokens = {
  accent: string
  accentRgb: string
  tagColor: string
}

export type SiteColorSchemeOption = {
  id: SiteColorScheme
  label: string
  preview: string
  light: SiteColorSchemeTokens
  dark: SiteColorSchemeTokens
}

export const DEFAULT_SITE_COLOR_SCHEME: SiteColorScheme = 'purple'

export const siteColorSchemes: Record<SiteColorScheme, SiteColorSchemeOption> = {
  green: {
    id: 'green',
    label: 'Green',
    preview: '#1fc41f',
    light: {
      accent: '#1a9e1a',
      accentRgb: '26 158 26',
      tagColor: 'rgba(80, 80, 80, 0.9)',
    },
    dark: {
      accent: '#1fc41f',
      accentRgb: '31 196 31',
      tagColor: 'rgba(190, 190, 190, 0.82)',
    },
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    preview: '#9b3dff',
    light: {
      accent: '#8f35ff',
      accentRgb: '143 53 255',
      tagColor: 'rgba(88, 62, 126, 0.92)',
    },
    dark: {
      accent: '#9b3dff',
      accentRgb: '155 61 255',
      tagColor: 'rgba(214, 194, 255, 0.9)',
    },
  },
}

export const siteColorSchemeOptions = Object.values(siteColorSchemes)

export function isSiteColorScheme(value: unknown): value is SiteColorScheme {
  return value === 'green' || value === 'purple'
}

export function resolveSiteColorScheme(value: unknown): SiteColorScheme {
  return isSiteColorScheme(value) ? value : DEFAULT_SITE_COLOR_SCHEME
}

export function getSiteColorSchemeTokens(
  scheme: SiteColorScheme,
  mode: SiteThemeMode
): SiteColorSchemeTokens {
  return siteColorSchemes[scheme][mode]
}

export function applySiteColorScheme(scheme: SiteColorScheme, mode: SiteThemeMode) {
  if (typeof document === 'undefined') return

  const resolvedScheme = resolveSiteColorScheme(scheme)
  const tokens = getSiteColorSchemeTokens(resolvedScheme, mode)
  const root = document.documentElement

  root.setAttribute('data-color-scheme', resolvedScheme)
  root.style.setProperty('--site-accent', tokens.accent)
  root.style.setProperty('--site-accent-rgb', tokens.accentRgb)
  root.style.setProperty('--site-tag-color', tokens.tagColor)
}
