package handler

import (
	"github.com/dieWehmut/dieWehmut.github.io/backend/config"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Router struct {
	github   *GitHubHandler
	pages    *PagesHandler
	watching *WatchingHandler
}

func NewRouter(githubService *service.GitHubService, pagesService *service.PagesService, watchingService *service.WatchingService) *gin.Engine {
	r := &Router{
		github:   NewGitHubHandler(githubService),
		pages:    NewPagesHandler(pagesService),
		watching: NewWatchingHandler(watchingService),
	}

	engine := gin.New()
	engine.Use(gin.Logger(), gin.Recovery())
	engine.Use(cors.New(config.CORSConfig()))

	engine.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// root path is used by some deployment hosts (e.g. HuggingFace Spaces) to
	// verify that the container is running. return a simple success message
	// instead of 404 so that their UI/health check stops spamming the logs.
	engine.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "backend running"})
	})
	engine.GET("/api", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service": "nexus-backend",
			"status":  "ok",
		})
	})
	engine.GET("/api/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "pong"})
	})
	engine.GET("/api/pages", r.pages.ListPages)

	// 实时在线人数相关路由
	engine.GET("/api/watching/stream", r.watching.HandleSSEStream)
	engine.POST("/api/watching/ping", r.watching.HandlePing)
	engine.GET("/api/watching/count", r.watching.GetCurrentCount)

	// 兼容性路由（可选）
	engine.GET("/api/stats", r.watching.GetStats)

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
