package handler

import (
	"github.com/dieWehmut/dieWehmut.github.io/backend/config"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Router struct {
    github *GitHubHandler
    pages  *PagesHandler
}

func NewRouter(githubService *service.GitHubService, pagesService *service.PagesService) *gin.Engine {
    r := &Router{
        github: NewGitHubHandler(githubService),
        pages:  NewPagesHandler(pagesService),
    }

    engine := gin.New()
    engine.Use(gin.Logger(), gin.Recovery())
    engine.Use(cors.New(config.CORSConfig()))

    engine.GET("/healthz", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })

    engine.GET("/api/pages", r.pages.ListPages)

    engine.GET("/api/github/user/:username", r.github.GetUser)
    engine.GET("/api/github/repos/:owner/:repo", r.github.GetRepo)
    engine.GET("/api/github/repos/:owner/:repo/contents", r.github.ListRepoContents)
    engine.GET("/api/github/repos/:owner/:repo/commits/latest", r.github.GetLatestCommit)
    engine.GET("/api/github/repos/:owner/:repo/releases", r.github.ListReleases)

    engine.NoRoute(func(c *gin.Context) {
        c.JSON(404, gin.H{"error": "route not found"})
    })

    return engine
}

