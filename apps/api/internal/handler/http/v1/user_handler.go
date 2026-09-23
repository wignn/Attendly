package v1

import (
	"net/http"
	"strconv"

	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/response"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// GetMe godoc
// @Summary Get Current Authenticated User
// @Description Returns the profile of the current logged-in user
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} response.Envelope
// @Router /api/v1/users/me [get]
func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	if claims == nil {
		response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}

	user, err := h.userService.GetProfile(r.Context(), claims.UserID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "User profile not found", nil)
		return
	}

	response.Success(w, http.StatusOK, "Profile retrieved", user)
}

// ListUsers godoc
// @Summary List all users (Admin Only)
// @Description Paginated list of registered users
// @Tags Users
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param per_page query int false "Items per page" default(20)
// @Success 200 {object} response.Envelope
// @Router /api/v1/users [get]
func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))

	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 20
	}

	users, total, err := h.userService.ListUsers(r.Context(), int32(page), int32(perPage))
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not fetch users", nil)
		return
	}

	response.Paginated(w, http.StatusOK, "Users retrieved", users, page, perPage, total)
}
