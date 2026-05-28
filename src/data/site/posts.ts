import type { ArchivePost } from '../../types/content'

export const posts: ArchivePost[] = [
  {
    id: 'nexus-krypton-layout',
    title: 'Nexus layout notes',
    date: '2026-05-27',
    summary: 'A record of reshaping Nexus around a quiet sidebar, project lists, infrastructure status, and searchable notes.',
    tags: ['Nexus', 'Frontend', 'Vue'],
    category: 'Build',
  },
  {
    id: 'infra-map',
    title: 'Infrastructure map',
    date: '2026-05-14',
    summary: 'Services, dashboards, mirrors, and build tools collected into one operational view.',
    tags: ['Infra', 'Services'],
    category: 'Ops',
  },
  {
    id: 'project-index',
    title: 'Project index',
    date: '2026-03-14',
    summary: 'Websites, apps, games, and tools grouped as one project catalogue instead of separate navigation islands.',
    tags: ['Projects', 'Catalog'],
    category: 'Build',
  },
  {
    id: 'search-first',
    title: 'Search-first navigation',
    date: '2025-11-13',
    summary: 'A small search surface that indexes posts, notes, friends, projects, and infrastructure entries.',
    tags: ['Search', 'UX'],
    category: 'Interface',
  },
  {
    id: 'background-controls',
    title: 'Optional motion background',
    date: '2025-10-26',
    summary: 'Dynamic backgrounds are kept as an explicit preference so the default page stays calm and fast.',
    tags: ['Motion', 'Performance'],
    category: 'Interface',
  },
]
