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

type graphQLRequest struct {
	Query     string         `json:"query"`
	Variables map[string]any `json:"variables,omitempty"`
}

type graphQLResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

func (c *Client) graphqlEndpoint() string {
	base := strings.TrimRight(c.baseURL, "/")
	if strings.HasSuffix(base, "/graphql") {
		return base
	}
	if strings.HasSuffix(base, "/api/v3") {
		return strings.TrimSuffix(base, "/api/v3") + "/api/graphql"
	}
	return base + "/graphql"
}

func (c *Client) PostGraphQL(query string, variables map[string]any, ttl time.Duration, out any) error {
	endpoint := c.graphqlEndpoint()
	payload, err := json.Marshal(graphQLRequest{
		Query:     query,
		Variables: variables,
	})
	if err != nil {
		return fmt.Errorf("marshal graphql request: %w", err)
	}

	cacheKey := "POST:" + endpoint + ":" + string(payload)
	if c.cache != nil {
		if raw, ok := c.cache.Get(cacheKey); ok {
			return json.NewDecoder(bytes.NewReader(raw)).Decode(out)
		}
	}

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("Content-Type", "application/json")
	if strings.TrimSpace(c.token) != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request github graphql: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("github graphql: status %d body %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var parsed graphQLResponse
	if err := json.NewDecoder(bytes.NewReader(body)).Decode(&parsed); err != nil {
		return fmt.Errorf("decode graphql response: %w", err)
	}
	if len(parsed.Errors) > 0 {
		return fmt.Errorf("graphql error: %s", parsed.Errors[0].Message)
	}

	if c.cache != nil && ttl > 0 && len(parsed.Data) > 0 {
		c.cache.Set(cacheKey, parsed.Data, ttl)
	}

	if err := json.NewDecoder(bytes.NewReader(parsed.Data)).Decode(out); err != nil {
		return fmt.Errorf("decode graphql data: %w", err)
	}
	return nil
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
