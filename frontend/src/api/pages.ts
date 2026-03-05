// Serverless API: /api/pages
// Runs on Vercel and uses process.env.GITHUB_TOKEN (set in Vercel Environment Variables)
// Returns a sorted list of pages (name, displayName, repoUrl, date, url)

const owners = ['dieWehmut', 'dieSehnsucht'];

const dateOverridesRaw = {
  'kotoba-hitomi': '2025-04-25',
  'profile': '2025-08-16',
  'notes': '2025-08-20',
  'hc-dsw-nexus': '2025-08-26',
  'nexus': '2025-08-26',
  'leereriss': '2025-11-02',
  'showcase': '2025-10-02',
  'korekushon': '2025-10-09'
};

// 转为小写 key，确保不区分大小写
const dateOverrides = Object.fromEntries(
  Object.entries(dateOverridesRaw).map(([k, v]) => [k.toLowerCase(), v])
);

const displayNameOverridesRaw = {
  'hc-dsw-nexus': 'nexus'
};
const displayNameOverrides = Object.fromEntries(
  Object.entries(displayNameOverridesRaw).map(([k, v]) => [k.toLowerCase(), v])
);

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

function getProjectDate(repoName, homepage, defaultDate) {
  // Normalize keys for robust matching
  function normalizeKey(key) {
    if (!key) return '';
    let k = key.toString().toLowerCase().trim();
    k = k.replace(/^https?:\/\//, '');
    k = k.replace(/\/$/, '');
    k = k.replace(/[#?].*$/, '');
    k = k.replace(/^www\./, '');
    k = k.replace(/[\s_]+/g, '-');
    return k;
  }

  function findOverride(key) {
    if (!key) return null;
    const base = normalizeKey(key);
    if (!base) return null;
    const variants = [
      base,
      base.split('.')[0],
      base.replace(/_/g, '-'),
      base.replace(/\s+/g, '-')
    ];
    for (const v of variants) {
      if (dateOverrides[v]) return dateOverrides[v];
    }
    return null;
  }

  try {
    if (homepage && typeof homepage === 'string') {
      const displayFromHomepage = normalizeKey(extractDisplayName(homepage, repoName));
      const override = findOverride(displayFromHomepage);
      if (override) {
        return override;
      }
    }
  } catch (e) {
    // ignore and fall back
  }

  const overrideByRepo = findOverride(repoName || '');
  if (overrideByRepo) return overrideByRepo;

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
          const finalDate = getProjectDate(repo.name, repo.homepage, repo.created_at);
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

  // cache on CDN for 5 minutes, but force browser revalidation immediately
  // - `max-age=0` ensures browsers will revalidate
  // - `s-maxage=300` allows CDN to cache for 5 minutes
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
  return res.json(allPages);
}
