package models

import "time"

// UserPreferences represents user UI/view settings
type UserPreferences struct {
	UserID    int       `json:"user_id"`
	Language  string    `json:"language"`   // e.g., "en", "ja"
	Theme     string    `json:"theme"`      // e.g., "light", "dark"
	UpdatedAt time.Time `json:"updated_at"`
}
