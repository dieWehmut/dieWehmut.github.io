package handler

import (
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	visitors *service.VisitorService
}

func NewStatsHandler(visitors *service.VisitorService) *StatsHandler {
	return &StatsHandler{visitors: visitors}
}

func (h *StatsHandler) GetStats(c *gin.Context) {
	respondJSONWithETag(c, 200, gin.H{
		"visitors": h.visitors.Count(),
	}, "no-cache")
}

func (h *StatsHandler) TrackVisit(c *gin.Context) {
	count, err := h.visitors.Increment()
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to persist visitor count"})
		return
	}

	c.Header("Cache-Control", "no-store")
	c.JSON(200, gin.H{"visitors": count})
}
