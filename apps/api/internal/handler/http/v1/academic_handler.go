package v1

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/response"
	"github.com/wignn/komas-api/pkg/validator"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AcademicHandler struct {
	svc *service.AcademicService
}

func NewAcademicHandler(svc *service.AcademicService) *AcademicHandler {
	return &AcademicHandler{svc: svc}
}


func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
		return false
	}
	if fieldErrors := validator.ValidateStruct(dst); fieldErrors != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", fieldErrors)
		return false
	}
	return true
}

func parseIDParam(w http.ResponseWriter, r *http.Request, name string) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, name))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid "+name, nil)
		return uuid.Nil, false
	}
	return id, true
}

func pageParams(r *http.Request) (int32, int32) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 20
	}
	return int32(page), int32(perPage)
}

func mapDomainError(w http.ResponseWriter, err error, notFoundMsg string) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", notFoundMsg, nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Resource already exists", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Something went wrong", nil)
	}
}

type CreateClassRequest struct {
	Name              string  `json:"name" validate:"required,min=1"`
	GradeLevel        string  `json:"grade_level" validate:"omitempty"`
	AcademicYear      string  `json:"academic_year" validate:"omitempty"`
	HomeroomTeacherID *string `json:"homeroom_teacher_id" validate:"omitempty,uuid4"`
}

func (h *AcademicHandler) CreateClass(w http.ResponseWriter, r *http.Request) {
	var req CreateClassRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	teacherID, err := optionalUUID(req.HomeroomTeacherID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid homeroom_teacher_id", nil)
		return
	}
	class, err := h.svc.CreateClass(r.Context(), req.Name, req.GradeLevel, req.AcademicYear, teacherID)
	if err != nil {
		mapDomainError(w, err, "Class not found")
		return
	}
	response.Success(w, http.StatusCreated, "Class created", class)
}

func (h *AcademicHandler) ListClasses(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	classes, total, err := h.svc.ListClasses(r.Context(), page, perPage)
	if err != nil {
		mapDomainError(w, err, "")
		return
	}
	response.Paginated(w, http.StatusOK, "Classes retrieved", classes, int(page), int(perPage), total)
}

func (h *AcademicHandler) GetClass(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "classID")
	if !ok {
		return
	}
	class, err := h.svc.GetClass(r.Context(), id)
	if err != nil {
		mapDomainError(w, err, "Class not found")
		return
	}
	response.Success(w, http.StatusOK, "Class retrieved", class)
}

func (h *AcademicHandler) DeleteClass(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "classID")
	if !ok {
		return
	}
	if err := h.svc.DeleteClass(r.Context(), id); err != nil {
		mapDomainError(w, err, "Class not found")
		return
	}
	response.Success(w, http.StatusOK, "Class deleted", nil)
}

// ============================================================================
// Subjects
// ============================================================================

type CreateSubjectRequest struct {
	Code string `json:"code" validate:"required,min=1"`
	Name string `json:"name" validate:"required,min=1"`
}

func (h *AcademicHandler) CreateSubject(w http.ResponseWriter, r *http.Request) {
	var req CreateSubjectRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	subject, err := h.svc.CreateSubject(r.Context(), req.Code, req.Name)
	if err != nil {
		mapDomainError(w, err, "Subject not found")
		return
	}
	response.Success(w, http.StatusCreated, "Subject created", subject)
}

func (h *AcademicHandler) ListSubjects(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	subjects, total, err := h.svc.ListSubjects(r.Context(), page, perPage)
	if err != nil {
		mapDomainError(w, err, "")
		return
	}
	response.Paginated(w, http.StatusOK, "Subjects retrieved", subjects, int(page), int(perPage), total)
}

func (h *AcademicHandler) DeleteSubject(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "subjectID")
	if !ok {
		return
	}
	if err := h.svc.DeleteSubject(r.Context(), id); err != nil {
		mapDomainError(w, err, "Subject not found")
		return
	}
	response.Success(w, http.StatusOK, "Subject deleted", nil)
}

// ============================================================================
// Students
// ============================================================================

type CreateStudentRequest struct {
	NIS      string  `json:"nis" validate:"required,min=1"`
	FullName string  `json:"full_name" validate:"required,min=1"`
	ClassID  *string `json:"class_id" validate:"omitempty,uuid4"`
	UserID   *string `json:"user_id" validate:"omitempty,uuid4"`
}

