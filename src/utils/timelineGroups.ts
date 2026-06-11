import { getDateSortTimestamp, parseTimelineDate } from './date'

export type TimelineMonthGroup<T> = {
  id: string
  label: string
  timestamp: number
  items: T[]
}

export type TimelineYearGroup<T> = {
  id: string
  label: string
  timestamp: number
  months: TimelineMonthGroup<T>[]
}

type TimelineGroupOptions<T> = {
  idPrefix: string
  locale?: string
  getDate: (item: T) => string | undefined
}

const eastAsianMonthLabels = Array.from({ length: 12 }, (_, index) => `${index + 1}\u6708`)
const monthLabelsByLocale: Record<string, readonly string[]> = {
  zh: eastAsianMonthLabels,
  zh_tw: eastAsianMonthLabels,
  ja: eastAsianMonthLabels,
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  de: [
    'Januar',
    'Februar',
    'M\u00e4rz',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
  la: [
    'Ianuarius',
    'Februarius',
    'Martius',
    'Aprilis',
    'Maius',
    'Iunius',
    'Iulius',
    'Augustus',
    'September',
    'October',
    'November',
    'December',
  ],
}

function normalizeLocale(locale?: string) {
  return (locale || 'en').toLowerCase().replace('-', '_')
}

function getStartDate(date?: string) {
  const { start } = parseTimelineDate(date)
  return start
}

function getStartSortTimestamp(date?: string) {
  return getStartDate(date)?.getTime() || getDateSortTimestamp(date) || 0
}

export function formatTimelineYearLabel(date: Date, locale?: string) {
  const normalizedLocale = normalizeLocale(locale)
  const year = String(date.getFullYear())
  if (normalizedLocale === 'zh' || normalizedLocale === 'zh_tw' || normalizedLocale === 'ja') {
    return `${year}\u5e74`
  }
  return year
}

export function formatTimelineMonthLabel(date: Date, locale?: string) {
  const normalizedLocale = normalizeLocale(locale)
  const monthLabels = monthLabelsByLocale[normalizedLocale] || monthLabelsByLocale[normalizedLocale.split('_')[0]]
  return monthLabels?.[date.getMonth()] || `${date.getMonth() + 1}\u6708`
}

export function groupItemsByYearAndMonth<T>(items: readonly T[], options: TimelineGroupOptions<T>): TimelineYearGroup<T>[] {
  const years = new Map<string, TimelineYearGroup<T>>()

  for (const item of items) {
    const date = options.getDate(item)
    const start = getStartDate(date)
    const yearKey = start ? String(start.getFullYear()) : 'undated'
    const monthKey = start ? `${yearKey}-${String(start.getMonth() + 1).padStart(2, '0')}` : 'undated'
    const timestamp = getStartSortTimestamp(date)
    const year = years.get(yearKey) || {
      id: `${options.idPrefix}-year-${yearKey}`,
      label: start ? formatTimelineYearLabel(start, options.locale) : 'Undated',
      timestamp,
      months: [],
    }

    let month = year.months.find((entry) => entry.id === `${options.idPrefix}-month-${monthKey}`)
    if (!month) {
      month = {
        id: `${options.idPrefix}-month-${monthKey}`,
        label: start ? formatTimelineMonthLabel(start, options.locale) : 'Undated',
        timestamp,
        items: [],
      }
      year.months.push(month)
    }

    year.timestamp = Math.max(year.timestamp, timestamp)
    month.timestamp = Math.max(month.timestamp, timestamp)
    month.items.push(item)
    years.set(yearKey, year)
  }

  return Array.from(years.values())
    .map((year) => ({
      ...year,
      months: year.months
        .map((month) => ({
          ...month,
          items: month.items.slice().sort((a, b) => getStartSortTimestamp(options.getDate(b)) - getStartSortTimestamp(options.getDate(a))),
        }))
        .sort((a, b) => b.timestamp - a.timestamp),
    }))
    .sort((a, b) => b.timestamp - a.timestamp)
}
