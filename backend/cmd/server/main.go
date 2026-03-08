package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/database"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/github"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/handler"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/repository"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-gonic/gin"
)

func getenv(key, fallback string) string {
    v := strings.TrimSpace(os.Getenv(key))
    if v == "" {
        return fallback
    }
    return v
}

func main() {
    port := getenv("PORT", "7860")
    githubToken := getenv("GITHUB_TOKEN", "")
    githubAPIBase := getenv("GITHUB_API_BASE", "https://api.github.com")

    if strings.EqualFold(getenv("GIN_MODE", ""), "release") {
        gin.SetMode(gin.ReleaseMode)
    }

    cacheStore := database.NewMemoryCache()
    httpClient := &http.Client{Timeout: 15 * time.Second}
    ghClient := github.NewClient(httpClient, githubAPIBase, githubToken, cacheStore)
    ghRepo := repository.NewGitHubRepository(ghClient)

    githubService := service.NewGitHubService(ghRepo)
    pagesService := service.NewPagesService(ghRepo)

    router := handler.NewRouter(githubService, pagesService)

    addr := ":" + port
    log.Printf("backend server listening on %s", addr)
    if err := router.Run(addr); err != nil {
        log.Fatalf("server error: %v", err)
    }
}

