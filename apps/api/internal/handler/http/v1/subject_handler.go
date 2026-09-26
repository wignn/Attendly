package v1

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/response"
)

type SubjectHandler struct {
	service *service.SubjectService
}

func NewSubjectHandler(svc *service.SubjectService) *SubjectHandler {
	return &SubjectHandler{service: svc}
}

func (h *SubjectHandler) List(w http.ResponseWriter, r *http.Request) {
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

	filter := domain.SubjectFilter{
		Search:  q.Get("q"),
		Page:    page,
		PerPage: perPage,
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	items, total, err := h.service.List(r.Context(), user, filter)
	if err != nil {
		writeSubjectError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Subjects retrieved", items, int(page), int(perPage), total)
}

func (h *SubjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid subject ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.GetByID(r.Context(), user, id)
	if err != nil {
		writeSubjectError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Subject retrieved", item)
}

func (h *SubjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in domain.SubjectCreateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Create(r.Context(), user, in)
	if err != nil {
		writeSubjectError(w, err)
		return
	}

	response.Success(w, http.StatusCreated, "Subject created", item)
}

func (h *SubjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid subject ID", nil)
		return
	}

	var in domain.SubjectUpdateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Update(r.Context(), user, id, in)
	if err != nil {
		writeSubjectError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Subject updated", item)
}

func (h *SubjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid subject ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	if err := h.service.Delete(r.Context(), user, id); err != nil {
		writeSubjectError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeSubjectError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Subject not found", nil)
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Forbidden access", nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Subject code or name already exists or is referenced", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}

func decodeJSON(r *http.Request, target any) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	dec := json.NewDecoder(bytes.NewReader(body))
	dec.DisallowUnknownFields()
	if err := dec.Decode(target); err != nil {
		return err
	}
	return nil
}
