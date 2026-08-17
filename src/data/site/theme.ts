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

/**
 * `chromatic` 方案带色相，进首屏随机池；`monochrome` 是纯灰阶单色方案，
 * 只能手动选中，随机池不碰它们。
 */
export type SiteColorSchemeTone = 'chromatic' | 'monochrome'

export type SiteColorSchemeOption = {
  id: SiteColorScheme
  label: string
  preview: string
  tone: SiteColorSchemeTone
  light: SiteColorSchemeTokens
  dark: SiteColorSchemeTokens
}

export const DEFAULT_SITE_COLOR_SCHEME: SiteColorScheme = 'purple'

export const siteColorSchemes: Record<SiteColorScheme, SiteColorSchemeOption> = {
  green: {
    id: 'green',
    label: 'Green',
    preview: '#1fc41f',
    tone: 'chromatic',
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
    tone: 'chromatic',
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
    tone: 'chromatic',
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
  // 单色方案在两种模式下取不同灰阶：语义统一为 accent 对比最强、secondary 次之、
  // tertiary 最弱——light 下越暗越强，dark 下越亮越强。所以 white 在 light 模式里
  // 反而是深灰，black 在 dark 模式里反而是浅灰，四种组合才都可读。
  //
  // 「不匹配」那一侧（white/light、black/dark）的 accent 定在 WCAG AA 的 4.5:1
  // 而不是更保守的 8:1：匹配侧已经是 #ffffff / #000000 顶到墙，两个方案的区分度
  // 全靠不匹配侧能走多远。4.5:1 把 accent 差距从 74/75 级灰度拉到 118/137 级，
  // 代价是这一侧的三档梯度被压窄（步长约 19 级）。
  white: {
    id: 'white',
    label: 'White',
    preview: '#ffffff',
    tone: 'monochrome',
    light: {
      accent: '#767676',
      accentRgb: '118 118 118',
      secondary: '#898989',
      secondaryRgb: '137 137 137',
      tertiary: '#9c9c9c',
      tertiaryRgb: '156 156 156',
      tagColor: 'rgba(118, 118, 118, 0.92)',
    },
    dark: {
      accent: '#ffffff',
      accentRgb: '255 255 255',
      secondary: '#b8b8b8',
      secondaryRgb: '184 184 184',
      tertiary: '#7a7a7a',
      tertiaryRgb: '122 122 122',
      tagColor: 'rgba(240, 240, 240, 0.9)',
    },
  },
  black: {
    id: 'black',
    label: 'Black',
    preview: '#111111',
    tone: 'monochrome',
    light: {
      accent: '#000000',
      accentRgb: '0 0 0',
      secondary: '#4a4a4a',
      secondaryRgb: '74 74 74',
      tertiary: '#808080',
      tertiaryRgb: '128 128 128',
      tagColor: 'rgba(20, 20, 20, 0.92)',
    },
    dark: {
      accent: '#767676',
      accentRgb: '118 118 118',
      secondary: '#626262',
      secondaryRgb: '98 98 98',
      tertiary: '#4f4f4f',
      tertiaryRgb: '79 79 79',
      tagColor: 'rgba(118, 118, 118, 0.85)',
    },
  },
}

export const siteColorSchemeOptions = Object.values(siteColorSchemes)

export const siteColorSchemeIds = Object.keys(siteColorSchemes) as SiteColorScheme[]

/** 首屏无偏好时的随机池。单色方案刻意排除在外，只能手动选中。 */
export const siteRandomColorSchemeOptions = siteColorSchemeOptions.filter(
  (option) => option.tone === 'chromatic',
)

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

/** 爱心光标的 SVG path，与 BounceCursor 的 mask 形状保持一致 */
const HEART_CURSOR_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

/**
 * 原生光标只能写 `cursor: url(...)`，而 CSS 没法把自定义属性插进 data URL，
 * 所以配色色值只能在 JS 里重新编码一次 SVG。热点固定在 (12,21)（爱心下尖）。
 */
function heartCursorValue(color: string, fallback: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
    `<path d="${HEART_CURSOR_PATH}" fill="${color}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 21, ${fallback}`
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

  // 三个原生爱心光标（默认 / 可点击 / 樱花悬停）跟着 accent 换色，
  // 覆盖 SCSS 里写死的粉色默认值。樱花「抓取」光标是插画，不参与配色。
  root.style.setProperty('--cursor-heart', heartCursorValue(tokens.accent, 'auto'))
  root.style.setProperty('--cursor-pointer', heartCursorValue(tokens.accent, 'pointer'))
  root.style.setProperty('--cursor-sakura-hover', heartCursorValue(tokens.accent, 'auto'))
}
