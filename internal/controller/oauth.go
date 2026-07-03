package controller

import (
	"net/http"
	"net/url"
)

type OAuth struct{}

type GetOAuthLoginURLResponse struct {
	AuthURL string `json:"auth_url"`
}

type OAuthCallbackResponse struct {
}

type MetaDataDeletionCallbackResponse struct {
	Url              string `json:"url"`
	ConfirmationCode string `json:"confirmation_code"`
}

func (OAuth) GetOAuthLoginURL(provider string) GetOAuthLoginURLResponse {
	var result GetOAuthLoginURLResponse
	apiRequest(&result, http.MethodGet, "/oauth/login?provider="+url.QueryEscape(provider))
	return result
}

func (OAuth) GoogleOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/google?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) TwitchOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/twitch?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) InstagramOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/instagram?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) FacebookOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/facebook?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) KickOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/kick?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) TikTokOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/tiktok?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) XOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/x?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) BilibiliOAuthCallback(code string, state string) OAuthCallbackResponse {
	var result OAuthCallbackResponse
	apiRequest(&result, http.MethodGet, "/auth/callback/bilibili?code="+url.QueryEscape(code)+"&state="+url.QueryEscape(state))
	return result
}

func (OAuth) MetaDataDeletionCallback() MetaDataDeletionCallbackResponse {
	var result MetaDataDeletionCallbackResponse
	apiRequest(&result, http.MethodPost, "/auth/data-deletion")
	return result
}
