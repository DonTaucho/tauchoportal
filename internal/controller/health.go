package controller

import (
	"net/http"
)

type Health struct {
}

type HealthCheckResponse struct {
	Status string `json:"status"`
}

func (Health) HealthCheck() HealthCheckResponse {
	var result HealthCheckResponse
	apiRequest(&result, http.MethodGet, "/health")
	return result
}

type ServiceStatusResponse struct {
	Error string `json:"error"`
}

func (Health) ServiceStatus() ServiceStatusResponse {
	var result ServiceStatusResponse
	apiRequest(&result, http.MethodGet, "/version")
	return result
}

type EnvironmentResponse struct {
	Error string `json:"error"`
}

func (Health) Environment() EnvironmentResponse {
	var result EnvironmentResponse
	apiRequest(&result, http.MethodGet, "/debug/env")
	return result
}
