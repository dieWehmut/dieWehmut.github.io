package repository

import (
	"fmt"
	"net/url"
	"path"
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

func (r *githubRepository) GetUser(username string) (*model.GitHubUser, error) {
    out := &model.GitHubUser{}
    err := r.client.GetJSON(path.Join("users", username), nil, 30*time.Minute, out)
    return out, err
}

func (r *githubRepository) GetRepo(owner, repo string) (*model.GitHubRepo, error) {
    out := &model.GitHubRepo{}
    err := r.client.GetJSON(path.Join("repos", owner, repo), nil, 60*time.Minute, out)
    return out, err
}

func (r *githubRepository) ListUserRepos(owner string) ([]model.GitHubRepo, error) {
    var out []model.GitHubRepo
    err := r.client.GetJSON(path.Join("users", owner, "repos"), map[string]string{
        "per_page":  "100",
        "sort":      "created",
        "direction": "desc",
    }, 10*time.Minute, &out)
    return out, err
}

func (r *githubRepository) ListRepoContents(owner, repo, p string) ([]model.GitHubContentItem, error) {
    endpoint := path.Join("repos", owner, repo, "contents")
    if p != "" {
        // Do not use path.Join for user-controlled subpath with slashes,
        // preserve exact path and escape segments safely.
        endpoint = fmt.Sprintf("repos/%s/%s/contents/%s", url.PathEscape(owner), url.PathEscape(repo), stringsTrimPrefixPath(p))
    }

    var out []model.GitHubContentItem
    err := r.client.GetJSON(endpoint, nil, 15*time.Minute, &out)
    return out, err
}

func stringsTrimPrefixPath(p string) string {
    for len(p) > 0 && p[0] == '/' {
        p = p[1:]
    }
    return p
}

func (r *githubRepository) GetLatestCommit(owner, repo, p string) (*model.GitHubCommit, error) {
    var out []model.GitHubCommit
    query := map[string]string{"per_page": "1"}
    if p != "" {
        query["path"] = p
    }
    if err := r.client.GetJSON(path.Join("repos", owner, repo, "commits"), query, 6*time.Hour, &out); err != nil {
        return nil, err
    }
    if len(out) == 0 {
        return nil, nil
    }
    return &out[0], nil
}

func (r *githubRepository) ListReleases(owner, repo string) ([]model.GitHubRelease, error) {
    var out []model.GitHubRelease
    err := r.client.GetJSON(path.Join("repos", owner, repo, "releases"), nil, 10*time.Minute, &out)
    return out, err
}

