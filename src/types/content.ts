export type ContentKind = 'post' | 'note' | 'capture' | 'friend' | 'project' | 'infra'
export type ProjectCategory = 'websites' | 'games' | 'apps' | 'agents' | 'tools' | 'templates'
export type CaptureSourceKind = 'post' | 'note'
export type SiteColorScheme = 'green' | 'purple' | 'pink' | 'white' | 'black'

export interface ArchivePost {
  id: string
  title: string
  date: string
  tags: string[]
  summary: string
  wordCount?: number
  readingMinutes?: number
  updated?: string
  codeRunner?: boolean
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
  updated?: string
  codeRunner?: boolean
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
  updated?: string
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

/**
 * A portrait the console can wear, named for the colourway it is drawn in. The
 * ids are the console's own vocabulary: `/icon/<id>` accepts them, the picker
 * lists them, and the plate cycles them, so one word reaches the command line,
 * the screen reader and the status line alike.
 *
 * `grayscale` and `whiten` are not colourways but finishes: the first drains the
 * portrait the reader was last looking at, the second flattens it to a silhouette.
 */
export type ConsolePortraitId =
  | 'pink'
  | 'silver'
  | 'green'
  | 'blue'
  | 'purple'
  | 'yellow'
  | 'orange'
  | 'rose'
  | 'cyan'
  | 'midnight'
  | 'grayscale'
  | 'whiten'

/** How the console portrait is drawn; the gallery ids and the two finishes. */
export type ConsoleIconForm = ConsolePortraitId

export interface ConsolePortrait {
  id: ConsolePortraitId
  /** A runtime `/capture-assets/...` path; this repository tracks no images. */
  src: string
}

export interface ConsoleSiteConfig {
  /** Drawn when no gallery is configured, or when the reader asks for no artwork. */
  icon?: string
  /**
   * The colourways the console can wear, in the order the plate and the picker
   * walk them. A fork that ships no artwork leaves this empty and the console
   * falls back to `icon`.
   */
  portraits?: ConsolePortrait[]
  /**
   * The one-colour cutout the `whiten` finish draws. The colourways are opaque
   * squares, so painting one flat would only ever white out its background; a
   * silhouette has to be its own transparent artwork.
   */
  silhouette?: string
  /** The starting form. A reader's own choice is remembered over it. */
  iconForm?: ConsoleIconForm
}

export interface SiteConfig {
  githubUser: string
  githubRepo: string
  /**
   * Where this site's code came from. Not derived from `githubUser`/`githubRepo`:
   * a fork's own repository is not the template it was forked from, and the two
   * only coincide for whoever published the template.
   */
  templateRepoUrl: string
  owner: string
  displayName: string
  email: string
  title: string
  subtitle: string
  description: string
  siteUrl: string
  startedAt: string
  colorScheme: SiteColorScheme
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
  console?: ConsoleSiteConfig
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
  url?: string
  date: string
  icon?: string
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
