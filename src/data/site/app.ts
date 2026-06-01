import { ref } from 'vue'
import type { SiteProjectGroup } from '../../types/content'

export const apps = ref<SiteProjectGroup[]>([
  {
    name: 'Apps',
    autoLoad: true,
    description: 'Static apps list',
    manualItems: [
      {
        name: 'SugisarishiKage',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/SugisarishiKage',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: 'Contact the site owner for access',
        date: '2025-09-11',
      },
      {
        name: 'GeistZerfall',
        html_url: '',
        repo_url: 'https://github.com/dieWehmut/GeistZerfall',
        showDownload: false,
        downloadToast: true,
        downloadToastMessage: 'Contact the site owner for access',
        date: '2025-12-21',
      },
      {
        name: 'kotoba-hitomi',
        html_url: 'https://github.com/dieWehmut/kotoba-hitomi/releases/latest',
        repo_url: 'https://github.com/dieWehmut/kotoba-hitomi',
        showDownload: true,
        downloadToast: false,
        downloadToastMessage: 'Download started',
        date: '2025-10-01',
      },
    ],
  },
])

export default apps
