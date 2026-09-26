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

type AcademicYearHandler struct {
	service *service.AcademicYearService
}

func NewAcademicYearHandler(svc *service.AcademicYearService) *AcademicYearHandler {
	return &AcademicYearHandler{service: svc}
}

func (h *AcademicYearHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter domain.AcademicYearFilter

	if s := q.Get("active"); s != "" {
		if b, err := strconv.ParseBool(s); err == nil {
			filter.Active = &b
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid active filter", nil)
			return
		}
	}

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
	filter.Page = page
	filter.PerPage = perPage

	user := middleware.GetAuthenticatedUser(r.Context())
	items, total, err := h.service.List(r.Context(), user, filter)
	if err != nil {
		writeAcademicYearError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Academic years retrieved", items, int(page), int(perPage), total)
}

func (h *AcademicYearHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid academic year ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.GetByID(r.Context(), user, id)
	if err != nil {
		writeAcademicYearError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Academic year retrieved", item)
}

func (h *AcademicYearHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in domain.AcademicYearCreateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Create(r.Context(), user, in)
	if err != nil {
		writeAcademicYearError(w, err)
		return
	}

	response.Success(w, http.StatusCreated, "Academic year created", item)
}

func (h *AcademicYearHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid academic year ID", nil)
		return
	}

	var in domain.AcademicYearUpdateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Update(r.Context(), user, id, in)
	if err != nil {
		writeAcademicYearError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Academic year updated", item)
}

func (h *AcademicYearHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid academic year ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	if err := h.service.Delete(r.Context(), user, id); err != nil {
		writeAcademicYearError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AcademicYearHandler) Activate(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid academic year ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Activate(r.Context(), user, id)
	if err != nil {
		writeAcademicYearError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Academic year activated", item)
}

func writeAcademicYearError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Academic year not found", nil)
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Forbidden access", nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Academic year conflicts with existing year or active constraints", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}
