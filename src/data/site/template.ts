import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'
import { siteConfig } from './config'

export const templates = ref<SiteProjectGroup[]>([
  {
    name: '模板',
    autoLoad: true,
    owner: siteConfig.githubUser,
    repo: 'diesuwa-starter',
    description: '静态模板列表',
    manualItems: [
      {
        name: 'diesuwa-starter',
        html_url: 'https://github.com/dieWehmut/diesuwa-starter',
        repo_url: 'https://github.com/dieWehmut/diesuwa-starter',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
        lastModified: '2026-05-28',
      },
      {
        name: 'sandkasten',
        html_url: 'https://github.com/dieWehmut/sandkasten',
        repo_url: 'https://github.com/dieWehmut/sandkasten',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
        lastModified: '2026-06-10',
      },
    ],
  },
])

export default templates
