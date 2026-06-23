package controller

import (
	"net/http"
	"net/url"
)

type Watches struct{}

type WatchStreamFilter struct {
	RequireTitleContains      []string `json:"require_title_contains"`
	SkipIfTitleContains       []string `json:"skip_if_title_contains"`
	SkipIfDescriptionContains []string `json:"skip_if_description_contains"`
}

type Watch struct {
	Id           string            `json:"id"`
	UserId       int               `json:"user_id"`
	Name         string            `json:"name"`
	Platform     string            `json:"platform"`
	ChannelId    string            `json:"channel_id"`
	IsActive     bool              `json:"is_active"`
	Status       string            `json:"status"`
	StreamFilter WatchStreamFilter `json:"stream_filter"`
	ThumbnailUrl string            `json:"thumbnail_url"`
	LastStreamAt string            `json:"last_stream_at"`
	CreatedAt    string            `json:"created_at"`
	UpdatedAt    string            `json:"updated_at"`
}

type ListWatchesResponse []Watch
type GetWatchResponse = Watch
type CreateWatchResponse = Watch
type UpdateWatchResponse = Watch

type CreateWatchRequest struct {
	Name         string            `json:"name"`
	Platform     string            `json:"platform"`
	ChannelId    string            `json:"channel_id"`
	IsActive     bool              `json:"is_active"`
	StreamFilter WatchStreamFilter `json:"stream_filter"`
	ThumbnailUrl string            `json:"thumbnail_url"`
}

type UpdateWatchRequest struct {
	Name           string            `json:"name"`
	IsActive       bool              `json:"is_active"`
	ClearFilter    bool              `json:"clear_filter"`
	StreamFilter   WatchStreamFilter `json:"stream_filter"`
	ThumbnailUrl   string            `json:"thumbnail_url"`
	ClearThumbnail bool              `json:"clear_thumbnail"`
}

type DeleteWatchResponse struct {
	Status string `json:"status"`
}

func (Watches) ListWatches() ListWatchesResponse {
	var result ListWatchesResponse
	apiRequest(&result, http.MethodGet, "/watches")
	return result
}

func (Watches) GetWatch(id string) GetWatchResponse {
	var result GetWatchResponse
	apiRequest(&result, http.MethodGet, "/watches/get?id="+url.QueryEscape(id))
	return result
}

func (Watches) CreateWatch(request CreateWatchRequest) CreateWatchResponse {
	var result CreateWatchResponse
	apiRequest(&result, http.MethodPost, "/watches", request)
	return result
}

func (Watches) UpdateWatch(id string, request UpdateWatchRequest) UpdateWatchResponse {
	var result UpdateWatchResponse
	apiRequest(&result, http.MethodPatch, "/watches/update?id="+url.QueryEscape(id), request)
	return result
}

func (Watches) DeleteWatch(id string) DeleteWatchResponse {
	var result DeleteWatchResponse
	apiRequest(&result, http.MethodDelete, "/watches?id="+url.QueryEscape(id))
	return result
}
