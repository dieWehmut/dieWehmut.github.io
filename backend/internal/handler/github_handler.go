package handler

import (
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type GitHubHandler struct {
    service *service.GitHubService
}

func NewGitHubHandler(service *service.GitHubService) *GitHubHandler {
    return &GitHubHandler{service: service}
}

func (h *GitHubHandler) GetUser(c *gin.Context) {
    username := c.Param("username")
    if username == "" {
        c.JSON(400, gin.H{"error": "username is required"})
        return
    }
    user, err := h.service.GetUser(username)
    if err != nil {
        c.JSON(502, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, user)
}

func (h *GitHubHandler) GetRepo(c *gin.Context) {
    owner := c.Param("owner")
    repo := c.Param("repo")
    if owner == "" || repo == "" {
        c.JSON(400, gin.H{"error": "owner and repo are required"})
        return
    }
    data, err := h.service.GetRepo(owner, repo)
    if err != nil {
        c.JSON(502, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, data)
}

func (h *GitHubHandler) ListRepoContents(c *gin.Context) {
    owner := c.Param("owner")
    repo := c.Param("repo")
    p := c.Query("path")

    if owner == "" || repo == "" {
        c.JSON(400, gin.H{"error": "owner and repo are required"})
        return
    }
    data, err := h.service.ListRepoContents(owner, repo, p)
    if err != nil {
        c.JSON(502, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, data)
}

func (h *GitHubHandler) GetLatestCommit(c *gin.Context) {
    owner := c.Param("owner")
    repo := c.Param("repo")
    p := c.Query("path")

    if owner == "" || repo == "" {
        c.JSON(400, gin.H{"error": "owner and repo are required"})
        return
    }
    data, err := h.service.GetLatestCommit(owner, repo, p)
    if err != nil {
        c.JSON(502, gin.H{"error": err.Error()})
        return
    }
    if data == nil {
        c.JSON(200, map[string]any{})
        return
    }
    c.JSON(200, data)
}

func (h *GitHubHandler) ListReleases(c *gin.Context) {
    owner := c.Param("owner")
    repo := c.Param("repo")

    if owner == "" || repo == "" {
        c.JSON(400, gin.H{"error": "owner and repo are required"})
        return
    }
    data, err := h.service.ListReleases(owner, repo)
    if err != nil {
        c.JSON(502, gin.H{"error": err.Error()})
        return
    }
    c.JSON(200, data)
}

