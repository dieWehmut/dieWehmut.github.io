package handler

import (
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const (
	spaceURLEnv = "HF_SPACE_URL"
	tokenEnv    = "HF_TOKEN"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	spaceURL := strings.TrimSpace(os.Getenv(spaceURLEnv))
	if spaceURL == "" {
		http.Error(w, "missing HF_SPACE_URL", http.StatusInternalServerError)
		return
	}

	target := strings.TrimSpace(r.URL.Query().Get("target"))
	if target == "" {
		http.Error(w, "missing target", http.StatusBadRequest)
		return
	}

	if !strings.HasPrefix(target, "/") {
		target = "/" + target
	}

	targetURL, err := url.Parse(target)
	if err != nil || targetURL.IsAbs() || targetURL.Scheme != "" || targetURL.Host != "" {
		http.Error(w, "invalid target", http.StatusBadRequest)
		return
	}

	base := strings.TrimRight(spaceURL, "/")
	upstreamPath := targetURL.Path
	if upstreamPath == "" {
		upstreamPath = "/"
	}

	query := mergeQuery(r.URL.Query(), targetURL.RawQuery)
	upstreamURL := base + upstreamPath
	if query != "" {
		upstreamURL += "?" + query
	}

	req, err := http.NewRequestWithContext(r.Context(), r.Method, upstreamURL, r.Body)
	if err != nil {
		http.Error(w, "failed to create upstream request", http.StatusBadGateway)
		return
	}

	copyHeaders(req.Header, r.Header)

	token := strings.TrimSpace(os.Getenv(tokenEnv))
	if token != "" {
		if strings.HasPrefix(strings.ToLower(token), "bearer ") {
			req.Header.Set("Authorization", token)
		} else {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "upstream request failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	copyHeaders(w.Header(), resp.Header)
	w.WriteHeader(resp.StatusCode)

	if r.Method == http.MethodHead {
		return
	}

	_, _ = io.Copy(w, resp.Body)
}

func mergeQuery(original url.Values, targetRawQuery string) string {
	combined := url.Values{}
	for key, values := range original {
		if strings.EqualFold(key, "target") {
			continue
		}
		for _, value := range values {
			combined.Add(key, value)
		}
	}

	if targetRawQuery == "" {
		return combined.Encode()
	}

	targetValues, err := url.ParseQuery(targetRawQuery)
	if err != nil {
		return combined.Encode()
	}

	for key, values := range targetValues {
		for _, value := range values {
			combined.Add(key, value)
		}
	}

	return combined.Encode()
}

func copyHeaders(dst, src http.Header) {
	for key, values := range src {
		if isHopByHopHeader(key) {
			continue
		}
		dst.Del(key)
		for _, value := range values {
			dst.Add(key, value)
		}
	}
}

func isHopByHopHeader(name string) bool {
	switch strings.ToLower(name) {
	case "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade":
		return true
	default:
		return false
	}
}
