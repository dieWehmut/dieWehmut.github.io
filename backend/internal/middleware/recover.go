package middleware

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/dto"
)

func Recoverer(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Printf("panic recovered: %v", rec)
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusInternalServerError)
                _ = json.NewEncoder(w).Encode(dto.APIError{Error: "internal server error"})
            }
        }()
        next.ServeHTTP(w, r)
    })
}

