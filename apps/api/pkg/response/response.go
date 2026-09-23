package response

import (
	"encoding/json"
	"net/http"

	"github.com/wignn/komas-api/internal/domain"
)

type Envelope struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    any             `json:"data,omitempty"`
	Meta    *PaginationMeta `json:"meta,omitempty"`
	Error   *ErrorDetails   `json:"error,omitempty"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type ErrorDetails struct {
	Code    string              `json:"code"`
	Message string              `json:"message"`
	Details []domain.FieldError `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func Success(w http.ResponseWriter, status int, message string, data any) {
	JSON(w, status, Envelope{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Paginated(w http.ResponseWriter, status int, message string, data any, page, perPage int, total int64) {
	totalPages := 0
	if perPage > 0 {
		totalPages = int(total) / perPage
		if int(total)%perPage != 0 {
			totalPages++
		}
	}
	JSON(w, status, Envelope{
		Success: true,
		Message: message,
		Data:    data,
		Meta: &PaginationMeta{
			Page:       page,
			PerPage:    perPage,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

func Error(w http.ResponseWriter, status int, code, message string, details []domain.FieldError) {
	JSON(w, status, Envelope{
		Success: false,
		Message: message,
		Error: &ErrorDetails{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}
