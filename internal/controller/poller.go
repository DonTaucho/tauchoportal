package controller

import (
	"net/http"
)

type Poller struct{}

type PollerStatusResponse struct {
	IsRunning bool   `json:"is_running"`
	Timestamp string `json:"timestamp"`
}

type StartPollerResponse struct {
	Status string `json:"status"`
}

type StopPollerResponse struct {
	Status string `json:"status"`
}

func (Poller) PollerStatus() PollerStatusResponse {
	var result PollerStatusResponse
	apiRequest(&result, http.MethodGet, "/poller/status")
	return result
}

func (Poller) StartPoller() StartPollerResponse {
	var result StartPollerResponse
	apiRequest(&result, http.MethodPost, "/poller/start")
	return result
}

func (Poller) StopPoller() StopPollerResponse {
	var result StopPollerResponse
	apiRequest(&result, http.MethodPost, "/poller/stop")
	return result
}
