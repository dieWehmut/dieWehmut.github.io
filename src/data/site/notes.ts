import type { NoteEntry } from '../../types/content'

export const notes: NoteEntry[] = [
  {
    id: 'motion-default-off',
    date: '2026-05-27',
    title: 'Motion default',
    body: 'Dynamic background effects should start disabled. The user can turn them on when they want the page to feel more alive.',
    tags: ['Motion', 'Preference'],
  },
  {
    id: 'sidebar-over-header',
    date: '2026-05-26',
    title: 'Desktop shell',
    body: 'Desktop does not need a header. The sidebar carries identity and navigation, and the content column carries the page.',
    tags: ['Layout'],
  },
  {
    id: 'drawer-on-mobile',
    date: '2026-05-25',
    title: 'Mobile shell',
    body: 'Mobile keeps a compact header with a menu button. The sidebar slides in as a drawer and closes on navigation.',
    tags: ['Mobile', 'Navigation'],
  },
  {
    id: 'project-boundary',
    date: '2026-05-24',
    title: 'Project boundary',
    body: 'Infrastructure services belong to Infra. Websites, apps, games, and tools belong to Project.',
    tags: ['Projects', 'Infra'],
  },
]
