package v1

import (
	"net/http"
	"strconv"

	"github.com/wignn/komas-api/internal/domain"
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

type currentUserResponse struct {
	ID          string        `json:"id"`
	Email       string        `json:"email"`
	Name        string        `json:"name"`
	Roles       []domain.Role `json:"roles"`
	Permissions []string      `json:"permissions"`
}

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

	response.Success(w, http.StatusOK, "Profile retrieved", currentUserResponse{
		ID:          user.ID.String(),
		Email:       user.Email,
		Name:        user.Name,
		Roles:       user.RoleSet(),
		Permissions: permissionsForRoles(user.RoleSet()),
	})
}

func permissionsForRoles(roles []domain.Role) []string {
	permissions := make(map[string]struct{})
	for _, role := range roles {
		if role == domain.RoleSuperAdmin {
			return []string{"*"}
		}
		for _, permission := range permissionsForRole(role) {
			permissions[permission] = struct{}{}
		}
	}
	result := make([]string, 0, len(permissions))
	for _, permission := range []string{"attendance:read", "attendance:write", "students:read", "classes:read"} {
		if _, ok := permissions[permission]; ok {
			result = append(result, permission)
		}
	}
	return result
}

func permissionsForRole(role domain.Role) []string {
	switch role {
	case domain.RoleHomeroomTeacher:
		return []string{"attendance:read", "attendance:write", "students:read", "classes:read"}
	case domain.RoleTeacher:
		return []string{"attendance:read", "attendance:write"}
	default:
		return []string{}
	}
}

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
