package api

import (
	"encoding/json"
	"net/http"

	"tauchoportal/internal/models"
	"tauchoportal/internal/store"
)

// PreferencesAPI handles user preferences endpoints
type PreferencesAPI struct {
	prefStore store.PreferenceStore
}

// NewPreferencesAPI creates a new preferences API handler
func NewPreferencesAPI(prefStore store.PreferenceStore) *PreferencesAPI {
	return &PreferencesAPI{
		prefStore: prefStore,
	}
}

// GetPreferences handles GET /api/user/preferences
// Retrieves the authenticated user's saved preferences
func (api *PreferencesAPI) GetPreferences(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from session/context
	userID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	prefs, err := api.prefStore.GetPreferences(r.Context(), userID)
	if err != nil {
		// Return default preferences if not found (optional behavior)
		prefs = &models.UserPreferences{
			UserID:   userID,
			Language: "en",
			Theme:    "light",
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prefs)
}

// SavePreferences handles POST /api/user/preferences
// Saves or updates the authenticated user's preferences
func (api *PreferencesAPI) SavePreferences(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from session/context
	userID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Language string `json:"language"`
		Theme    string `json:"theme"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	prefs := &models.UserPreferences{
		UserID:   userID,
		Language: req.Language,
		Theme:    req.Theme,
	}

	if err := api.prefStore.SavePreferences(r.Context(), prefs); err != nil {
		http.Error(w, "failed to save preferences", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prefs)
}

// AuthAPI handles authentication endpoints
type AuthAPI struct {
}

// NewAuthAPI creates a new auth API handler
func NewAuthAPI() *AuthAPI {
	return &AuthAPI{}
}

// Logout handles POST /auth/logout
// Clears the user's session and logs them out
func (api *AuthAPI) Logout(w http.ResponseWriter, r *http.Request) {
	// Clear session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "logged out"})
}
