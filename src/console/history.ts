export const CONSOLE_HISTORY_LIMIT = 5

export function addConsoleHistoryEntry(entries: readonly string[], command: string): string[] {
  const normalized = command.trim()
  if (!normalized) return entries.slice(-CONSOLE_HISTORY_LIMIT)

  const next = entries.filter((entry) => entry !== normalized)
  next.push(normalized)
  return next.slice(-CONSOLE_HISTORY_LIMIT)
}

