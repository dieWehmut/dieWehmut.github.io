export type ContentKind = 'post' | 'note' | 'capture' | 'friend' | 'project' | 'infra'
export type ProjectCategory = 'websites' | 'games' | 'apps' | 'tools'
export type CaptureSourceKind = 'post' | 'note'

export interface ArchivePost {
  id: string
  title: string
  date: string
  tags: string[]
  summary: string
  wordCount?: number
  readingMinutes?: number
  body?: string
  assetPaths?: string[]
}

export interface NoteEntry {
  id: string
  title: string
  date: string
  tags: string[]
  summary: string
  wordCount?: number
  readingMinutes?: number
  body?: string
  assetPaths?: string[]
}

export interface CaptureSourceRef {
  type: CaptureSourceKind
  id: string
  title: string
  url: string
}

export interface CaptureAsset {
  id: string
  image: string
  title?: string
  date?: string
  tags: string[]
  summary?: string
  sourceRefs: CaptureSourceRef[]
  standalone: boolean
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
  category: ProjectCategory
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
  wordCount?: number
  readingMinutes?: number
  captureAssetIds?: string[]
  captureCount?: number
}

export interface SearchResult extends SearchDocument {
  score: number
}

export interface SiteLink {
  label: string
  url: string
}

export interface SiteConfig {
  githubUser: string
  githubRepo: string
  owner: string
  displayName: string
  email: string
  title: string
  subtitle: string
  description: string
  siteUrl: string
  startedAt: string
  googleAnalyticsId: string
  icpNumber: string
  icpText: string
  enableInfra: boolean
  enableProject: boolean
  codeRunner: {
    backendApiUrl: string
    backendToken: string
  }
  links: SiteLink[]
}

export interface SiteProfile {
  title: string
  subtitle: string
  description: string
  owner: string
  email: string
  startedAt: string
  links: SiteLink[]
}

export interface InfraEntry {
  name: string
  key: string
  url: string
  date: string
}

export interface SiteProjectItem {
  name: string
  html_url?: string
  repo_url?: string
  url?: string
  repoUrl?: string
  showDownload?: boolean
  downloadToast?: boolean
  downloadToastMessage?: string
  date?: string
  lastModified?: string
}

export interface SiteProjectGroup {
  name: string
  autoLoad: boolean
  description: string
  manualItems: SiteProjectItem[]
  owner?: string
  repo?: string
}

export interface WebsiteEntry {
  name: string
  displayName: string
  repoUrl: string
  date: string
  url: string
}

export interface TagGroup {
  tag: string
  posts: TagContentEntry[]
  captures?: CaptureAsset[]
  count: number
  postCount?: number
  captureCount?: number
}

export interface NoteGroup {
  year: string
  notes: NoteEntry[]
}

export interface ArchiveGroup {
  year: string
  posts: ArchivePost[]
}

export interface TagContentEntry extends ArchivePost {
  _isNote?: boolean
}
