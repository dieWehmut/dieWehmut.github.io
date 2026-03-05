package database

import (
	"sync"
	"time"
)

type cacheItem struct {
    value     []byte
    expiresAt time.Time
}

type MemoryCache struct {
    mu    sync.RWMutex
    items map[string]cacheItem
}

func NewMemoryCache() *MemoryCache {
    return &MemoryCache{items: make(map[string]cacheItem)}
}

func (c *MemoryCache) Get(key string) ([]byte, bool) {
    c.mu.RLock()
    item, ok := c.items[key]
    c.mu.RUnlock()
    if !ok {
        return nil, false
    }
    if !item.expiresAt.IsZero() && time.Now().After(item.expiresAt) {
        c.mu.Lock()
        delete(c.items, key)
        c.mu.Unlock()
        return nil, false
    }
    return item.value, true
}

func (c *MemoryCache) Set(key string, value []byte, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()

    item := cacheItem{value: value}
    if ttl > 0 {
        item.expiresAt = time.Now().Add(ttl)
    }
    c.items[key] = item
}

