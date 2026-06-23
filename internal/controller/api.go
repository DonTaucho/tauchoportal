package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/cookiejar"
	"strings"
)

var baseUrl string
var loginUserId string
var httpClient *http.Client

type API struct {
	Health            Health
	Auth              Auth
	Watches           Watches
	StreamEvents      StreamEvents
	Conditions        Conditions
	Devices           Devices
	DeviceCredentials DeviceCredentials
	DeviceTemplates   DeviceTemplates
	DeviceGroups      DeviceGroups
	Streams           Streams
	Poller            Poller
	PlatformDiscovery PlatformDiscovery
	Catalog           Catalog
	CustomProducts    CustomProducts
	LiveEvents        LiveEvents
}

type Request interface {
}

func apiRequest(response any, method string, path string, request ...Request) {
	if strings.HasSuffix(baseUrl, "/") && strings.HasPrefix(path, "/") {
		path = path[1:]
	}
	if !strings.HasSuffix(baseUrl, "/") && !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	switch method {
	case http.MethodGet:
		req, err := http.NewRequest(http.MethodGet, baseUrl+path, nil)
		if err != nil {
			log.Fatal("Error:", err)
			return
		}

		req.Header.Set("X-User-ID", loginUserId)
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Println("Request failed:", err)
			return
		}
		defer resp.Body.Close()
		json.NewDecoder(resp.Body).Decode(response)
		return
	case http.MethodPost:
		jsonBytes, err := json.Marshal(request)
		if err != nil {
			log.Fatal("Error encoding JSON:", err)
			return
		}
		req, err := http.NewRequest(http.MethodPost, baseUrl+path, bytes.NewBuffer(jsonBytes))
		if err != nil {
			log.Fatal("Error:", err)
			return
		}

		req.Header.Set("X-User-ID", loginUserId)
		req.Header.Set("Content-Type", "application/json")
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Println("Request failed:", err)
			return
		}
		defer resp.Body.Close()
		json.NewDecoder(resp.Body).Decode(response)
		return
	case http.MethodPatch:
		jsonBytes, err := json.Marshal(request)
		if err != nil {
			log.Fatal("Error encoding JSON:", err)
			return
		}
		req, err := http.NewRequest(http.MethodPatch, baseUrl+path, bytes.NewBuffer(jsonBytes))
		if err != nil {
			log.Fatal("Error:", err)
			return
		}

		req.Header.Set("X-User-ID", loginUserId)
		req.Header.Set("Content-Type", "application/json")
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Println("Request failed:", err)
			return
		}
		defer resp.Body.Close()
		json.NewDecoder(resp.Body).Decode(response)
		return
	case http.MethodPut:
		jsonBytes, err := json.Marshal(request)
		if err != nil {
			log.Fatal("Error encoding JSON:", err)
			return
		}
		req, err := http.NewRequest(http.MethodPut, baseUrl+path, bytes.NewBuffer(jsonBytes))
		if err != nil {
			log.Fatal("Error:", err)
			return
		}

		req.Header.Set("X-User-ID", loginUserId)
		req.Header.Set("Content-Type", "application/json")
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Println("Request failed:", err)
			return
		}
		defer resp.Body.Close()
		json.NewDecoder(resp.Body).Decode(response)
		return
	case http.MethodDelete:
		req, err := http.NewRequest(http.MethodDelete, baseUrl+path, nil)
		if err != nil {
			log.Fatal("Error:", err)
			return
		}
		req.Header.Set("X-User-ID", loginUserId)
		resp, err := httpClient.Do(req)
		if err != nil {
			fmt.Println("Request failed:", err)
			return
		}
		defer resp.Body.Close()
		return
	}
	return
}

func Init(apiURL string, userId string) (API, error) {
	var api API
	baseUrl = apiURL
	loginUserId = userId
	
	// Create HTTP client with cookie jar for session persistence
	if httpClient == nil {
		jar, err := cookiejar.New(nil)
		if err != nil {
			log.Fatal("Failed to create cookie jar:", err)
		}
		httpClient = &http.Client{
			Jar: jar,
		}
	}
	
	return api, nil
}
