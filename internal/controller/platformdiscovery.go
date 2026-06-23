package controller

import (
	"net/http"
	"net/url"
)

type PlatformDiscovery struct{}

type YouTubeChannel struct {
	ChannelId       string `json:"channel_id"`
	Title           string `json:"title"`
	Thumbnail       string `json:"thumbnail"`
	SubscriberCount int    `json:"subscriber_count"`
}

type YouTubeChannelsPage struct {
	Items         []YouTubeChannel `json:"items"`
	NextPageToken string           `json:"next_page_token"`
}

type TwitchChannel struct {
	ChannelId     string `json:"channel_id"`
	DisplayName   string `json:"display_name"`
	Thumbnail     string `json:"thumbnail"`
	FollowerCount int    `json:"follower_count"`
	IsLive        bool   `json:"is_live"`
}

type TwitchChannelsPage struct {
	Items  []TwitchChannel `json:"items"`
	Cursor string          `json:"cursor"`
}

type InstagramUser struct {
	UserId        string `json:"user_id"`
	Username      string `json:"username"`
	DisplayName   string `json:"display_name"`
	Thumbnail     string `json:"thumbnail"`
	FollowerCount int    `json:"follower_count"`
}

type InstagramUsersPage struct {
	Items []InstagramUser `json:"items"`
}

type FacebookPage struct {
	PageId    string `json:"page_id"`
	Name      string `json:"name"`
	Thumbnail string `json:"thumbnail"`
}

type FacebookPagesResponse struct {
	Items []FacebookPage `json:"items"`
}

type TikTokUser struct {
	UserId    string `json:"user_id"`
	Username  string `json:"username"`
	Nickname  string `json:"nickname"`
	Thumbnail string `json:"thumbnail"`
}

type TikTokUsersPage struct {
	Items []TikTokUser `json:"items"`
}

