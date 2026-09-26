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

type ClassHandler struct {
	service *service.ClassService
}

func NewClassHandler(svc *service.ClassService) *ClassHandler {
	return &ClassHandler{service: svc}
}

func (h *ClassHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter domain.ClassFilter

	if s := q.Get("academic_year_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.AcademicYearID = id
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid academic_year_id", nil)
			return
		}
	}
	if s := q.Get("homeroom_teacher_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.HomeroomTeacherID = id
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid homeroom_teacher_id", nil)
			return
		}
	}

	filter.Search = q.Get("q")
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
		writeClassError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Classes retrieved", items, int(page), int(perPage), total)
}

func (h *ClassHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.GetByID(r.Context(), user, id)
	if err != nil {
		writeClassError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Class retrieved", item)
}

func (h *ClassHandler) Create(w http.ResponseWriter, r *http.Request) {
	var in domain.ClassCreateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Create(r.Context(), user, in)
	if err != nil {
		writeClassError(w, err)
		return
	}

	response.Success(w, http.StatusCreated, "Class created", item)
}

func (h *ClassHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}

	var in domain.ClassUpdateInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.Update(r.Context(), user, id, in)
	if err != nil {
		writeClassError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Class updated", item)
}

func (h *ClassHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	if err := h.service.Delete(r.Context(), user, id); err != nil {
		writeClassError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ClassHandler) ListStudents(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}

	q := r.URL.Query()
	page := int32(1)
	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = int32(v)
		}
	}
	perPage := int32(20)
	if pp := q.Get("per_page"); pp != "" {
		if v, err := strconv.Atoi(pp); err == nil && v > 0 {
			perPage = int32(v)
		}
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	students, total, err := h.service.ListStudents(r.Context(), user, id, page, perPage)
	if err != nil {
		writeClassError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Class students retrieved", students, int(page), int(perPage), total)
}

func (h *ClassHandler) AddStudent(w http.ResponseWriter, r *http.Request) {
	classID, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}

	var in domain.AddStudentToClassInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	if err := h.service.AddStudent(r.Context(), user, classID, in); err != nil {
		writeClassError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Student added to class", nil)
}

func (h *ClassHandler) RemoveStudent(w http.ResponseWriter, r *http.Request) {
	classID, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}
	studentID, err := uuid.Parse(chi.URLParam(r, "student_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid student ID", nil)
		return
	}

	effectiveDate := r.URL.Query().Get("effective_date")

	user := middleware.GetAuthenticatedUser(r.Context())
	if err := h.service.RemoveStudent(r.Context(), user, classID, studentID, effectiveDate); err != nil {
		writeClassError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func writeClassError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Class or student not found", nil)
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Forbidden access", nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Class code/name conflict or has references", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}
