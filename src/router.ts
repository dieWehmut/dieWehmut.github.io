import { createRouter, createWebHistory } from 'vue-router'
import { siteConfig } from './data/site/config'
import HomeView from './views/HomeView.vue'
import ArchiveView from './views/ArchiveView.vue'
import NotesView from './views/NotesView.vue'
import NoteView from './views/NoteView.vue'
import InfraView from './views/InfraView.vue'
import ProjectView from './views/ProjectView.vue'
import TagsView from './views/TagsView.vue'
import AboutView from './views/AboutView.vue'
import FriendsView from './views/FriendsView.vue'
import SearchView from './views/SearchView.vue'
import TagDetailView from './views/TagDetailView.vue'
import PostView from './views/PostView.vue'
import NotFoundView from './views/NotFoundView.vue'

const routes = [
  { path: '/post/:id', name: 'post-detail', component: PostView },
  { path: '/note/:id', name: 'note-detail', component: NoteView },
  { path: '/', name: 'home', component: HomeView },
  { path: '/archive', name: 'archive', component: ArchiveView },
  { path: '/notes', name: 'notes', component: NotesView },
  { path: '/capture', name: 'capture', component: () => import('./views/CaptureView.vue') },
  { path: '/infra', name: 'infra', component: InfraView, meta: { requiresInfra: true } },
  { path: '/project', name: 'project', component: ProjectView, meta: { requiresProject: true } },
  { path: '/tags', name: 'tags', component: TagsView },
  { path: '/tags/:tag', name: 'tag-detail', component: TagDetailView },
  { path: '/about', name: 'about', component: AboutView },
  { path: '/friends', name: 'friends', component: FriendsView },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
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
