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
	apiRequest(&result, http.MethodGet, "health")
	return result
}
func (Health) ServiceStatus() {

}
func (Health) Environment() {

}
