import { createRouter, createWebHistory } from 'vue-router'
import FocusView from './views/FocusView.vue'

const routes = [
  { path: '/', redirect: '/services' },
  { path: '/services', name: 'services', component: FocusView, props: { section: 'services' } },
  { path: '/pages', name: 'pages', component: FocusView, props: { section: 'pages' } },
  { path: '/games', name: 'games', component: FocusView, props: { section: 'games' } },
  { path: '/apps', name: 'apps', component: FocusView, props: { section: 'apps' } },
  { path: '/files', name: 'files', component: FocusView, props: { section: 'files' } },
  { path: '/tools', name: 'tools', component: FocusView, props: { section: 'tools' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
