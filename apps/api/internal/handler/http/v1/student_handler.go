package v1

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/response"
)

type StudentService interface {
	List(ctx context.Context, user *domain.User, filter domain.StudentListFilter) ([]domain.StudentRecord, int64, error)
	Get(ctx context.Context, user *domain.User, id uuid.UUID) (domain.StudentRecord, error)
	Create(ctx context.Context, user *domain.User, input service.StudentCreateInput) (domain.StudentRecord, error)
	Update(ctx context.Context, user *domain.User, id uuid.UUID, input service.StudentUpdateInput) (domain.StudentRecord, error)
	SoftDelete(ctx context.Context, user *domain.User, id uuid.UUID) error
	Enrollments(ctx context.Context, user *domain.User, id uuid.UUID) ([]domain.StudentEnrollment, error)
	Transfer(ctx context.Context, user *domain.User, id uuid.UUID, input service.StudentTransferInput) (domain.StudentRecord, error)
}

type StudentHandler struct{ service StudentService }

func NewStudentHandler(svc StudentService) *StudentHandler { return &StudentHandler{service: svc} }

type studentResponse struct {
	ID               uuid.UUID  `json:"id"`
	NIS              string     `json:"nis"`
	NISN             *string    `json:"nisn,omitempty"`
	FullName         string     `json:"full_name"`
	CurrentClassID   uuid.UUID  `json:"class_id"`
	CurrentClassName string     `json:"current_class_name"`
	Status           string     `json:"status"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func projectStudent(record domain.StudentRecord) studentResponse {
	status := "INACTIVE"
	if record.Active {
		status = "ACTIVE"
	}
	return studentResponse{
		ID: record.ID, NIS: record.NIS, NISN: record.NISN, FullName: record.FullName,
		CurrentClassID: record.CurrentClassID, CurrentClassName: record.CurrentClassName,
		Status: status, DeletedAt: record.DeletedAt, CreatedAt: record.CreatedAt, UpdatedAt: record.UpdatedAt,
	}
}

func projectStudents(records []domain.StudentRecord) []studentResponse {
	projected := make([]studentResponse, len(records))
	for i, record := range records {
		projected[i] = projectStudent(record)
	}
	return projected
}

type studentCreateRequest struct {
	NIS         string  `json:"nis"`
	NISN        *string `json:"nisn"`
	FullName    string  `json:"full_name"`
	ClassID     string  `json:"class_id"`
	EffectiveOn string  `json:"effective_on"`
}
type studentUpdateRequest struct {
	NIS      *string `json:"nis"`
	NISN     *string `json:"nisn"`
	FullName *string `json:"full_name"`
	Active   *bool   `json:"active"`
}
type studentTransferRequest struct {
	ClassID     string `json:"class_id"`
	EffectiveOn string `json:"effective_on"`
}

func (h *StudentHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := domain.StudentListFilter{Page: 1, PerPage: 20, SortBy: "created_at", SortOrder: "asc", Search: q.Get("search")}
	if err := parsePageFilter(q.Get("page"), &filter.Page); err != nil {
		studentInvalidFilter(w)
		return
	}
	if err := parsePerPageFilter(q.Get("per_page"), &filter.PerPage); err != nil {
		studentInvalidFilter(w)
		return
	}
	if v := q.Get("class_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil || id == uuid.Nil {
			studentInvalidFilter(w)
			return
		}
		filter.ClassID = &id
	}
	if v := q.Get("active"); v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			studentInvalidFilter(w)
			return
		}
		filter.Active = &b
	}
	if v := q.Get("include_deleted"); v != "" {
		b, err := strconv.ParseBool(v)
		if err != nil {
			studentInvalidFilter(w)
			return
		}
		filter.IncludeDeleted = b
	}
	if v := q.Get("sort_by"); v != "" {
		filter.SortBy = v
	}
	if v := q.Get("sort_order"); v != "" {
		filter.SortOrder = v
	}
	user := middleware.GetAuthenticatedUser(r.Context())
	items, total, err := h.service.List(r.Context(), user, filter)
	if err != nil {
		writeStudentError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Students retrieved", projectStudents(items), int(filter.Page), int(filter.PerPage), total)
}
func (h *StudentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := studentPathID(w, r)
	if !ok {
		return
	}
	data, err := h.service.Get(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id)
	if err != nil {
		writeStudentError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Student retrieved", projectStudent(data))
}
func (h *StudentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req studentCreateRequest
	if !decodeStudentBody(w, r, &req) {
		return
	}
	classID, err := uuid.Parse(req.ClassID)
	if err != nil || classID == uuid.Nil {
		studentValidation(w)
		return
	}
	date, err := parseEffectiveDate(req.EffectiveOn)
	if err != nil {
		studentInvalidPayload(w)
		return
	}
	var effective *time.Time
	if date != nil {
		effective = date
	}
	data, err := h.service.Create(r.Context(), middleware.GetAuthenticatedUser(r.Context()), service.StudentCreateInput{NIS: req.NIS, NISN: req.NISN, FullName: req.FullName, ClassID: classID, EffectiveOn: effective})
	if err != nil {
		writeStudentError(w, err)
		return
	}
	response.Success(w, http.StatusCreated, "Student created", projectStudent(data))
}
func (h *StudentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := studentPathID(w, r)
	if !ok {
		return
	}
	var req studentUpdateRequest
	if !decodeStudentBody(w, r, &req) {
		return
	}
	data, err := h.service.Update(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id, service.StudentUpdateInput{NIS: req.NIS, NISN: req.NISN, FullName: req.FullName, Active: req.Active})
	if err != nil {
		writeStudentError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Student updated", projectStudent(data))
}
func (h *StudentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := studentPathID(w, r)
	if !ok {
		return
	}
	if err := h.service.SoftDelete(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id); err != nil {
		writeStudentError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Student deleted", map[string]string{"id": id.String()})
}
func (h *StudentHandler) Enrollments(w http.ResponseWriter, r *http.Request) {
	id, ok := studentPathID(w, r)
	if !ok {
		return
	}
	data, err := h.service.Enrollments(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id)
	if err != nil {
		writeStudentError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Student enrollments retrieved", data)
}
func (h *StudentHandler) Transfer(w http.ResponseWriter, r *http.Request) {
	id, ok := studentPathID(w, r)
	if !ok {
		return
	}
	var req studentTransferRequest
	if !decodeStudentBody(w, r, &req) {
		return
	}
	classID, err := uuid.Parse(req.ClassID)
	if err != nil || classID == uuid.Nil {
		studentValidation(w)
		return
	}
	date, err := parseEffectiveDate(req.EffectiveOn)
	if err != nil {
		studentInvalidPayload(w)
		return
	}
	var effective *time.Time
	if date != nil {
		effective = date
	}
	data, err := h.service.Transfer(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id, service.StudentTransferInput{ClassID: classID, EffectiveOn: effective})
	if err != nil {
		writeStudentError(w, err)
		return
	}
	response.Success(w, http.StatusCreated, "Student enrollment transferred", projectStudent(data))
}
func studentPathID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, "student_id"))
	if err != nil || id == uuid.Nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid student ID", nil)
		return uuid.Nil, false
	}
	return id, true
}
func parsePageFilter(value string, dst *int32) error {
	if value == "" {
		return nil
	}
	n, err := strconv.ParseInt(value, 10, 32)
	if err != nil || n < 1 {
		return domain.ErrValidation
	}
	*dst = int32(n)
	return nil
}
func parsePerPageFilter(value string, dst *int32) error {
	if value == "" {
		return nil
	}
	n, err := strconv.ParseInt(value, 10, 32)
	if err != nil || n < 1 || n > 100 {
		return domain.ErrValidation
	}
	*dst = int32(n)
	return nil
}
func parseEffectiveDate(v string) (*time.Time, error) {
	if v == "" {
		return nil, nil
	}
	d, err := time.Parse("2006-01-02", v)
	if err != nil {
		return nil, err
	}
	return &d, nil
}
func decodeStudentBody(w http.ResponseWriter, r *http.Request, dst any) bool {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		studentInvalidPayload(w)
		return false
	}
	var extra any
	if err := dec.Decode(&extra); !errors.Is(err, io.EOF) {
		studentInvalidPayload(w)
		return false
	}
	return true
}
func studentInvalidPayload(w http.ResponseWriter) {
	response.Error(w, http.StatusBadRequest, "INVALID_PAYLOAD", "Malformed request body", nil)
}
func studentInvalidFilter(w http.ResponseWriter) {
	response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid student filter", nil)
}
func studentValidation(w http.ResponseWriter) {
	response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", nil)
}
func writeStudentError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to access this resource", nil)
	case errors.Is(err, domain.ErrNotFound), errors.Is(err, domain.ErrStudentNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Student not found", nil)
	case errors.Is(err, domain.ErrDuplicateNIS):
		response.Error(w, http.StatusConflict, "DUPLICATE_NIS", "Student NIS already exists", nil)
	case errors.Is(err, domain.ErrDuplicateNISN):
		response.Error(w, http.StatusConflict, "DUPLICATE_NISN", "Student NISN already exists", nil)
	case errors.Is(err, domain.ErrConflict), errors.Is(err, domain.ErrEnrollmentConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Student operation conflicts with existing data", nil)
	case errors.Is(err, domain.ErrValidation), errors.Is(err, domain.ErrInvalidEnrollment):
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not process student request", nil)
	}
}
