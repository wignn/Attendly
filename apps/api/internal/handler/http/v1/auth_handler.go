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
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type GoogleLoginRequest struct {
	IDToken string `json:"id_token" validate:"required"`
}

type authTokenResponse struct {
	AccessToken  string              `json:"access_token"`
	RefreshToken string              `json:"refresh_token"`
	TokenType    string              `json:"token_type"`
	ExpiresIn    int64               `json:"expires_in"`
	User         currentUserResponse `json:"user"`
}

func toAuthTokenResponse(tokens *domain.AuthTokens) authTokenResponse {
	return authTokenResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    tokens.ExpiresIn,
		User: currentUserResponse{
			ID:          tokens.User.ID.String(),
			Email:       tokens.User.Email,
			Name:        tokens.User.Name,
			Roles:       tokens.User.RoleSet(),
			Permissions: permissionsForRoles(tokens.User.RoleSet()),
		},
	}
}

func writeAuthTokens(w http.ResponseWriter, status int, message string, tokens *domain.AuthTokens) {
	response.Success(w, status, message, toAuthTokenResponse(tokens))
}

func (h *AuthHandler) LoginWithGoogle(w http.ResponseWriter, r *http.Request) {
	var req GoogleLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
		return
	}
	if fieldErrors := validator.ValidateStruct(req); fieldErrors != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", fieldErrors)
		return
	}
	tokens, err := h.authService.LoginWithGoogle(r.Context(), req.IDToken)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Invalid Google identity token", nil)
		return
	}
	writeAuthTokens(w, http.StatusOK, "Login successful", tokens)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
		return
	}
	if fieldErrors := validator.ValidateStruct(req); fieldErrors != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", fieldErrors)
		return
	}
	if err := h.authService.Logout(r.Context(), req.RefreshToken); err != nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired refresh token", nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
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

	tokens, err := h.authService.Register(r.Context(), req.Name, req.Email, req.Password, domain.RoleTeacher)
	if err != nil {
		if errors.Is(err, domain.ErrConflict) {
			response.Error(w, http.StatusConflict, "USER_EXISTS", "Email already registered", nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not register user", nil)
		return
	}

	writeAuthTokens(w, http.StatusCreated, "User registered successfully", tokens)
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

	writeAuthTokens(w, http.StatusOK, "Login successful", tokens)
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
		return
	}
	if fieldErrors := validator.ValidateStruct(req); fieldErrors != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", fieldErrors)
		return
	}

	tokens, err := h.authService.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired refresh token", nil)
		return
	}
	writeAuthTokens(w, http.StatusOK, "Token refreshed successfully", tokens)
}
