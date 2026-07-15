import { ref } from 'vue'
import type { InfraEntry } from '../../types/content'

const initialInfra: InfraEntry[] = [
  { name: 'Server Status', key: 'hass', url: 'https://nezha.hc-dsw-nexus.me', date: '2026-04-10', icon: 'nezha.svg' },
  { name: 'PVE', key: 'pve', date: '2026-04-03', icon: 'pve.svg' },
  { name: 'GitLab Server', key: 'gitlab', url: 'https://git.diesw.tech', date: '2026-05-12', icon: 'gitlab.svg' },
  { name: 'Gitea Server', key: 'gitea', url: 'https://git2.diesw.tech', date: '2026-05-13', icon: 'gitea.svg' },
  { name: 'Mirror', key: 'mirror', url: 'https://mirror.diesw.tech', date: '2026-05-15', icon: 'mirror.svg' },
  { name: 'Jenkins', key: 'jenkins', url: 'https://jenkins.diesw.tech', date: '2026-05-11', icon: 'jenkins.svg' },
  { name: 'Route Status', key: 'netdata', url: 'https://netdata.diesw.tech', date: '2026-04-08', icon: 'netdata.svg' },
  { name: 'Download Disk', key: 'pan', url: 'https://openlist.diesw.tech', date: '2026-03-10', icon: 'openlist.svg' },
  { name: 'Coolify', key: 'coolify', url: 'https://coolify.diesw.tech', date: '2026-05-14', icon: 'coolify.svg' },
  { name: 'OpenWrt', key: 'openwrt', date: '2026-04-06', icon: 'openwrt.png' },
  { name: 'DSM', key: 'dsm', date: '2026-04-12', icon: 'dsm.svg' },
  { name: 'DockerHost', key: 'docker', date: '2026-07-06', icon: 'docker.svg' },
  { name: 'NixOS', key: 'nixos', date: '2026-07-07', icon: 'nixos.svg' },
  { name: 'AI Router', key: 'ai2', url: 'https://sub2api.diesw.tech', date: '2026-06-08', icon: 'sub2api.png' },
  { name: 'CodexManager', key: 'ai', url: 'https://codex.diesw.tech', date: '2026-06-11', icon: 'codex-manager.png' },
  { name: 'Sandkasten', key: 'sandkasten', url: 'https://run.diesw.tech', date: '2026-06-10', icon: 'sandkasten.svg' },
  { name: 'VPS Net', key: 'vps', url: 'https://dashboard.netmaker.hc-dsw-nexus.me', date: '2026-04-10', icon: 'netmaker.png' },
  { name: 'Plex', key: 'plex', url: 'https://plex.diesw.tech', date: '2026-06-15', icon: 'plex.svg' },
  { name: 'Music Station', key: 'music', url: 'https://music.diesw.tech', date: '2026-06-15', icon: 'navidrome.png' },
  { name: 'Cloud Drive', key: 'cloud', url: 'https://cloud.diesw.tech', date: '2026-06-15', icon: 'nextcloud.svg' },
  { name: 'Uptime Kuma', key: 'uptime', url: 'https://kuma.diesw.tech', date: '2026-06-15', icon: 'uptime-kuma.svg' },
  { name: 'Nginx UI', key: 'nginx', url: 'https://nginx-ui.diesw.tech', date: '2026-06-19', icon: 'nginx-ui.png' },
  { name: 'Coder', key: 'coder', url: 'https://coder.diesw.tech', date: '2026-07-06', icon: 'coder.svg' },
  { name: 'VSCode-Web', key: 'vscode', url: 'https://vscode.diesw.tech', date: '2026-07-06', icon: 'vscode.png' },
]

initialInfra.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

export const infra = ref(initialInfra)

export default infra
