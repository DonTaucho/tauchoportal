package controller

import (
	"net/http"
)

type BrandSettings struct{}

// ConnectedBrand represents a brand with connection status from the /auth/brands API
type ConnectedBrand struct {
	ID               string                `json:"id"`
	Name             string                `json:"name"`
	IsConnected      bool                  `json:"is_connected"`
	AuthType         *string               `json:"auth_type"`
	Status           *string               `json:"status"`
	ConnectedAt      *string               `json:"connected_at"`
	LastTestedAt     *string               `json:"last_tested_at"`
	LastUsedAt       *string               `json:"last_used_at"`
	ErrorMessage     *string               `json:"error_message"`
	OAuthScope       *string               `json:"oauth_scope"`
	CredentialFields []BrandCredentialField `json:"credential_fields"`
}

// BrandCredentialField represents a single credential input field for brand connection
type BrandCredentialField struct {
	Name     string `json:"name"`
	Label    string `json:"label"`
	Type     string `json:"type"`
	Required bool   `json:"required"`
	Help     string `json:"help"`
}

// BrandsListResponse wraps the API response for /auth/brands
type BrandsListResponse struct {
	Brands []ConnectedBrand `json:"brands"`
}

// ListBrands fetches all brands with connection status from API
func (BrandSettings) ListBrands() []ConnectedBrand {
	var response BrandsListResponse
	apiRequest(&response, http.MethodGet, "/auth/brands")
	return response.Brands
}

// GetBrandDetails fetches a specific brand with credential fields
func (BrandSettings) GetBrandDetails(brandID string) ConnectedBrand {
	var result ConnectedBrand
	apiRequest(&result, http.MethodGet, "/auth/brand/"+brandID)
	return result
}
