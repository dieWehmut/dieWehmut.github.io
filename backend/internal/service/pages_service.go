package service

import (
	"net/url"
	"sort"
	"strings"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/dto"
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/repository"
)

type PagesService struct {
    repo   repository.GitHubRepository
    owners []string
}

func NewPagesService(repo repository.GitHubRepository) *PagesService {
    return &PagesService{
        repo:   repo,
        owners: []string{"dieWehmut", "dieSehnsucht"},
    }
}

var dateOverrides = map[string]string{
    "kotoba-hitomi": "2025-04-25",
    "profile":       "2025-08-16",
    "notes":         "2025-08-20",
    "hc-dsw-nexus":  "2025-08-26",
    "nexus":         "2025-08-26",
    "leereriss":     "2025-11-02",
    "showcase":      "2025-10-02",
    "korekushon":    "2025-10-09",
}

var displayNameOverrides = map[string]string{
    "hc-dsw-nexus": "nexus",
}

func normalizeKey(key string) string {
    k := strings.ToLower(strings.TrimSpace(key))
    k = strings.TrimPrefix(k, "http://")
    k = strings.TrimPrefix(k, "https://")
    k = strings.TrimSuffix(k, "/")
    if idx := strings.IndexAny(k, "?#"); idx >= 0 {
        k = k[:idx]
    }
    k = strings.TrimPrefix(k, "www.")
    k = strings.ReplaceAll(k, "_", "-")
    k = strings.Join(strings.Fields(k), "-")
    return k
}

func findOverride(key string) string {
    base := normalizeKey(key)
    if base == "" {
        return ""
    }

    variants := []string{base}
    if idx := strings.Index(base, "."); idx > 0 {
        variants = append(variants, base[:idx])
    }
    for _, v := range variants {
        if d, ok := dateOverrides[v]; ok {
            return d
        }
    }
    return ""
}

func extractDisplayName(homepage, repoName string) string {
    if v, ok := displayNameOverrides[strings.ToLower(repoName)]; ok {
        return v
    }

    cleaned := strings.TrimSpace(homepage)
    if cleaned == "" {
        return repoName
    }

    u, err := url.Parse(cleaned)
    if err != nil {
        return homepage
    }

    host := strings.TrimPrefix(u.Host, "www.")
    pathPart := strings.Trim(u.Path, "/")

    if strings.Contains(host, "github.io") && pathPart != "" {
        parts := strings.Split(pathPart, "/")
        return parts[len(parts)-1]
    }

    hostParts := strings.Split(host, ".")
    if len(hostParts) > 0 {
        return hostParts[0]
    }
    return homepage
}

func resolveDate(repoName, homepage, defaultDate string) string {
    if homepage != "" {
        fromHomepage := extractDisplayName(homepage, repoName)
        if d := findOverride(fromHomepage); d != "" {
            return d
        }
    }
    if d := findOverride(repoName); d != "" {
        return d
    }
    return defaultDate
}

func (s *PagesService) ListPages() ([]dto.PageItem, error) {
    pages := make([]dto.PageItem, 0)

    for _, owner := range s.owners {
        repos, err := s.repo.ListUserRepos(owner)
        if err != nil {
            continue
        }
        for _, r := range repos {
            homepage := strings.TrimSpace(r.Homepage)
            if homepage == "" {
                continue
            }
            pages = append(pages, dto.PageItem{
                Name:        r.Name,
                DisplayName: extractDisplayName(homepage, r.Name),
                RepoURL:     r.HTMLURL,
                Date:        resolveDate(r.Name, homepage, r.CreatedAt),
                URL:         homepage,
            })
        }
    }

    sort.Slice(pages, func(i, j int) bool {
        return pages[i].Date > pages[j].Date
    })
    return pages, nil
}

