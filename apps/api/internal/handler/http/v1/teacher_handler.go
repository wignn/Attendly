package v1

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/response"
)

type TeacherHandler struct {
	service *service.TeacherService
}

func NewTeacherHandler(svc *service.TeacherService) *TeacherHandler {
	return &TeacherHandler{service: svc}
}

func (h *TeacherHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page := int32(1)
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = int32(v)
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_PAGINATION", "Invalid page", nil)
			return
		}
	}
	perPage := int32(20)
	if pp := q.Get("per_page"); pp != "" {
		if v, err := strconv.Atoi(pp); err == nil && v > 0 {
			perPage = int32(v)
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_PAGINATION", "Invalid per_page", nil)
			return
		}
	}

	filter := domain.TeacherFilter{
		Search:  q.Get("q"),
		Status:  q.Get("status"),
		Page:    page,
		PerPage: perPage,
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	items, total, err := h.service.List(r.Context(), user, filter)
	if err != nil {
		writeTeacherError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Teachers retrieved", items, int(page), int(perPage), total)
}

func (h *TeacherHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "teacher_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid teacher ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.GetByID(r.Context(), user, id)
	if err != nil {
		writeTeacherError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Teacher retrieved", item)
}

func (h *TeacherHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in domain.TeacherCreateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Create(r.Context(), user, in)
	if err != nil {
		writeTeacherError(w, err)
		return
	}

	response.Success(w, http.StatusCreated, "Teacher created", item)
}

func (h *TeacherHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "teacher_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid teacher ID", nil)
		return
	}

	var in domain.TeacherUpdateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Update(r.Context(), user, id, in)
	if err != nil {
		writeTeacherError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Teacher updated", item)
}

func (h *TeacherHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "teacher_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid teacher ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	if err := h.service.Delete(r.Context(), user, id); err != nil {
		writeTeacherError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeTeacherError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Teacher not found", nil)
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Forbidden access", nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Teacher email or NIP already exists", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}
