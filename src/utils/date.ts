function normalizeDateInput(date: string): string {
  return date.trim().replace(/\//g, '-')
}

function extractDateRangeParts(input?: string): { start: string; end?: string } | null {
  if (!input) return null
  const normalized = normalizeDateInput(input)
  const parts = normalized.split(/\s*-\s*/)

  if (parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0]) && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
    return { start: parts[0], end: parts[1] }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return { start: normalized }
  }

  return null
}

export function parseTimelineDate(date?: string): { start?: Date; end?: Date } {
  const parts = extractDateRangeParts(date)
  if (!parts) return {}

  const start = new Date(parts.start)
  const end = parts.end ? new Date(parts.end) : undefined

  return {
    start: Number.isNaN(start.valueOf()) ? undefined : start,
    end: end && !Number.isNaN(end.valueOf()) ? end : undefined,
  }
}

export function getDateSortTimestamp(date?: string): number {
  const { end, start } = parseTimelineDate(date)
  if (end) return end.getTime()
  if (start) return start.getTime()
  return Date.parse(date || '') || 0
}

function formatDateValue(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

export function formatTimelineDate(date?: string): string {
  const { start, end } = parseTimelineDate(date)
  if (start && end) return `${formatDateValue(start)} - ${formatDateValue(end)}`
  if (start) return formatDateValue(start)
  return date || ''
}

export function formatTimelineShortDate(date?: string): string {
  const { start, end } = parseTimelineDate(date)
  if (start && end) {
    return `${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')} - ${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}`
  }
  if (start) {
    return `${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`
  }
  return date || ''
}

export function getTimelineYear(date?: string): string {
  const { start } = parseTimelineDate(date)
  if (start) return String(start.getFullYear())
  const fallback = new Date(date || '')
  return Number.isNaN(fallback.valueOf()) ? 'Unknown' : String(fallback.getFullYear())
}
