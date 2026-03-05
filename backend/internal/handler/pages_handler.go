package handler

import (
	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type PagesHandler struct {
    service *service.PagesService
}

func NewPagesHandler(service *service.PagesService) *PagesHandler {
    return &PagesHandler{service: service}
}

func (h *PagesHandler) ListPages(c *gin.Context) {
    pages, err := h.service.ListPages()
    if err != nil {
        c.JSON(502, gin.H{"error": err.Error()})
        return
    }
    c.Header("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=60")
    c.JSON(200, pages)
}

