import { ref } from 'vue'
import type { WebsiteEntry } from '../../types/content'

export const pages = ref<WebsiteEntry[]>([
  {
    name: 'kotoba-hitomi',
    displayName: 'kotoba-hitomi',
    repoUrl: 'https://github.com/dieWehmut/kotoba-hitomi',
    date: '2025-04-25',
    url: 'https://kotoba-hitomi.hc-dsw-nexus.me',
  },
  {
    name: 'nexus',
    displayName: 'nexus',
    repoUrl: 'https://github.com/dieWehmut/dieWehmut.github.io',
    date: '2025-08-26',
    url: 'https://diesw.tech',
  },
  {
    name: 'korekushon',
    displayName: 'korekushon',
    repoUrl: 'https://github.com/dieWehmut/korekushon',
    date: '2025-10-09',
    url: 'https://korekushon.hc-dsw-nexus.me',
  },
  {
    name: 'inner',
    displayName: 'inner',
    repoUrl: 'https://github.com/dieWehmut/inner',
    date: '2025-10-10',
    url: 'https://inner.hc-dsw-nexus.me/',
  },
  {
    name: 'ba-network',
    displayName: 'ba-network',
    repoUrl: 'https://github.com/dieWehmut/ba-network',
    date: '2025-10-30',
    url: 'https://ba-network.hc-dsw-nexus.me',
  },
  {
    name: 'leereriss',
    displayName: 'leereriss',
    repoUrl: 'https://github.com/dieWehmut/LeereRiss',
    date: '2025-11-02',
    url: 'https://leereriss.hc-dsw-nexus.me',
  },
  {
    name: 'music-converter',
    displayName: 'music-converter',
    repoUrl: 'https://github.com/dieWehmut/music-converter',
    date: '2025-11-13',
    url: 'https://music-converter.hc-dsw-nexus.me',
  },
])

export default pages
