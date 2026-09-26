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

type TeachingAssignmentHandler struct {
	service *service.TeachingAssignmentService
}

func NewTeachingAssignmentHandler(svc *service.TeachingAssignmentService) *TeachingAssignmentHandler {
	return &TeachingAssignmentHandler{service: svc}
}

func assignmentID(w http.ResponseWriter, r *http.Request, param string) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, param))
	if err != nil || id == uuid.Nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid "+param, nil)
		return uuid.Nil, false
	}
	return id, true
}

func decodeAssignment(w http.ResponseWriter, r *http.Request, target any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(target); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_BODY", "Invalid request body", nil)
		return false
	}
	var trailing any
	if err := dec.Decode(&trailing); err != io.EOF {
		response.Error(w, http.StatusBadRequest, "INVALID_BODY", "Only one JSON object is allowed", nil)
		return false
	}
	return true
}

func assignmentFilter(w http.ResponseWriter, r *http.Request) (domain.TeachingAssignmentFilter, bool) {
	q := r.URL.Query()
	f := domain.TeachingAssignmentFilter{Page: 1, PerPage: 20}
	for _, part := range []struct {
		name string
		to   *uuid.UUID
	}{{"teacher_id", &f.TeacherID}, {"class_id", &f.ClassID}, {"subject_id", &f.SubjectID}, {"academic_year_id", &f.AcademicYearID}} {
		if raw := q.Get(part.name); raw != "" {
			id, err := uuid.Parse(raw)
			if err != nil || id == uuid.Nil {
				response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid "+part.name, nil)
				return f, false
			}
			*part.to = id
		}
	}
	if raw := q.Get("page"); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 32)
		if err != nil || value < 1 {
			response.Error(w, http.StatusBadRequest, "INVALID_PAGINATION", "page must be a positive integer", nil)
			return f, false
		}
		f.Page = int32(value)
	}
	if raw := q.Get("per_page"); raw != "" {
		value, err := strconv.ParseInt(raw, 10, 32)
		if err != nil || value < 1 || value > 100 {
			response.Error(w, http.StatusBadRequest, "INVALID_PAGINATION", "per_page must be between 1 and 100", nil)
			return f, false
		}
		f.PerPage = int32(value)
	}
	return f, true
}

func (h *TeachingAssignmentHandler) List(w http.ResponseWriter, r *http.Request) {
	f, ok := assignmentFilter(w, r)
	if !ok {
		return
	}
	items, total, err := h.service.List(r.Context(), middleware.GetAuthenticatedUser(r.Context()), f)
	if err != nil {
		writeAssignmentError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Teaching assignments retrieved", items, int(f.Page), int(f.PerPage), total)
}

func (h *TeachingAssignmentHandler) ListForTeacher(w http.ResponseWriter, r *http.Request) {
	id, ok := assignmentID(w, r, "teacher_id")
	if !ok {
		return
	}
	f, ok := assignmentFilter(w, r)
	if !ok {
		return
	}
	if f.TeacherID != uuid.Nil && f.TeacherID != id {
		response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "teacher_id conflicts with route", nil)
		return
	}
	f.TeacherID = id
	items, total, err := h.service.List(r.Context(), middleware.GetAuthenticatedUser(r.Context()), f)
	if err != nil {
		writeAssignmentError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Teacher assignments retrieved", items, int(f.Page), int(f.PerPage), total)
}

func (h *TeachingAssignmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.TeachingAssignmentInput
	if !decodeAssignment(w, r, &input) {
		return
	}
	item, err := h.service.Create(r.Context(), middleware.GetAuthenticatedUser(r.Context()), input)
	if err != nil {
		writeAssignmentError(w, err)
		return
	}
	response.Success(w, http.StatusCreated, "Teaching assignment created", item)
}

func (h *TeachingAssignmentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := assignmentID(w, r, "assignment_id")
	if !ok {
		return
	}
	item, err := h.service.Get(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id)
	if err != nil {
		writeAssignmentError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Teaching assignment retrieved", item)
}

type assignmentPatch struct {
	TeacherID      *uuid.UUID `json:"teacher_id"`
	ClassID        *uuid.UUID `json:"class_id"`
	SubjectID      *uuid.UUID `json:"subject_id"`
	AcademicYearID *uuid.UUID `json:"academic_year_id"`
}

func (h *TeachingAssignmentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := assignmentID(w, r, "assignment_id")
	if !ok {
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_BODY", "Invalid request body", nil)
		return
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(body, &fields); err != nil || len(fields) == 0 {
		response.Error(w, http.StatusBadRequest, "INVALID_BODY", "A nonempty JSON object is required", nil)
		return
	}
	for _, value := range fields {
		if bytes.Equal(bytes.TrimSpace(value), []byte("null")) {
			response.Error(w, http.StatusBadRequest, "INVALID_BODY", "Assignment fields cannot be null", nil)
			return
		}
	}
	r.Body = io.NopCloser(bytes.NewReader(body))
	var patch assignmentPatch
	if !decodeAssignment(w, r, &patch) {
		return
	}
	actor := middleware.GetAuthenticatedUser(r.Context())
	current, err := h.service.Get(r.Context(), actor, id)
	if err != nil {
		writeAssignmentError(w, err)
		return
	}
	input := domain.TeachingAssignmentInput{TeacherID: current.TeacherID, ClassID: current.ClassID, SubjectID: current.SubjectID, AcademicYearID: current.AcademicYearID}
	if patch.TeacherID != nil {
		input.TeacherID = *patch.TeacherID
	}
	if patch.ClassID != nil {
		input.ClassID = *patch.ClassID
	}
	if patch.SubjectID != nil {
		input.SubjectID = *patch.SubjectID
	}
	if patch.AcademicYearID != nil {
		input.AcademicYearID = *patch.AcademicYearID
	}
	item, err := h.service.Update(r.Context(), actor, id, input)
	if err != nil {
		writeAssignmentError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Teaching assignment updated", item)
}

func (h *TeachingAssignmentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := assignmentID(w, r, "assignment_id")
	if !ok {
		return
	}
	if err := h.service.Delete(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id); err != nil {
		writeAssignmentError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeAssignmentError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to access this assignment", nil)
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Teaching assignment not found", nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Teaching assignment conflicts with existing data or history", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "Assignment references must identify an active teacher, class, subject, and valid academic year", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not process teaching assignment", nil)
	}
}
