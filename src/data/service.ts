import { ref } from 'vue'

const initialServices = [
  { name: 'PVE Server', key: 'pve', url: 'https://pve.diesw.tech', date: '2026-04-03' },
  { name: 'GitLab Server', key: 'gitlab', url: 'https://git.diesw.tech', date: '2026-05-12' },
  { name: 'Gitea Server', key: 'gitea', url: 'https://git2.diesw.tech', date: '2026-05-13' },
  { name: 'Mirror', key: 'mirror', url: 'https://mirror.diesw.tech', date: '2026-05-15' },
  { name: 'Jenkins', key: 'jenkins', url: 'https://jenkins.diesw.tech', date: '2026-05-11' },
  { name: 'Route Status', key: 'netdata', url: 'https://netdata.diesw.tech', date: '2026-04-08' },
  { name: 'Download Disk', key: 'pan', url: 'https://openlist.diesw.tech', date: '2026-03-10' },
  { name: 'Coolify', key: 'coolify', url: 'https://coolify.diesw.tech', date: '2026-05-14' },
  { name: 'OpenWRT', key: 'openwrt', url: 'https://openwrt.diesw.tech', date: '2026-04-06' },
  { name: 'DSM', key: 'dsm', url: 'https://dsm.diesw.tech', date: '2026-04-12' },
]

initialServices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export const services = ref(initialServices)

export default services
