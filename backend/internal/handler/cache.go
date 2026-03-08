package handler

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"strings"

	"github.com/gin-gonic/gin"
)

func respondJSONWithETag(c *gin.Context, status int, payload any, cacheControl string) {
	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to encode response"})
		return
	}

	sum := sha1.Sum(body)
	etag := `W/"` + hex.EncodeToString(sum[:]) + `"`

	if cacheControl != "" {
		c.Header("Cache-Control", cacheControl)
	}
	c.Header("ETag", etag)

	if matchesETag(c.GetHeader("If-None-Match"), etag) {
		c.Status(304)
		return
	}

	c.Data(status, "application/json; charset=utf-8", body)
}

func matchesETag(headerValue string, currentETag string) bool {
	if headerValue == "" || currentETag == "" {
		return false
	}
	for _, candidate := range strings.Split(headerValue, ",") {
		trimmed := strings.TrimSpace(candidate)
		if trimmed == "*" || trimmed == currentETag {
			return true
		}
	}
	return false
}