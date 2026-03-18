package handler

import (
	"log"
	"time"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type WatchingHandler struct {
	service *service.WatchingService
}

func NewWatchingHandler(service *service.WatchingService) *WatchingHandler {
	return &WatchingHandler{service: service}
}

// HandleSSEStream 处理SSE流式连接
func (h *WatchingHandler) HandleSSEStream(c *gin.Context) {
	// 检查是否支持SSE
	acceptHeader := c.GetHeader("Accept")
	if acceptHeader != "" && acceptHeader != "text/event-stream" {
		c.JSON(400, gin.H{"error": "SSE not supported by client"})
		return
	}

	// 创建连接
	conn, err := h.service.AddConnection(c.Writer, c.Request.Context())
	if err != nil {
		c.JSON(503, gin.H{"error": err.Error()})
		return
	}

	// 连接关闭时清理
	defer func() {
		h.service.RemoveConnection(conn.ID)
		log.Printf("SSE connection closed: %s", conn.ID)
	}()

	log.Printf("SSE connection established: %s", conn.ID)

	// 保持连接并发送数据
	for {
		select {
		case data, ok := <-conn.Channel:
			if !ok {
				return // 通道已关闭
			}

			// 发送SSE数据
			_, err := c.Writer.WriteString("data: " + string(data) + "\n\n")
			if err != nil {
				return // 连接已断开
			}

			conn.Flusher.Flush()

		case <-conn.Context.Done():
			return // 请求已取消

		case <-c.Request.Context().Done():
			return // 客户端断开连接
		}
	}
}

// HandlePing 处理心跳请求
func (h *WatchingHandler) HandlePing(c *gin.Context) {
	connID := c.GetHeader("X-Connection-ID")
	if connID != "" {
		h.service.UpdateConnectionPing(connID)
	}

	c.JSON(200, gin.H{
		"status":    "pong",
		"timestamp": time.Now().Unix(),
		"count":     h.service.GetOnlineCount(),
	})
}

// GetCurrentCount 获取当前在线人数（降级方案）
func (h *WatchingHandler) GetCurrentCount(c *gin.Context) {
	count := h.service.GetOnlineCount()

	c.Header("X-Online-Count", string(count))

	respondJSONWithETag(c, 200, gin.H{
		"count":     count,
		"timestamp": time.Now().Unix(),
		"type":      "online_count",
	}, "no-cache")
}

// GetStats 处理兼容性端点（可选）
func (h *WatchingHandler) GetStats(c *gin.Context) {
	count := h.service.GetOnlineCount()

	respondJSONWithETag(c, 200, gin.H{
		"online": count,
		"watching": count, // 兼容性字段
		"timestamp": time.Now().Unix(),
	}, "no-cache")
}