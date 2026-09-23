package v1

import (
	"net/http"

	"github.com/wignn/komas-api/pkg/response"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}


func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	response.Success(w, http.StatusOK, "Service is healthy", map[string]string{
		"status": "UP",
	})
}
