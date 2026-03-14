package repository

import (
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/github"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/model"
)

type GitHubRepository interface {
	GetUser(username string) (*model.GitHubUser, error)
	GetRepo(owner, repo string) (*model.GitHubRepo, error)
	ListUserRepos(owner string) ([]model.GitHubRepo, error)
	ListRepoContents(owner, repo, p string) ([]model.GitHubContentItem, error)
	GetLatestCommit(owner, repo, p string) (*model.GitHubCommit, error)
	ListReleases(owner, repo string) ([]model.GitHubRelease, error)
}

type githubRepository struct {
	client *github.Client
}

func NewGitHubRepository(client *github.Client) GitHubRepository {
	return &githubRepository{client: client}
}

const (
	queryGetUser = `
query($login: String!) {
  user(login: $login) {
    login
    avatarUrl
    followers {
      totalCount
    }
  }
}`
	queryGetRepo = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    name
    url
    homepageUrl
    createdAt
    defaultBranchRef {
      name
    }
  }
}`
	queryListUserRepos = `
query($login: String!) {
  user(login: $login) {
    repositories(first: 100, orderBy: {field: CREATED_AT, direction: DESC}, privacy: PUBLIC) {
      nodes {
        name
        url
        homepageUrl
        createdAt
        defaultBranchRef {
          name
        }
      }
    }
  }
}`
	queryRepoContents = `
query($owner: String!, $name: String!, $expr: String!) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      name
    }
    object(expression: $expr) {
      ... on Tree {
        entries {
          name
          type
          object {
            ... on Blob {
              oid
              byteSize
            }
            ... on Tree {
              oid
            }
          }
        }
      }
    }
  }
}`
	queryLatestCommit = `
query($owner: String!, $name: String!, $path: String) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 1, path: $path) {
            nodes {
              oid
              committedDate
              authoredDate
            }
          }
        }
      }
    }
  }
}`
	queryReleases = `
