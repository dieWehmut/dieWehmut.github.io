import { createRouter, createWebHistory } from 'vue-router'
import { siteConfig } from './data/site/config'

const viewLoaders = {
  postDetail: () => import('./views/PostView.vue'),
  noteDetail: () => import('./views/NoteView.vue'),
  home: () => import('./views/HomeView.vue'),
  archive: () => import('./views/ArchiveView.vue'),
  notes: () => import('./views/NotesView.vue'),
  capture: () => import('./views/CaptureView.vue'),
  infra: () => import('./views/InfraView.vue'),
  project: () => import('./views/ProjectView.vue'),
  tags: () => import('./views/TagsView.vue'),
  tagDetail: () => import('./views/TagDetailView.vue'),
  about: () => import('./views/AboutView.vue'),
  friends: () => import('./views/FriendsView.vue'),
  search: () => import('./views/SearchView.vue'),
  notFound: () => import('./views/NotFoundView.vue'),
}

const primaryRoutePreloaders = new Map<string, () => Promise<unknown>>([
  ['/', viewLoaders.home],
  ['/archive', viewLoaders.archive],
  ['/notes', viewLoaders.notes],
  ['/capture', viewLoaders.capture],
  ['/infra', viewLoaders.infra],
  ['/project', viewLoaders.project],
  ['/tags', viewLoaders.tags],
  ['/about', viewLoaders.about],
  ['/friends', viewLoaders.friends],
  ['/search', viewLoaders.search],
])
const preloadedRoutePaths = new Set<string>()

const routes = [
  { path: '/post/:id', name: 'post-detail', component: viewLoaders.postDetail },
  { path: '/note/:id', name: 'note-detail', component: viewLoaders.noteDetail },
  { path: '/', name: 'home', component: viewLoaders.home },
  { path: '/archive', name: 'archive', component: viewLoaders.archive },
  { path: '/notes', name: 'notes', component: viewLoaders.notes },
  { path: '/capture', name: 'capture', component: viewLoaders.capture },
  { path: '/capture/:id', name: 'capture-detail', component: viewLoaders.capture },
  { path: '/infra', name: 'infra', component: viewLoaders.infra, meta: { requiresInfra: true } },
  { path: '/project', name: 'project', component: viewLoaders.project, meta: { requiresProject: true } },
  { path: '/tags', name: 'tags', component: viewLoaders.tags },
  { path: '/tags/:tag', name: 'tag-detail', component: viewLoaders.tagDetail },
  { path: '/about', name: 'about', component: viewLoaders.about },
  { path: '/friends', name: 'friends', component: viewLoaders.friends },
  { path: '/search', name: 'search', component: viewLoaders.search },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: viewLoaders.notFound },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 24, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresInfra && !siteConfig.enableInfra) return '/'
  if (to.meta.requiresProject && !siteConfig.enableProject) return '/'
})

function normalizePreloadPath(path: string) {
  const [pathname] = path.split(/[?#]/)
  return pathname.replace(/\/+$/, '') || '/'
}

export function preloadRouteByPath(path: string) {
  const normalizedPath = normalizePreloadPath(path)
  const loader = primaryRoutePreloaders.get(normalizedPath)
  if (!loader || preloadedRoutePaths.has(normalizedPath)) return

  preloadedRoutePaths.add(normalizedPath)
  void loader().catch(() => {
    preloadedRoutePaths.delete(normalizedPath)
  })
}

export function preloadPrimaryRoutes() {
  if (typeof window === 'undefined') return

  const preloadAll = () => {
    Array.from(primaryRoutePreloaders.keys()).forEach((path, index) => {
      window.setTimeout(() => preloadRouteByPath(path), index * 80)
    })
  }
  const requestIdle = (window as unknown as {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  }).requestIdleCallback

  if (requestIdle) requestIdle(preloadAll, { timeout: 1800 })
  else window.setTimeout(preloadAll, 300)
}

export default router
