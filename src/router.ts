import { createRouter, createWebHistory } from 'vue-router'
import { siteConfig } from './data/site/config'

const routes = [
  { path: '/post/:id', name: 'post-detail', component: () => import('./views/PostView.vue') },
  { path: '/note/:id', name: 'note-detail', component: () => import('./views/NoteView.vue') },
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/archive', name: 'archive', component: () => import('./views/ArchiveView.vue') },
  { path: '/notes', name: 'notes', component: () => import('./views/NotesView.vue') },
  { path: '/capture', name: 'capture', component: () => import('./views/CaptureView.vue') },
  { path: '/capture/:id', name: 'capture-detail', component: () => import('./views/CaptureView.vue') },
  { path: '/infra', name: 'infra', component: () => import('./views/InfraView.vue'), meta: { requiresInfra: true } },
  { path: '/project', name: 'project', component: () => import('./views/ProjectView.vue'), meta: { requiresProject: true } },
  { path: '/tags', name: 'tags', component: () => import('./views/TagsView.vue') },
  { path: '/tags/:tag', name: 'tag-detail', component: () => import('./views/TagDetailView.vue') },
  { path: '/about', name: 'about', component: () => import('./views/AboutView.vue') },
  { path: '/friends', name: 'friends', component: () => import('./views/FriendsView.vue') },
  { path: '/search', name: 'search', component: () => import('./views/SearchView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue') },
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

export default router
