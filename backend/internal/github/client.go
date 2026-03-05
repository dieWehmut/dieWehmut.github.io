package github

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/database"
)

type Client struct {
    httpClient *http.Client
    baseURL    string
    token      string
    cache      *database.MemoryCache
}

func NewClient(httpClient *http.Client, baseURL, token string, cache *database.MemoryCache) *Client {
    return &Client{
        httpClient: httpClient,
        baseURL:    strings.TrimRight(baseURL, "/"),
        token:      token,
        cache:      cache,
    }
}

func (c *Client) GetJSON(path string, query map[string]string, ttl time.Duration, out any) error {
    endpoint, err := url.JoinPath(c.baseURL, strings.TrimPrefix(path, "/"))
    if err != nil {
        return fmt.Errorf("join path: %w", err)
    }

    u, err := url.Parse(endpoint)
    if err != nil {
        return fmt.Errorf("parse endpoint: %w", err)
    }

    q := u.Query()
    for k, v := range query {
        if strings.TrimSpace(v) != "" {
            q.Set(k, v)
        }
    }
    u.RawQuery = q.Encode()

    cacheKey := "GET:" + u.String()
    if c.cache != nil {
        if raw, ok := c.cache.Get(cacheKey); ok {
            return json.NewDecoder(bytes.NewReader(raw)).Decode(out)
        }
    }

    req, err := http.NewRequest(http.MethodGet, u.String(), nil)
    if err != nil {
        return fmt.Errorf("new request: %w", err)
    }
    req.Header.Set("Accept", "application/vnd.github.v3+json")
    if strings.TrimSpace(c.token) != "" {
        req.Header.Set("Authorization", "Bearer "+c.token)
    }

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return fmt.Errorf("request github: %w", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return fmt.Errorf("read response: %w", err)
    }

    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        return fmt.Errorf("github api %s: status %d body %s", u.Path, resp.StatusCode, strings.TrimSpace(string(body)))
    }

    if c.cache != nil && ttl > 0 {
        c.cache.Set(cacheKey, body, ttl)
    }

    if err := json.NewDecoder(bytes.NewReader(body)).Decode(out); err != nil {
        return fmt.Errorf("decode response: %w", err)
    }
    return nil
}

