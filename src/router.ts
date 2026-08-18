import { createRouter, createWebHistory } from 'vue-router'
import { siteConfig } from './data/site/config'
import { useDisplayModePreference } from './composables/useDisplayModePreference'

const viewLoaders = {
  postDetail: () => import('./views/PostView.vue'),
  noteDetail: () => import('./views/NoteView.vue'),
  root: () => import('./views/RootView.vue'),
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
  help: () => import('./views/HelpView.vue'),
  notFound: () => import('./views/NotFoundView.vue'),
}

const primaryRoutePreloaders = new Map<string, () => Promise<unknown>>([
  ['/', viewLoaders.root],
  ['/home', viewLoaders.home],
  ['/archive', viewLoaders.archive],
  ['/notes', viewLoaders.notes],
  ['/capture', viewLoaders.capture],
  ['/infra', viewLoaders.infra],
  ['/project', viewLoaders.project],
  ['/tags', viewLoaders.tags],
  ['/about', viewLoaders.about],
  ['/friends', viewLoaders.friends],
  ['/search', viewLoaders.search],
  ['/help', viewLoaders.help],
])
// 详情页按首段路径前缀匹配：/post/:id、/note/:id、/tags/:tag
// 这些 chunk 很重（尤其 markdown 渲染链），不进空闲预热队列，只在鼠标悬停链接时按需拉取
const detailRoutePreloaders = new Map<string, () => Promise<unknown>>([
  ['post', viewLoaders.postDetail],
  ['note', viewLoaders.noteDetail],
  ['tags', viewLoaders.tagDetail],
])
const preloadedRoutePaths = new Set<string>()

const routes = [
  { path: '/post/:id', name: 'post-detail', component: viewLoaders.postDetail },
  { path: '/note/:id', name: 'note-detail', component: viewLoaders.noteDetail },
  { path: '/', name: 'root', component: viewLoaders.root },
  { path: '/home', name: 'home', component: viewLoaders.home },
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
  { path: '/help', name: 'help', component: viewLoaders.help },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: viewLoaders.notFound },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Console 模式由布局自己把路由输出对齐到页面顶部，router 再回顶会打架
    if (useDisplayModePreference().isConsole.value) return false
    if (savedPosition) return savedPosition
    if (to.hash) return false
    // 仅 query 变化（搜索、筛选）时留在原处，别把用户弹回顶部
    if (to.path === from.path) return false
    // 换页瞬时回顶：平滑滚动会和 page-fade 串行叠加，长文里尤其拖沓；
    // out-in 过渡期间旧内容已淡出，这一跳看不见
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresInfra && !siteConfig.enableInfra) return '/home'
  if (to.meta.requiresProject && !siteConfig.enableProject) return '/home'
})

function normalizePreloadPath(path: string) {
  const [pathname] = path.split(/[?#]/)
  return pathname.replace(/\/+$/, '') || '/'
}

function resolvePreloader(normalizedPath: string) {
  const exact = primaryRoutePreloaders.get(normalizedPath)
  if (exact) return exact
  const [, head] = normalizedPath.split('/')
  return detailRoutePreloaders.get(head)
}

export function preloadRouteByPath(path: string) {
  const normalizedPath = normalizePreloadPath(path)
  const loader = resolvePreloader(normalizedPath)
  if (!loader || preloadedRoutePaths.has(normalizedPath)) return

  preloadedRoutePaths.add(normalizedPath)
  void loader().catch(() => {
    preloadedRoutePaths.delete(normalizedPath)
  })
}

/**
 * 全站链接悬停预取：用事件委托在 document 上挂一个 pointerover，
 * 命中站内 <a> 就提前拉对应视图 chunk。比给每个卡片组件加 @pointerenter
 * 少改十几个文件，且自动覆盖正文里的站内链接。
 */
export function installHoverPrefetch() {
  if (typeof document === 'undefined') return

  const base = import.meta.env.BASE_URL.replace(/\/+$/, '')

  document.addEventListener(
    'pointerover',
    (event) => {
      const target = event.target as Element | null
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      if (anchor.origin !== window.location.origin) return

      const path = base && anchor.pathname.startsWith(base)
        ? anchor.pathname.slice(base.length) || '/'
        : anchor.pathname
      preloadRouteByPath(path)
    },
    { passive: true },
  )
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
