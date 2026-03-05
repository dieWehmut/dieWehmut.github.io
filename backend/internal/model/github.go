package model

type GitHubUser struct {
	Login     string `json:"login"`
	AvatarURL string `json:"avatar_url"`
	Followers int    `json:"followers"`
}

type GitHubRepo struct {
	Name       string `json:"name"`
	HTMLURL    string `json:"html_url"`
	Homepage   string `json:"homepage"`
	CreatedAt  string `json:"created_at"`
	DefaultRef string `json:"default_branch"`
}

type GitHubContentItem struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	Type        string `json:"type"`
	DownloadURL string `json:"download_url"`
	HTMLURL     string `json:"html_url"`
	SHA         string `json:"sha"`
	Size        int64  `json:"size"`
}

type GitHubCommit struct {
	SHA    string `json:"sha"`
	Commit struct {
		Author struct {
			Date string `json:"date"`
		} `json:"author"`
		Committer struct {
			Date string `json:"date"`
		} `json:"committer"`
	} `json:"commit"`
}

type GitHubRelease struct {
	TagName     string               `json:"tag_name"`
	HTMLURL     string               `json:"html_url"`
	PublishedAt string               `json:"published_at"`
	CreatedAt   string               `json:"created_at"`
	Assets      []GitHubReleaseAsset `json:"assets"`
}

type GitHubReleaseAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

