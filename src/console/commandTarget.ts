export interface ConsoleCommandTargetShape {
  kind: string
  segments: string[]
}

export interface ConsoleCommandTargetCatalog {
  postIds?: Iterable<string>
  noteIds?: Iterable<string>
  captureIds?: Iterable<string>
  tags?: Iterable<string>
}

function includesExact(values: Iterable<string> | undefined, target: string): boolean {
  if (!values) return false
  return Array.from(values).some((value) => value === target)
}

function includesCaseInsensitive(values: Iterable<string> | undefined, target: string): boolean {
  if (!values) return false
  const normalizedTarget = target.toLowerCase()
  return Array.from(values).some((value) => value.toLowerCase() === normalizedTarget)
}

/** Dynamic slash commands only act when their data target exists. */
export function isKnownConsoleCommandTarget(
  command: ConsoleCommandTargetShape,
  catalog: ConsoleCommandTargetCatalog,
): boolean {
  if (command.kind !== 'command') return false

  const [rawHead = '', target] = command.segments
  if (target === undefined) return true

  switch (rawHead.toLowerCase()) {
    case 'post':
      return includesExact(catalog.postIds, target)
    case 'note':
      return includesExact(catalog.noteIds, target)
    case 'capture':
      return includesExact(catalog.captureIds, target)
    case 'tags':
      return includesCaseInsensitive(catalog.tags, target)
    default:
      return true
  }
}
