package config

import (
	"os"
	"strings"

	"github.com/gin-contrib/cors"
)

var defaultAllowedOrigins = []string{
    "https://diewehmut.github.io",
    "https://www.hc-dsw-nexus.me",
    "https://hc-dsw-nexus.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}

func parseCSV(value string) []string {
    out := make([]string, 0)
    for _, item := range strings.Split(value, ",") {
        v := strings.TrimSpace(item)
        if v != "" {
            out = append(out, v)
        }
    }
    return out
}

func AllowedOrigins() []string {
    fromEnv := parseCSV(os.Getenv("ALLOWED_ORIGINS"))
    if len(fromEnv) > 0 {
        return fromEnv
    }
    return defaultAllowedOrigins
}

func CORSConfig() cors.Config {
    return cors.Config{
        AllowOrigins:     AllowedOrigins(),
        AllowMethods:     []string{"GET", "POST", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: false,
    }
}
