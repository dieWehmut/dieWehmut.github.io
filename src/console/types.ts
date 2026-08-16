export type ConsoleCommandKind = 'command' | 'silent'

export interface ConsoleCommand {
  kind: 'command'
  rawInput: string
  segments: string[]
  canonicalInput: string
  query: string
  hash: string
}

export interface SilentConsoleInput {
  kind: 'silent'
  rawInput: string
}

export type ParsedConsoleInput = ConsoleCommand | SilentConsoleInput

export interface ConsoleTimelineMonth<T> {
  key: string
  items: T[]
}