query($owner: String!, $name: String!, $first: Int!) {
  repository(owner: $owner, name: $name) {
    releases(first: $first, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        tagName
        url
        publishedAt
        createdAt
        releaseAssets(first: 100) {
          nodes {
            name
            downloadUrl
          }
        }
      }
    }
  }
}`
)

type repoNode struct {
	Name             string `json:"name"`
	URL              string `json:"url"`
	HomepageURL      string `json:"homepageUrl"`
	CreatedAt        string `json:"createdAt"`
	DefaultBranchRef *struct {
		Name string `json:"name"`
	} `json:"defaultBranchRef"`
}

func stringsTrimPrefixPath(p string) string {
	for len(p) > 0 && p[0] == '/' {
		p = p[1:]
	}
	return p
}

func joinRepoPath(prefix, name string) string {
	prefix = stringsTrimPrefixPath(prefix)
	if prefix == "" {
		return name
	}
	return prefix + "/" + name
}

func escapeRepoPath(p string) string {
	if p == "" {
		return ""
	}
	parts := strings.Split(p, "/")
	for i, part := range parts {
		parts[i] = url.PathEscape(part)
	}
	return strings.Join(parts, "/")
}

func mapContentType(value string) string {
	switch strings.ToLower(value) {
	case "tree":
		return "dir"
	case "blob":
		return "file"
	default:
		return value
	}
}

func (r *githubRepository) GetUser(username string) (*model.GitHubUser, error) {
	var resp struct {
		User *struct {
			Login     string `json:"login"`
			AvatarURL string `json:"avatarUrl"`
			Followers struct {
				TotalCount int `json:"totalCount"`
			} `json:"followers"`
		} `json:"user"`
	}

	if err := r.client.PostGraphQL(queryGetUser, map[string]any{
		"login": username,
	}, 30*time.Minute, &resp); err != nil {
		return nil, err
	}

	if resp.User == nil {
		return nil, nil
	}

	return &model.GitHubUser{
		Login:     resp.User.Login,
		AvatarURL: resp.User.AvatarURL,
		Followers: resp.User.Followers.TotalCount,
	}, nil
}

func (r *githubRepository) GetRepo(owner, repo string) (*model.GitHubRepo, error) {
	var resp struct {
		Repository *repoNode `json:"repository"`
	}

	if err := r.client.PostGraphQL(queryGetRepo, map[string]any{
		"owner": owner,
		"name":  repo,
	}, 60*time.Minute, &resp); err != nil {
		return nil, err
	}

	if resp.Repository == nil {
		return nil, nil
	}

	defaultBranch := ""
	if resp.Repository.DefaultBranchRef != nil {
		defaultBranch = resp.Repository.DefaultBranchRef.Name
	}

	return &model.GitHubRepo{
		Name:       resp.Repository.Name,
		HTMLURL:    resp.Repository.URL,
		Homepage:   resp.Repository.HomepageURL,
		CreatedAt:  resp.Repository.CreatedAt,
		DefaultRef: defaultBranch,
	}, nil
}

func (r *githubRepository) ListUserRepos(owner string) ([]model.GitHubRepo, error) {
	var resp struct {
		User *struct {
			Repositories struct {
				Nodes []repoNode `json:"nodes"`
			} `json:"repositories"`
		} `json:"user"`
	}

	if err := r.client.PostGraphQL(queryListUserRepos, map[string]any{
		"login": owner,
	}, 10*time.Minute, &resp); err != nil {
		return nil, err
	}

	if resp.User == nil {
		return nil, nil
	}

	out := make([]model.GitHubRepo, 0, len(resp.User.Repositories.Nodes))
	for _, node := range resp.User.Repositories.Nodes {
		defaultBranch := ""
		if node.DefaultBranchRef != nil {
			defaultBranch = node.DefaultBranchRef.Name
		}
		out = append(out, model.GitHubRepo{
			Name:       node.Name,
			HTMLURL:    node.URL,
			Homepage:   node.HomepageURL,
			CreatedAt:  node.CreatedAt,
			DefaultRef: defaultBranch,
		})
	}
	return out, nil
}

func (r *githubRepository) ListRepoContents(owner, repo, p string) ([]model.GitHubContentItem, error) {
	cleanPath := stringsTrimPrefixPath(p)
	expr := "HEAD:"
	if cleanPath != "" {
		expr = "HEAD:" + cleanPath
	}

	var resp struct {
		Repository struct {
			DefaultBranchRef *struct {
				Name string `json:"name"`
			} `json:"defaultBranchRef"`
			Object *struct {
				Entries []struct {
					Name   string `json:"name"`
					Type   string `json:"type"`
					Object *struct {
						OID      string `json:"oid"`
						ByteSize int64  `json:"byteSize"`
					} `json:"object"`
				} `json:"entries"`
			} `json:"object"`
		} `json:"repository"`
	}

	if err := r.client.PostGraphQL(queryRepoContents, map[string]any{
		"owner": owner,
		"name":  repo,
		"expr":  expr,
	}, 15*time.Minute, &resp); err != nil {
		return nil, err
	}

	if resp.Repository.Object == nil {
		return []model.GitHubContentItem{}, nil
	}

	branch := "HEAD"
	if resp.Repository.DefaultBranchRef != nil && resp.Repository.DefaultBranchRef.Name != "" {
		branch = resp.Repository.DefaultBranchRef.Name
	}

	out := make([]model.GitHubContentItem, 0, len(resp.Repository.Object.Entries))
	for _, entry := range resp.Repository.Object.Entries {
		entryPath := joinRepoPath(cleanPath, entry.Name)
		itemType := mapContentType(entry.Type)
		escapedPath := escapeRepoPath(entryPath)

		htmlURL := ""
		downloadURL := ""
		if itemType == "dir" {
			htmlURL = fmt.Sprintf("https://github.com/%s/%s/tree/%s/%s", owner, repo, branch, escapedPath)
		} else if itemType == "file" {
			htmlURL = fmt.Sprintf("https://github.com/%s/%s/blob/%s/%s", owner, repo, branch, escapedPath)
			downloadURL = fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s", owner, repo, branch, escapedPath)
		}

		sha := ""
		size := int64(0)
		if entry.Object != nil {
			sha = entry.Object.OID
			size = entry.Object.ByteSize
		}

		out = append(out, model.GitHubContentItem{
			Name:        entry.Name,
			Path:        entryPath,
			Type:        itemType,
			DownloadURL: downloadURL,
			HTMLURL:     htmlURL,
			SHA:         sha,
			Size:        size,
		})
	}

	return out, nil
}

func (r *githubRepository) GetLatestCommit(owner, repo, p string) (*model.GitHubCommit, error) {
	var pathArg any = nil
	if strings.TrimSpace(p) != "" {
		pathArg = p
	}

	var resp struct {
		Repository struct {
			DefaultBranchRef *struct {
				Target *struct {
					History struct {
						Nodes []struct {
							OID           string `json:"oid"`
							CommittedDate string `json:"committedDate"`
							AuthoredDate  string `json:"authoredDate"`
						} `json:"nodes"`
					} `json:"history"`
				} `json:"target"`
			} `json:"defaultBranchRef"`
		} `json:"repository"`
	}

	if err := r.client.PostGraphQL(queryLatestCommit, map[string]any{
		"owner": owner,
		"name":  repo,
		"path":  pathArg,
	}, 6*time.Hour, &resp); err != nil {
		return nil, err
	}

	if resp.Repository.DefaultBranchRef == nil || resp.Repository.DefaultBranchRef.Target == nil {
		return nil, nil
	}

	nodes := resp.Repository.DefaultBranchRef.Target.History.Nodes
	if len(nodes) == 0 {
		return nil, nil
	}

	node := nodes[0]
	commit := &model.GitHubCommit{SHA: node.OID}
	commit.Commit.Author.Date = node.AuthoredDate
	commit.Commit.Committer.Date = node.CommittedDate
	return commit, nil
}

func (r *githubRepository) ListReleases(owner, repo string) ([]model.GitHubRelease, error) {
	var resp struct {
		Repository struct {
			Releases struct {
				Nodes []struct {
					TagName       string `json:"tagName"`
					URL           string `json:"url"`
					PublishedAt   string `json:"publishedAt"`
					CreatedAt     string `json:"createdAt"`
					ReleaseAssets struct {
						Nodes []struct {
							Name        string `json:"name"`
							DownloadURL string `json:"downloadUrl"`
						} `json:"nodes"`
					} `json:"releaseAssets"`
				} `json:"nodes"`
			} `json:"releases"`
		} `json:"repository"`
	}

	if err := r.client.PostGraphQL(queryReleases, map[string]any{
		"owner": owner,
		"name":  repo,
		"first": 100,
	}, 10*time.Minute, &resp); err != nil {
		return nil, err
	}

	out := make([]model.GitHubRelease, 0, len(resp.Repository.Releases.Nodes))
	for _, node := range resp.Repository.Releases.Nodes {
		release := model.GitHubRelease{
			TagName:     node.TagName,
			HTMLURL:     node.URL,
			PublishedAt: node.PublishedAt,
			CreatedAt:   node.CreatedAt,
		}

		if len(node.ReleaseAssets.Nodes) > 0 {
			release.Assets = make([]model.GitHubReleaseAsset, 0, len(node.ReleaseAssets.Nodes))
			for _, asset := range node.ReleaseAssets.Nodes {
				release.Assets = append(release.Assets, model.GitHubReleaseAsset{
					Name:               asset.Name,
					BrowserDownloadURL: asset.DownloadURL,
				})
			}
		}

		out = append(out, release)
	}

	return out, nil
}