func (h *AcademicHandler) CreateStudent(w http.ResponseWriter, r *http.Request) {
	var req CreateStudentRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	classID, err := optionalUUID(req.ClassID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class_id", nil)
		return
	}
	userID, err := optionalUUID(req.UserID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid user_id", nil)
		return
	}
	student, err := h.svc.CreateStudent(r.Context(), req.NIS, req.FullName, classID, userID)
	if err != nil {
		mapDomainError(w, err, "Student not found")
		return
	}
	response.Success(w, http.StatusCreated, "Student created", student)
}

func (h *AcademicHandler) ListStudents(w http.ResponseWriter, r *http.Request) {
	// Optional filter: ?class_id=<uuid> returns the full roster of one class.
	if raw := r.URL.Query().Get("class_id"); raw != "" {
		classID, err := uuid.Parse(raw)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class_id", nil)
			return
		}
		students, err := h.svc.ListStudentsByClass(r.Context(), classID)
		if err != nil {
			mapDomainError(w, err, "")
			return
		}
		response.Success(w, http.StatusOK, "Students retrieved", students)
		return
	}

	page, perPage := pageParams(r)
	students, total, err := h.svc.ListStudents(r.Context(), page, perPage)
	if err != nil {
		mapDomainError(w, err, "")
		return
	}
	response.Paginated(w, http.StatusOK, "Students retrieved", students, int(page), int(perPage), total)
}

func (h *AcademicHandler) DeleteStudent(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "studentID")
	if !ok {
		return
	}
	if err := h.svc.DeleteStudent(r.Context(), id); err != nil {
		mapDomainError(w, err, "Student not found")
		return
	}
	response.Success(w, http.StatusOK, "Student deleted", nil)
}

// ============================================================================
// ClassSubjects (pengampuan)
// ============================================================================

type AssignSubjectRequest struct {
	ClassID   string  `json:"class_id" validate:"required,uuid4"`
	SubjectID string  `json:"subject_id" validate:"required,uuid4"`
	TeacherID *string `json:"teacher_id" validate:"omitempty,uuid4"`
}

func (h *AcademicHandler) AssignSubject(w http.ResponseWriter, r *http.Request) {
	var req AssignSubjectRequest
	if !decodeJSON(w, r, &req) {
		return
	}
	classID, _ := uuid.Parse(req.ClassID)
	subjectID, _ := uuid.Parse(req.SubjectID)
	teacherID, err := optionalUUID(req.TeacherID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid teacher_id", nil)
		return
	}
	cs, err := h.svc.AssignSubjectToClass(r.Context(), classID, subjectID, teacherID)
	if err != nil {
		mapDomainError(w, err, "Class or subject not found")
		return
	}
	response.Success(w, http.StatusCreated, "Subject assigned to class", cs)
}

func (h *AcademicHandler) ListClassSubjects(w http.ResponseWriter, r *http.Request) {
	if raw := r.URL.Query().Get("teacher_id"); raw != "" {
		teacherID, err := uuid.Parse(raw)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid teacher_id", nil)
			return
		}
		list, err := h.svc.ListClassSubjectsByTeacher(r.Context(), teacherID)
		if err != nil {
			mapDomainError(w, err, "")
			return
		}
		response.Success(w, http.StatusOK, "Class subjects retrieved", list)
		return
	}

	// Otherwise a classID path param is required (e.g. /classes/{classID}/subjects).
	raw := chi.URLParam(r, "classID")
	if raw == "" {
		response.Error(w, http.StatusBadRequest, "MISSING_FILTER",
			"Provide a classID in the path or a teacher_id query parameter", nil)
		return
	}
	classID, err := uuid.Parse(raw)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid classID", nil)
		return
	}
	list, err := h.svc.ListClassSubjectsByClass(r.Context(), classID)
	if err != nil {
		mapDomainError(w, err, "")
		return
	}
	response.Success(w, http.StatusOK, "Class subjects retrieved", list)
}

func (h *AcademicHandler) UnassignSubject(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "classSubjectID")
	if !ok {
		return
	}
	if err := h.svc.UnassignSubjectFromClass(r.Context(), id); err != nil {
		mapDomainError(w, err, "Assignment not found")
		return
	}
	response.Success(w, http.StatusOK, "Subject unassigned from class", nil)
}

// optionalUUID parses a nullable UUID string pointer into a *uuid.UUID.
func optionalUUID(s *string) (*uuid.UUID, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*s)
	if err != nil {
		return nil, err
	}
	return &id, nil
}
