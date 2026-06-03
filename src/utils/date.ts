function normalizeDateInput(date: string): string {
  return date.trim().replace(/\//g, '-')
}

type ParsedTimelineDate = {
  start?: Date
  end?: Date
  startHasTime?: boolean
  endHasTime?: boolean
}

const dateTimePattern = String.raw`\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?)?`

function extractDateRangeParts(input?: string): { start: string; end?: string } | null {
  if (!input) return null
  const normalized = normalizeDateInput(input)
  const range = normalized.match(new RegExp(`^\\s*(${dateTimePattern})(?:\\s+-\\s+(${dateTimePattern}))?\\s*$`))

  if (range) {
    return { start: range[1], end: range[2] }
  }

  return null
}

function parseDatePart(value: string): { date: Date; hasTime: boolean } | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\s*(?:Z|[+-]\d{2}:?\d{2}))?)?$/)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  const hasTime = Boolean(hour)
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour || 0),
    Number(minute || 0),
    Number(second || 0)
  )

  if (Number.isNaN(parsedDate.valueOf())) return null
  return { date: parsedDate, hasTime }
}

export function parseTimelineDate(date?: string): ParsedTimelineDate {
  const parts = extractDateRangeParts(date)
  if (!parts) return {}

  const start = parseDatePart(parts.start)
  const end = parts.end ? parseDatePart(parts.end) : undefined

  return {
    start: start?.date,
    end: end?.date,
    startHasTime: start?.hasTime,
    endHasTime: end?.hasTime,
  }
}

export function getDateSortTimestamp(date?: string): number {
  const { end, start } = parseTimelineDate(date)
  if (end) return end.getTime()
  if (start) return start.getTime()
  return Date.parse(date || '') || 0
}

function formatDateValue(date: Date, includeTime = false): string {
  const dateValue = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  if (!includeTime) return dateValue
  return `${dateValue} ${formatTimeValue(date)}`
}

export function formatTimelineDate(date?: string): string {
  const { start, end, startHasTime, endHasTime } = parseTimelineDate(date)
  if (start && end) return `${formatDateValue(start, startHasTime)} - ${formatDateValue(end, endHasTime)}`
  if (start) return formatDateValue(start, startHasTime)
  return date || ''
}

export function formatTimelineShortDate(date?: string): string {
  const { start, end, startHasTime, endHasTime } = parseTimelineDate(date)
  if (start && end) {
    return `${formatShortDateValue(start, startHasTime)} - ${formatShortDateValue(end, endHasTime)}`
  }
  if (start) {
    return formatShortDateValue(start, startHasTime)
  }
  return date || ''
}

function formatShortDateValue(date: Date, includeTime = false): string {
  const dateValue = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  if (!includeTime) return dateValue
  return `${dateValue} ${formatTimeValue(date)}`
}

function formatTimeValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function getTimelineYear(date?: string): string {
  const { start } = parseTimelineDate(date)
  if (start) return String(start.getFullYear())
  const fallback = new Date(date || '')
  return Number.isNaN(fallback.valueOf()) ? 'Unknown' : String(fallback.getFullYear())
}
