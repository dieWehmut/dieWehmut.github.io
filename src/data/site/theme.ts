import type { SiteColorScheme } from '../../types/content'

export type SiteThemeMode = 'light' | 'dark'

export type SiteColorSchemeTokens = {
  accent: string
  accentRgb: string
  secondary: string
  secondaryRgb: string
  tertiary: string
  tertiaryRgb: string
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
      secondary: '#8f35ff',
      secondaryRgb: '143 53 255',
      tertiary: '#e64a97',
      tertiaryRgb: '230 74 151',
      tagColor: 'rgba(80, 80, 80, 0.9)',
    },
    dark: {
      accent: '#1fc41f',
      accentRgb: '31 196 31',
      secondary: '#9b3dff',
      secondaryRgb: '155 61 255',
      tertiary: '#ff69b4',
      tertiaryRgb: '255 105 180',
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
      secondary: '#e64a97',
      secondaryRgb: '230 74 151',
      tertiary: '#1a9e1a',
      tertiaryRgb: '26 158 26',
      tagColor: 'rgba(88, 62, 126, 0.92)',
    },
    dark: {
      accent: '#9b3dff',
      accentRgb: '155 61 255',
      secondary: '#ff69b4',
      secondaryRgb: '255 105 180',
      tertiary: '#1fc41f',
      tertiaryRgb: '31 196 31',
      tagColor: 'rgba(214, 194, 255, 0.9)',
    },
  },
  pink: {
    id: 'pink',
    label: 'Pink',
    preview: '#ff69b4',
    light: {
      accent: '#e64a97',
      accentRgb: '230 74 151',
      secondary: '#8f35ff',
      secondaryRgb: '143 53 255',
      tertiary: '#1a9e1a',
      tertiaryRgb: '26 158 26',
      tagColor: 'rgba(126, 62, 96, 0.92)',
    },
    dark: {
      accent: '#ff69b4',
      accentRgb: '255 105 180',
      secondary: '#9b3dff',
      secondaryRgb: '155 61 255',
      tertiary: '#1fc41f',
      tertiaryRgb: '31 196 31',
      tagColor: 'rgba(255, 194, 224, 0.9)',
    },
  },
}

export const siteColorSchemeOptions = Object.values(siteColorSchemes)

export const siteColorSchemeIds = Object.keys(siteColorSchemes) as SiteColorScheme[]

export function isSiteColorScheme(value: unknown): value is SiteColorScheme {
  if (typeof value !== 'string') return false
  return Object.prototype.hasOwnProperty.call(siteColorSchemes, value)
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
  root.style.setProperty('--site-secondary', tokens.secondary)
  root.style.setProperty('--site-secondary-rgb', tokens.secondaryRgb)
  root.style.setProperty('--site-tertiary', tokens.tertiary)
  root.style.setProperty('--site-tertiary-rgb', tokens.tertiaryRgb)
  root.style.setProperty('--site-tag-color', tokens.tagColor)
}
