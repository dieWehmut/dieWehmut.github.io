// Serverless API: /api/pages
// Runs on Vercel and uses process.env.GITHUB_TOKEN (set in Vercel Environment Variables)
// Returns a sorted list of pages (name, displayName, repoUrl, date, url)

const owners = ['dieWehmut', 'dieSehnsucht'];

const dateOverrides = {
  'kotoba-hitomi': '2025-04-25',
  'profile': '2025-08-16',
  'notes': '2025-08-20',
  'hc-dsw-nexus': '2025-08-26',
  'nexus': '2025-08-26',
  'leereriss': '2025-11-02'
};

const displayNameOverrides = {
  'hc-dsw-nexus': 'nexus'
};

function extractDisplayName(url, repoName = '') {
  if (repoName && displayNameOverrides[repoName.toLowerCase()]) {
    return displayNameOverrides[repoName.toLowerCase()];
  }
  try {
    let cleanUrl = url.replace(/^https?:\/\//, '');
    cleanUrl = cleanUrl.replace(/\/$/, '');
    const parts = cleanUrl.split('/');
    if (parts.length > 1 && parts[0].includes('github.io')) {
      return parts[parts.length - 1];
    }
    const firstPart = cleanUrl.split('.')[0];
    if (firstPart === 'www' && cleanUrl.includes('.')) {
      return cleanUrl.split('.')[1];
    }
    return firstPart;
  } catch (e) {
    return url;
  }
}

function getProjectDate(repoName, defaultDate) {
  const displayName = (repoName || '').toLowerCase();
  if (dateOverrides[displayName]) return dateOverrides[displayName];
  return defaultDate || null;
}

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN || '';
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const allPages = [];

  for (const owner of owners) {
    try {
      const reposRes = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100&sort=created&direction=desc`, { headers });
      if (!reposRes.ok) {
        // propagate error message for debugging but continue
        console.warn(`Failed to fetch repos for ${owner}: ${reposRes.status} ${reposRes.statusText}`);
        continue;
      }
      const repos = await reposRes.json();
      if (!Array.isArray(repos)) continue;

      for (const repo of repos) {
        if (repo.homepage && repo.homepage.trim()) {
          const finalDate = getProjectDate(repo.name, repo.created_at);
          allPages.push({
            name: repo.name,
            displayName: extractDisplayName(repo.homepage, repo.name),
            repoUrl: repo.html_url,
            date: finalDate,
            url: repo.homepage
          });
        }
      }
    } catch (e) {
      console.error(`Failed to load repos for ${owner}:`, e);
      // continue to next owner
    }
  }

  // sort newest first
  allPages.sort((a, b) => new Date(b.date) - new Date(a.date));

  // cache on CDN for 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res.json(allPages);
}
