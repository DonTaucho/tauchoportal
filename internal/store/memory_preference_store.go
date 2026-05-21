package store

import (
	"context"
	"errors"
	"sync"
	"time"

	"tauchoportal/internal/models"
)

// MemoryPreferenceStore is an in-memory implementation of PreferenceStore
type MemoryPreferenceStore struct {
	mu          sync.RWMutex
	preferences map[int]*models.UserPreferences
}

// NewMemoryPreferenceStore creates a new in-memory preference store
func NewMemoryPreferenceStore() *MemoryPreferenceStore {
	return &MemoryPreferenceStore{
		preferences: make(map[int]*models.UserPreferences),
	}
}

// GetPreferences retrieves preferences for a user
func (s *MemoryPreferenceStore) GetPreferences(ctx context.Context, userID int) (*models.UserPreferences, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	prefs, exists := s.preferences[userID]
	if !exists {
		return nil, errors.New("preferences not found")
	}

	// Return a copy to prevent external modifications
	copy := *prefs
	return &copy, nil
}

// SavePreferences creates or updates user preferences
func (s *MemoryPreferenceStore) SavePreferences(ctx context.Context, prefs *models.UserPreferences) error {
	if prefs == nil {
		return errors.New("preferences cannot be nil")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	prefs.UpdatedAt = time.Now()
	copy := *prefs
	s.preferences[prefs.UserID] = &copy
	return nil
}

// DeletePreferences removes user preferences
func (s *MemoryPreferenceStore) DeletePreferences(ctx context.Context, userID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.preferences, userID)
	return nil
}
