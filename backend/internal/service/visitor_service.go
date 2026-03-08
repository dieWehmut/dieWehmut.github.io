package service

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type visitorSnapshot struct {
	Count     uint64    `json:"count"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type VisitorService struct {
	mu       sync.Mutex
	filePath string
	count    uint64
}

func NewVisitorService(filePath string) (*VisitorService, error) {
	service := &VisitorService{filePath: filePath}
	if err := service.load(); err != nil {
		return nil, err
	}
	return service, nil
}

func (s *VisitorService) Count() uint64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.count
}

func (s *VisitorService) Increment() (uint64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.count++
	if err := s.persistLocked(); err != nil {
		s.count--
		return s.count, err
	}

	return s.count, nil
}

func (s *VisitorService) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.filePath == "" {
		return nil
	}

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			s.count = 0
			return nil
		}
		return err
	}

	var snapshot visitorSnapshot
	if err := json.Unmarshal(data, &snapshot); err != nil {
		return err
	}

	s.count = snapshot.Count
	return nil
}

func (s *VisitorService) persistLocked() error {
	if s.filePath == "" {
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(s.filePath), 0o755); err != nil {
		return err
	}

	payload, err := json.Marshal(visitorSnapshot{
		Count:     s.count,
		UpdatedAt: time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	tempPath := s.filePath + ".tmp"
	if err := os.WriteFile(tempPath, payload, 0o644); err != nil {
		return err
	}

	return os.Rename(tempPath, s.filePath)
}
