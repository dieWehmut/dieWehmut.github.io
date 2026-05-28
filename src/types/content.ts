export type ContentKind = 'post' | 'note' | 'friend' | 'project' | 'infra'

export interface ArchivePost {
  id: string
  title: string
  date: string
  summary: string
  tags: string[]
  category?: string
  url?: string
  body?: string
}

export interface NoteEntry {
  id: string
  date: string
  body: string
  title?: string
  tags?: string[]
}

export interface FriendLink {
  id: string
  name: string
  description: string
  url: string
  avatar?: string
}

export interface ProjectEntry {
  id: string
  name: string
  category: 'websites' | 'games' | 'apps' | 'tools'
  categoryLabel: string
  date?: string
  url?: string
  repoUrl?: string
  description?: string
  actionLabel?: string
}

export interface SearchDocument {
  id: string
  type: ContentKind
  title: string
  description: string
  url: string
  date?: string
  tags?: string[]
}