type XUser struct {
	UserId    string `json:"user_id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	Thumbnail string `json:"thumbnail"`
}

type XUsersPage struct {
	Items []XUser `json:"items"`
}

type KickChannel struct {
	ChannelId     string `json:"channel_id"`
	DisplayName   string `json:"display_name"`
	Thumbnail     string `json:"thumbnail"`
	FollowerCount int    `json:"follower_count"`
	IsLive        bool   `json:"is_live"`
}

type KickChannelsPage struct {
	Items  []KickChannel `json:"items"`
	Cursor string        `json:"cursor"`
}

type KickSearchResponse struct {
	Items []KickChannel `json:"items"`
}

type NicoNicoChannel struct {
	ChannelId     string `json:"channel_id"`
	Title         string `json:"title"`
	Thumbnail     string `json:"thumbnail"`
	FollowerCount int    `json:"follower_count"`
}

type NicoNicoSearchChannel struct {
	ChannelId    string `json:"channel_id"`
	Title        string `json:"title"`
	Thumbnail    string `json:"thumbnail"`
	IsLive       bool   `json:"is_live"`
	ViewerCount  int    `json:"viewer_count"`
	ProviderType string `json:"provider_type"`
}

type BilibiliErrorResponse struct {
	Error string `json:"error"`
}

type BilibiliUser struct {
	ChannelId     string `json:"channel_id"`
	Title         string `json:"title"`
	Thumbnail     string `json:"thumbnail"`
	FollowerCount int    `json:"follower_count"`
}

type BilibiliUsersPage struct {
	Items []BilibiliUser `json:"items"`
}

func (PlatformDiscovery) ListMyYouTubeChannels() []YouTubeChannel {
	var result []YouTubeChannel
	apiRequest(&result, http.MethodGet, "/platform/youtube/channels/mine")
	return result
}

func (PlatformDiscovery) ListYouTubeSubscriptions(pageToken string) YouTubeChannelsPage {
	path := "/platform/youtube/subscriptions"
	if pageToken != "" {
		path += "?page_token=" + url.QueryEscape(pageToken)
	}

	var result YouTubeChannelsPage
	apiRequest(&result, http.MethodGet, path)
	return result
}

func (PlatformDiscovery) SearchYouTubeChannels(query string, pageToken string) YouTubeChannelsPage {
	path := "/platform/youtube/search?q=" + url.QueryEscape(query)
	if pageToken != "" {
		path += "&page_token=" + url.QueryEscape(pageToken)
	}

	var result YouTubeChannelsPage
	apiRequest(&result, http.MethodGet, path)
	return result
}

func (PlatformDiscovery) ListMyTwitchChannels() []TwitchChannel {
	var result []TwitchChannel
	apiRequest(&result, http.MethodGet, "/platform/twitch/channels/mine")
	return result
}

func (PlatformDiscovery) ListTwitchFollowing(cursor string) TwitchChannelsPage {
	path := "/platform/twitch/following"
	if cursor != "" {
		path += "?cursor=" + url.QueryEscape(cursor)
	}

	var result TwitchChannelsPage
	apiRequest(&result, http.MethodGet, path)
	return result
}

func (PlatformDiscovery) SearchTwitchChannels(query string, cursor string) TwitchChannelsPage {
	path := "/platform/twitch/search?q=" + url.QueryEscape(query)
	if cursor != "" {
		path += "&cursor=" + url.QueryEscape(cursor)
	}

	var result TwitchChannelsPage
	apiRequest(&result, http.MethodGet, path)
	return result
}

func (PlatformDiscovery) ListMyInstagramAccounts() []InstagramUser {
	var result []InstagramUser
	apiRequest(&result, http.MethodGet, "/platform/instagram/user/mine")
	return result
}

func (PlatformDiscovery) SearchInstagramUsers(query string) InstagramUsersPage {
	var result InstagramUsersPage
	apiRequest(&result, http.MethodGet, "/platform/instagram/search?q="+url.QueryEscape(query))
	return result
}

func (PlatformDiscovery) ListMyFacebookPages() []FacebookPage {
	var result []FacebookPage
	apiRequest(&result, http.MethodGet, "/platform/facebook/page/mine")
	return result
}

func (PlatformDiscovery) SearchFacebookPages(query string) FacebookPagesResponse {
	var result FacebookPagesResponse
	apiRequest(&result, http.MethodGet, "/platform/facebook/search?q="+url.QueryEscape(query))
	return result
}

func (PlatformDiscovery) ListMyTikTokAccounts() []TikTokUser {
	var result []TikTokUser
	apiRequest(&result, http.MethodGet, "/platform/tiktok/user/mine")
	return result
}

func (PlatformDiscovery) SearchTikTokUsers(query string) TikTokUsersPage {
	var result TikTokUsersPage
	apiRequest(&result, http.MethodGet, "/platform/tiktok/search?q="+url.QueryEscape(query))
	return result
}

func (PlatformDiscovery) ListMyXAccounts() []XUser {
	var result []XUser
	apiRequest(&result, http.MethodGet, "/platform/x/user/mine")
	return result
}

func (PlatformDiscovery) SearchXUsers(query string) XUsersPage {
	var result XUsersPage
	apiRequest(&result, http.MethodGet, "/platform/x/search?q="+url.QueryEscape(query))
	return result
}

func (PlatformDiscovery) ListMyKickChannels() []KickChannel {
	var result []KickChannel
	apiRequest(&result, http.MethodGet, "/platform/kick/channels/mine")
	return result
}

func (PlatformDiscovery) ListKickFollowing(cursor string) KickChannelsPage {
	path := "/platform/kick/following"
	if cursor != "" {
		path += "?cursor=" + url.QueryEscape(cursor)
	}

	var result KickChannelsPage
	apiRequest(&result, http.MethodGet, path)
	return result
}

func (PlatformDiscovery) SearchKickChannels(query string) KickSearchResponse {
	var result KickSearchResponse
	apiRequest(&result, http.MethodGet, "/platform/kick/search?q="+url.QueryEscape(query))
	return result
}

func (PlatformDiscovery) ListMyNicoNicoChannels() []NicoNicoChannel {
	var result []NicoNicoChannel
	apiRequest(&result, http.MethodGet, "/platform/niconico/channels/mine")
	return result
}

func (PlatformDiscovery) SearchNicoNicoChannels(query string) []NicoNicoSearchChannel {
	var result []NicoNicoSearchChannel
	apiRequest(&result, http.MethodGet, "/platform/niconico/search?q="+url.QueryEscape(query))
	return result
}

func (PlatformDiscovery) GetMyBilibiliSpace() BilibiliErrorResponse {
	var result BilibiliErrorResponse
	apiRequest(&result, http.MethodGet, "/platform/bilibili/user/mine")
	return result
}

func (PlatformDiscovery) ListBilibiliFollowing(cursor string) BilibiliErrorResponse {
	path := "/platform/bilibili/following"
	if cursor != "" {
		path += "?cursor=" + url.QueryEscape(cursor)
	}

	var result BilibiliErrorResponse
	apiRequest(&result, http.MethodGet, path)
	return result
}

func (PlatformDiscovery) SearchBilibiliUsers(query string) BilibiliUsersPage {
	var result BilibiliUsersPage
	apiRequest(&result, http.MethodGet, "/platform/bilibili/search?q="+url.QueryEscape(query))
	return result
}
