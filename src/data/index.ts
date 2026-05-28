import type { ArchivePost, NoteEntry, ProjectEntry, SearchDocument } from '../types/content'
import { pages } from './site/page'
import { games } from './site/game'
import { apps } from './site/app'
import { tools } from './site/tool'
import { infra } from './site/infra'
import { getDocPosts, getDocNotes } from './docs'
import { friends } from './site/friends'
import { siteProfile } from './site/profile'

function timestamp(date?: string) {
  return Date.parse(date || '') || 0
}

function sortByDate<T extends { date?: string }>(items: T[]) {
  return items.slice().sort((a, b) => timestamp(b.date) - timestamp(a.date))
}

function projectUrl(item: any) {
  return item?.url || item?.html_url || item?.repoUrl || item?.repo_url || ''
}

function projectRepo(item: any) {
  return item?.repoUrl || item?.repo_url || item?.html_url || item?.url || ''
}

export function getPosts(): ArchivePost[] {
  return sortByDate(getDocPosts())
}

export function getNotes(): NoteEntry[] {
  return sortByDate(getDocNotes())
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
    (group.manualItems || []).map((item: any, index: number) => ({
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
    (group.manualItems || []).map((item: any, index: number) => ({
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
    (group.manualItems || []).map((item: any, index: number) => ({
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

  return sortByDate([...websiteEntries, ...gameEntries, ...appEntries, ...toolEntries])
}

export function getTagGroups() {
  const groups = new Map<string, ArchivePost[]>()
  for (const post of getPosts()) {
    for (const tag of post.tags || []) {
      groups.set(tag, [...(groups.get(tag) || []), post])
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

export function getArchiveGroups() {
  const groups = new Map<string, ArchivePost[]>()
  for (const post of getPosts()) {
    const year = new Date(post.date).getFullYear().toString()
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
  }))

  const noteDocs: SearchDocument[] = getNotes().map((note) => ({
    id: `note:${note.id}`,
    type: 'note',
    title: note.title || note.body.slice(0, 40),
    description: note.body,
    url: `/notes#${note.id}`,
    date: note.date,
    tags: note.tags,
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

  const infraDocs: SearchDocument[] = (infra.value || []).map((item: any) => ({
    id: `infra:${item.key || item.name}`,
    type: 'infra',
    title: item.name,
    description: 'Infrastructure endpoint',
    url: item.url,
    date: item.date,
    tags: ['Infra'],
  }))

  return sortByDate([...postDocs, ...noteDocs, ...projectDocs, ...infraDocs, ...friendDocs])
}

export { friends, siteProfile }
