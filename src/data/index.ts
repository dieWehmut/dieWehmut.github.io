import type {
  ArchiveGroup,
  ArchivePost,
  InfraEntry,
  NoteEntry,
  NoteGroup,
  ProjectEntry,
  SearchDocument,
  SiteProjectItem,
  TagGroup,
  TagContentEntry,
} from '../types/content'
import { pages } from './site/page'
import { games } from './site/game'
import { apps } from './site/app'
import { tools } from './site/tool'
import { templates } from './site/template'
import { infra } from './site/infra'
import { getDocPosts, getDocNotes, loadDoc, preloadDoc, docContentVersion } from './docs'
import { friends } from './site/friends'
import { siteProfile } from './site/profile'
import { getDateSortTimestamp, getTimelineYear } from '../utils/date'

function timestamp(date?: string) {
  return getDateSortTimestamp(date)
}

function sortByDate<T extends { date?: string }>(items: T[]) {
  return items.slice().sort((a, b) => timestamp(b.date) - timestamp(a.date))
}

function projectUrl(item: SiteProjectItem): string {
  return item?.url || item?.html_url || item?.repoUrl || item?.repo_url || ''
}

function projectRepo(item: SiteProjectItem): string {
  return item?.repoUrl || item?.repo_url || item?.html_url || item?.url || ''
}

const posts = sortByDate(getDocPosts())
const notes = sortByDate(getDocNotes())

export function getPosts(): ArchivePost[] {
  return posts
}

export function getNotes(): NoteEntry[] {
  return notes
}

export function getProjectEntries(): ProjectEntry[] {
  const websiteEntries: ProjectEntry[] = (pages.value || []).map((page) => ({
    id: `website:${page.name}`,
    name: page.displayName || page.name,
    category: 'websites',
    categoryLabel: 'Websites',
    date: page.date,
    url: page.url,
    repoUrl: page.repoUrl,
    description: 'Website project',
    actionLabel: 'Open',
  }))

  const gameEntries: ProjectEntry[] = (games.value || []).flatMap((group) =>
    (group.manualItems || []).map((item: SiteProjectItem, index: number) => ({
      id: `game:${item.name || index}`,
      name: item.name || `Game ${index + 1}`,
      category: 'games',
      categoryLabel: 'Games',
      date: item.date,
      url: item.html_url || item.url || item.repo_url,
      repoUrl: item.repo_url || item.repoUrl,
      description: 'Game project',
      actionLabel: item.showDownload === false ? 'Repo' : 'Open',
    }))
  )

  const appEntries: ProjectEntry[] = (apps.value || []).flatMap((group) =>
    (group.manualItems || []).map((item: SiteProjectItem, index: number) => ({
      id: `app:${item.name || index}`,
      name: item.name || `App ${index + 1}`,
      category: 'apps',
      categoryLabel: 'Apps',
      date: item.date,
      url: item.html_url || item.url || item.repo_url,
      repoUrl: item.repo_url || item.repoUrl,
      description: 'Application project',
      actionLabel: item.showDownload === false ? 'Repo' : 'Open',
    }))
  )

  const toolEntries: ProjectEntry[] = (tools.value || []).flatMap((group) =>
    (group.manualItems || []).map((item: SiteProjectItem, index: number) => ({
      id: `tool:${item.name || index}`,
      name: item.name || `Tool ${index + 1}`,
      category: 'tools',
      categoryLabel: 'Tools',
      date: item.lastModified || item.date,
      url: projectUrl(item),
      repoUrl: projectRepo(item),
      description: 'Tool project',
      actionLabel: 'Open',
    }))
  )

  const templateEntries: ProjectEntry[] = (templates.value || []).flatMap((group) =>
    (group.manualItems || []).map((item: SiteProjectItem, index: number) => ({
      id: `template:${item.name || index}`,
      name: item.name || `模板 ${index + 1}`,
      category: 'templates',
      categoryLabel: '模板',
      date: item.lastModified || item.date,
      url: projectUrl(item),
      repoUrl: projectRepo(item),
      description: '模板项目',
      actionLabel: 'Open',
    }))
  )

  return sortByDate([...websiteEntries, ...gameEntries, ...appEntries, ...toolEntries, ...templateEntries])
}

