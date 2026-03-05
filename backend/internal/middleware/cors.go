package middleware

import (
	"net/http"
	"strings"
)

func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
    normalized := make([]string, 0, len(allowedOrigins))
    wildcard := false
    for _, o := range allowedOrigins {
        v := strings.TrimSpace(o)
        if v == "" {
            continue
        }
        if v == "*" {
            wildcard = true
        }
        normalized = append(normalized, v)
    }
    if len(normalized) == 0 {
        wildcard = true
    }

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")
            allowOrigin := ""
            if wildcard {
                allowOrigin = "*"
            } else {
                for _, o := range normalized {
                    if o == origin {
                        allowOrigin = origin
                        break
                    }
                }
            }

            if allowOrigin != "" {
                w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
                w.Header().Set("Vary", "Origin")
                w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
            }

            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}

