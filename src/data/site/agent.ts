import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'

export const agents = ref<SiteProjectGroup[]>([
  {
    name: 'Agents',
    autoLoad: true,
    description: 'Static agents list',
    manualItems: [
      {
        name: 'Orchester',
        repo_url: 'https://github.com/dieWehmut/Orchester',
        showDownload: false,
        downloadToast: false,
        downloadToastMessage: 'Open the repository',
        lastModified: '2026-09-11',
      },
    ],
  },
])

export default agents
