package v1

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/response"
	"github.com/wignn/komas-api/pkg/validator"
)

type AuthHandler struct {
	authService domain.AuthService
}

func NewAuthHandler(authService domain.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"omitempty,oneof=ADMIN MEMBER USER"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}


func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
		return
	}

	if fieldErrors := validator.ValidateStruct(req); fieldErrors != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", fieldErrors)
		return
	}

	role := domain.RoleUser
	if req.Role != "" {
		role = domain.Role(req.Role)
	}

	tokens, err := h.authService.Register(r.Context(), req.Name, req.Email, req.Password, role)
	if err != nil {
		if errors.Is(err, domain.ErrConflict) {
			response.Error(w, http.StatusConflict, "USER_EXISTS", "Email already registered", nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not register user", nil)
		return
	}

	response.Success(w, http.StatusCreated, "User registered successfully", tokens)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
		return
	}

	if fieldErrors := validator.ValidateStruct(req); fieldErrors != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", fieldErrors)
		return
	}

	tokens, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid email or password", nil)
		return
	}

	response.Success(w, http.StatusOK, "Login successful", tokens)
}
