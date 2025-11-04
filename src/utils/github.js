// GitHub API utilities

/**
 * Get GitHub API headers with authentication token
 * @returns {Object} Headers object with Authorization if token is available
 */
export function getGitHubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Get GitHub token from environment
 * @returns {string} GitHub token or empty string
 */
export function getGitHubToken() {
  return import.meta.env.VITE_GITHUB_TOKEN || '';
}
