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

type AttendanceSessionHandler struct {
	service *service.AttendanceSessionService
}

func NewAttendanceSessionHandler(svc *service.AttendanceSessionService) *AttendanceSessionHandler {
	return &AttendanceSessionHandler{service: svc}
}

func (h *AttendanceSessionHandler) CreateOrGet(w http.ResponseWriter, r *http.Request) {
	var in domain.CreateAttendanceSessionInput
	if err := decodeAttendanceJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	sess, created, err := h.service.CreateOrGet(r.Context(), user, in)
	if err != nil {
		writeAttendanceSessionError(w, err)
		return
	}

	status := http.StatusOK
	msg := "Attendance session retrieved"
	if created {
		status = http.StatusCreated
		msg = "Attendance session created"
	}
	response.Success(w, status, msg, sess)
}

func (h *AttendanceSessionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid attendance session ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	sess, err := h.service.GetByID(r.Context(), user, id)
	if err != nil {
		writeAttendanceSessionError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Attendance session retrieved", sess)
}

func (h *AttendanceSessionHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter domain.AttendanceSessionFilter

	if s := q.Get("class_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.ClassID = id
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid class_id", nil)
			return
		}
	}
	if s := q.Get("subject_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.SubjectID = id
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid subject_id", nil)
			return
		}
	}
	if s := q.Get("teacher_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.TeacherID = id
		} else {
			response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "Invalid teacher_id", nil)
			return
		}
	}
	filter.Status = q.Get("status")
	filter.Date = q.Get("date")
	filter.FromDate = q.Get("from_date")
	filter.ToDate = q.Get("to_date")

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
	sessions, total, err := h.service.List(r.Context(), user, filter)
	if err != nil {
		writeAttendanceSessionError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Attendance sessions retrieved", sessions, int(page), int(perPage), total)
}

func (h *AttendanceSessionHandler) UpdateRecords(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid attendance session ID", nil)
		return
	}

	var in domain.UpdateAttendanceRecordsInput
	if err := decodeAttendanceJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	sess, err := h.service.UpdateRecords(r.Context(), user, id, in)
	if err != nil {
		writeAttendanceSessionError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Attendance records updated", sess)
}

func (h *AttendanceSessionHandler) Submit(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid attendance session ID", nil)
		return
	}

	var in domain.SubmitSessionInput
	_ = decodeAttendanceJSON(r, &in)

	user := middleware.GetAuthenticatedUser(r.Context())
	sess, err := h.service.Submit(r.Context(), user, id, in)
	if err != nil {
		writeAttendanceSessionError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Attendance session submitted and locked", sess)
}

func (h *AttendanceSessionHandler) Reopen(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid attendance session ID", nil)
		return
	}

	var in domain.ReopenSessionInput
	if err := decodeAttendanceJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	sess, err := h.service.Reopen(r.Context(), user, id, in)
	if err != nil {
		writeAttendanceSessionError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Attendance session reopened", sess)
}

func decodeAttendanceJSON(r *http.Request, target any) error {
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

func writeAttendanceSessionError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Attendance session not found", nil)
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Forbidden access", nil)
	case errors.Is(err, domain.ErrSessionLocked):
		response.Error(w, http.StatusBadRequest, "SESSION_LOCKED", "Attendance session is submitted and locked", nil)
	case errors.Is(err, domain.ErrSessionVersionMismatch):
		response.Error(w, http.StatusConflict, "CONFLICT", "Attendance session version conflict", nil)
	case errors.Is(err, domain.ErrReopenReasonRequired):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Reopen reason is required", nil)
	case errors.Is(err, domain.ErrInvalidSessionStatus):
		response.Error(w, http.StatusBadRequest, "INVALID_STATUS", "Invalid session status for operation", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation error", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}
