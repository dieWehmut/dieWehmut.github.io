import { ref } from 'vue'

const initialInfra = [
  {name: 'Server Status', key: 'hass', url: 'https://nezha.hc-dsw-nexus.me', date: '2026-04-10' },
  { name: 'PVE Controller', key: 'pve', url: 'https://pve.diesw.tech', date: '2026-04-03' },
  { name: 'GitLab Server', key: 'gitlab', url: 'https://git.diesw.tech', date: '2026-05-12' },
  { name: 'Gitea Server', key: 'gitea', url: 'https://git2.diesw.tech', date: '2026-05-13' },
  { name: 'Mirror', key: 'mirror', url: 'https://mirror.diesw.tech', date: '2026-05-15' },
  { name: 'Jenkins', key: 'jenkins', url: 'https://jenkins.diesw.tech', date: '2026-05-11' },
  { name: 'Route Status', key: 'netdata', url: 'https://netdata.diesw.tech', date: '2026-04-08' },
  { name: 'Download Disk', key: 'pan', url: 'https://openlist.diesw.tech', date: '2026-03-10' },
  { name: 'Coolify', key: 'coolify', url: 'https://coolify.diesw.tech', date: '2026-05-14' },
  { name: 'Route Controller', key: 'openwrt', url: 'https://openwrt.diesw.tech', date: '2026-04-06' },
  { name: 'DSM', key: 'dsm', url: 'https://dsm.diesw.tech', date: '2026-04-12' },
]

initialInfra.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export const infra = ref(initialInfra)

export default infra
