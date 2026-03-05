package service

import (
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/model"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/repository"
)

type GitHubService struct {
    repo repository.GitHubRepository
}

func NewGitHubService(repo repository.GitHubRepository) *GitHubService {
    return &GitHubService{repo: repo}
}

func (s *GitHubService) GetUser(username string) (*model.GitHubUser, error) {
    return s.repo.GetUser(username)
}

func (s *GitHubService) GetRepo(owner, repo string) (*model.GitHubRepo, error) {
    return s.repo.GetRepo(owner, repo)
}

func (s *GitHubService) ListRepoContents(owner, repo, p string) ([]model.GitHubContentItem, error) {
    return s.repo.ListRepoContents(owner, repo, p)
}

func (s *GitHubService) GetLatestCommit(owner, repo, p string) (*model.GitHubCommit, error) {
    return s.repo.GetLatestCommit(owner, repo, p)
}

func (s *GitHubService) ListReleases(owner, repo string) ([]model.GitHubRelease, error) {
    return s.repo.ListReleases(owner, repo)
}