export function getTagGroups(): TagGroup[] {
  const groups = new Map<string, TagContentEntry[]>()
  for (const post of getPosts()) {
    for (const tag of post.tags || []) {
      groups.set(tag, [...(groups.get(tag) || []), post])
    }
  }
  for (const note of getNotes()) {
    for (const tag of note.tags || []) {
      const entry = {
        id: note.id,
        title: note.title,
        date: note.date,
        tags: note.tags,
        summary: note.summary,
        wordCount: note.wordCount,
        readingMinutes: note.readingMinutes,
        _isNote: true,
      } as TagContentEntry
      groups.set(tag, [...(groups.get(tag) || []), entry])
    }
  }

  return Array.from(groups.entries())
    .map(([tag, tagPosts]) => ({
      tag,
      posts: sortByDate(tagPosts),
      count: tagPosts.length,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function getNoteGroups(): NoteGroup[] {
  const groups = new Map<string, NoteEntry[]>()
  for (const note of getNotes()) {
    const year = getTimelineYear(note.date)
    groups.set(year, [...(groups.get(year) || []), note])
  }

  return Array.from(groups.entries())
    .map(([year, yearNotes]) => ({ year, notes: sortByDate(yearNotes) }))
    .sort((a, b) => Number(b.year) - Number(a.year))
}

export function getArchiveGroups(): ArchiveGroup[] {
  const groups = new Map<string, ArchivePost[]>()
  for (const post of getPosts()) {
    const year = getTimelineYear(post.date)
    groups.set(year, [...(groups.get(year) || []), post])
  }

  return Array.from(groups.entries())
    .map(([year, yearPosts]) => ({ year, posts: sortByDate(yearPosts) }))
    .sort((a, b) => Number(b.year) - Number(a.year))
}

export function getSearchDocuments(): SearchDocument[] {
  const postDocs: SearchDocument[] = getPosts().map((post) => ({
    id: `post:${post.id}`,
    type: 'post',
    title: post.title,
    description: post.summary,
    url: `/post/${post.id}`,
    date: post.date,
    tags: post.tags,
    updated: post.updated,
    wordCount: post.wordCount,
    readingMinutes: post.readingMinutes,
  }))

  const noteDocs: SearchDocument[] = getNotes().map((note) => ({
    id: `note:${note.id}`,
    type: 'note',
    title: note.title,
    description: note.summary,
    url: `/note/${note.id}`,
    date: note.date,
    tags: note.tags,
    updated: note.updated,
    wordCount: note.wordCount,
    readingMinutes: note.readingMinutes,
  }))

  const friendDocs: SearchDocument[] = friends.map((friend) => ({
    id: `friend:${friend.id}`,
    type: 'friend',
    title: friend.name,
    description: friend.description,
    url: friend.url,
  }))

  const projectDocs: SearchDocument[] = getProjectEntries().map((project) => ({
    id: `project:${project.id}`,
    type: 'project',
    title: project.name,
    description: `${project.categoryLabel}. ${project.description || ''}`,
    url: project.url || project.repoUrl || '/project',
    date: project.date,
    tags: [project.categoryLabel],
  }))

  const infraDocs: SearchDocument[] = (infra.value || []).map((item: InfraEntry) => ({
    id: `infra:${item.key || item.name}`,
    type: 'infra',
    title: item.name,
    description: 'Infrastructure endpoint',
    url: item.url || '',
    date: item.date,
    tags: ['Infra'],
  }))

  return sortByDate([...postDocs, ...noteDocs, ...projectDocs, ...infraDocs, ...friendDocs])
}

export { friends, siteProfile }
export { loadDoc, preloadDoc, docContentVersion }
