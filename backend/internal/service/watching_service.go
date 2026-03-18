package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/dieWehmut/dieWehmut.github.io/backend/internal/database"
	"github.com/gin-gonic/gin"
)

const (
	BroadcastInterval    = 10 * time.Second     // 10秒广播间隔
	ConnectionTimeout    = 30 * time.Second     // 30秒连接超时
	MaxConnections      = 1000                  // 最大连接数限制
)

type Connection struct {
	ID       string
	Writer   gin.ResponseWriter
	Flusher  http.Flusher
	Channel  chan []byte
	LastPing time.Time
	Closed   atomic.Bool
	Context  context.Context
	Cancel   context.CancelFunc
}

type WatchingService struct {
	connections sync.Map          // map[string]*Connection
	count       atomic.Int64      // 当前在线人数
	ticker      *time.Ticker      // 定时广播器
	stopChan    chan struct{}     // 停止服务信号
	cache       *database.MemoryCache
	mu          sync.RWMutex      // 保护服务状态
	running     bool
}

type WatchingMessage struct {
	Type      string    `json:"type"`
	Count     int64     `json:"count"`
	Timestamp time.Time `json:"timestamp"`
}

func NewWatchingService(cache *database.MemoryCache) *WatchingService {
	service := &WatchingService{
		cache:    cache,
		stopChan: make(chan struct{}),
	}
	service.start()
	return service
}

func (s *WatchingService) start() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return
	}

	s.ticker = time.NewTicker(BroadcastInterval)
	s.running = true

	go s.broadcastLoop()
}

func (s *WatchingService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	close(s.stopChan)
	if s.ticker != nil {
		s.ticker.Stop()
	}
	s.running = false

	// 清理所有连接
	s.connections.Range(func(key, value interface{}) bool {
		if conn, ok := value.(*Connection); ok {
			s.removeConnection(conn)
		}
		return true
	})
}

func (s *WatchingService) broadcastLoop() {
	for {
		select {
		case <-s.ticker.C:
			s.broadcastOnlineCount()
			s.cleanupStaleConnections()
		case <-s.stopChan:
			return
		}
	}
}

func (s *WatchingService) AddConnection(writer gin.ResponseWriter, ctx context.Context) (*Connection, error) {
	// 检查连接数限制
	currentCount := s.GetOnlineCount()
	if currentCount >= MaxConnections {
		return nil, fmt.Errorf("connection limit exceeded")
	}

	flusher, ok := writer.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("streaming unsupported")
	}

	// 创建连接
	connID := s.generateConnectionID()
	connCtx, cancel := context.WithCancel(ctx)

	conn := &Connection{
		ID:       connID,
		Writer:   writer,
		Flusher:  flusher,
		Channel:  make(chan []byte, 10),
		LastPing: time.Now(),
		Context:  connCtx,
		Cancel:   cancel,
	}

	// 设置SSE响应头
	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("Connection", "keep-alive")
	writer.Header().Set("Access-Control-Allow-Origin", "*")

	// 存储连接
	s.connections.Store(connID, conn)
	s.count.Add(1)

	// 立即发送当前在线人数
	s.sendToConnection(conn, WatchingMessage{
		Type:      "online_count",
		Count:     s.GetOnlineCount(),
		Timestamp: time.Now(),
	})

	return conn, nil
}

func (s *WatchingService) RemoveConnection(connID string) {
	if value, ok := s.connections.LoadAndDelete(connID); ok {
		if conn, ok := value.(*Connection); ok {
			s.removeConnection(conn)
			s.count.Add(-1)
		}
	}
}

func (s *WatchingService) removeConnection(conn *Connection) {
	if conn.Closed.CompareAndSwap(false, true) {
		conn.Cancel()
		close(conn.Channel)
	}
}

func (s *WatchingService) GetOnlineCount() int64 {
	return s.count.Load()
}

func (s *WatchingService) broadcastOnlineCount() {
	message := WatchingMessage{
		Type:      "online_count",
		Count:     s.GetOnlineCount(),
		Timestamp: time.Now(),
	}

	s.connections.Range(func(key, value interface{}) bool {
		if conn, ok := value.(*Connection); ok && !conn.Closed.Load() {
			s.sendToConnection(conn, message)
		}
		return true
	})
}

func (s *WatchingService) sendToConnection(conn *Connection, message WatchingMessage) {
	if conn.Closed.Load() {
		return
	}

	data, err := json.Marshal(message)
	if err != nil {
		return
	}

	select {
	case conn.Channel <- data:
		// 发送成功
	default:
		// 通道已满，移除连接
		s.RemoveConnection(conn.ID)
	}
}

func (s *WatchingService) cleanupStaleConnections() {
	now := time.Now()

	s.connections.Range(func(key, value interface{}) bool {
		if conn, ok := value.(*Connection); ok {
			if now.Sub(conn.LastPing) > ConnectionTimeout {
				s.RemoveConnection(conn.ID)
			}
		}
		return true
	})
}

func (s *WatchingService) UpdateConnectionPing(connID string) {
	if value, ok := s.connections.Load(connID); ok {
		if conn, ok := value.(*Connection); ok {
			conn.LastPing = time.Now()
		}
	}
}

func (s *WatchingService) generateConnectionID() string {
	return fmt.Sprintf("conn_%d_%d", time.Now().UnixNano(), s.count.Load())
}