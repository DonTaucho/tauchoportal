package store

import (
	"context"

	"tauchoportal/internal/models"
)

// PreferenceStore handles persistence for user preferences
type PreferenceStore interface {
	// GetPreferences retrieves preferences for a user
	GetPreferences(ctx context.Context, userID int) (*models.UserPreferences, error)

	// SavePreferences creates or updates user preferences
	SavePreferences(ctx context.Context, prefs *models.UserPreferences) error

	// DeletePreferences removes user preferences
	DeletePreferences(ctx context.Context, userID int) error
}
