package v1

import (
	"net/http"
	"time"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/response"
	"github.com/google/uuid"
)

type AttendanceHandler struct {
	svc *service.AttendanceService
}

func NewAttendanceHandler(svc *service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{svc: svc}
}

const dateOnly = "2006-01-02"

type CreateSessionRequest struct {
	ClassSubjectID string `json:"class_subject_id" validate:"required,uuid4"`
	SessionDate    string `json:"session_date" validate:"required"`
	Topic          string `json:"topic" validate:"omitempty"`
}

func (h *AttendanceHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req CreateSessionRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	classSubjectID, _ := uuid.Parse(req.ClassSubjectID)
	date, err := time.Parse(dateOnly, req.SessionDate)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_DATE", "session_date must be YYYY-MM-DD", nil)
		return
	}

	var createdBy *uuid.UUID
	if claims := middleware.GetUserClaims(r.Context()); claims != nil {
		createdBy = &claims.UserID
	}

	session, err := h.svc.CreateSession(r.Context(), classSubjectID, date, req.Topic, createdBy)
	if err != nil {
		mapDomainError(w, err, "Class subject not found")
		return
	}
	response.Success(w, http.StatusCreated, "Attendance session created", session)
}

func (h *AttendanceHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	classSubjectID, ok := parseIDParam(w, r, "classSubjectID")
	if !ok {
		return
	}
	sessions, err := h.svc.ListSessions(r.Context(), classSubjectID)
	if err != nil {
		mapDomainError(w, err, "")
		return
	}
	response.Success(w, http.StatusOK, "Sessions retrieved", sessions)
}

func (h *AttendanceHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "sessionID")
	if !ok {
		return
	}
	session, err := h.svc.GetSession(r.Context(), id)
	if err != nil {
		mapDomainError(w, err, "Session not found")
		return
	}
	response.Success(w, http.StatusOK, "Session retrieved", session)
}

func (h *AttendanceHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	id, ok := parseIDParam(w, r, "sessionID")
	if !ok {
		return
	}
	if err := h.svc.DeleteSession(r.Context(), id); err != nil {
		mapDomainError(w, err, "Session not found")
		return
	}
	response.Success(w, http.StatusOK, "Session deleted", nil)
}

type MarkAttendanceRequest struct {
	Records []struct {
		StudentID string `json:"student_id" validate:"required,uuid4"`
		Status    string `json:"status" validate:"required,oneof=PRESENT ABSENT LATE SICK EXCUSED"`
		Note      string `json:"note" validate:"omitempty"`
	} `json:"records" validate:"required,min=1,dive"`
}

func (h *AttendanceHandler) MarkAttendance(w http.ResponseWriter, r *http.Request) {
	sessionID, ok := parseIDParam(w, r, "sessionID")
	if !ok {
		return
	}

	var req MarkAttendanceRequest
	if !decodeJSON(w, r, &req) {
		return
	}

	inputs := make([]service.RecordInput, 0, len(req.Records))
	for _, rec := range req.Records {
		studentID, err := uuid.Parse(rec.StudentID)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid student_id", nil)
			return
		}
		inputs = append(inputs, service.RecordInput{
			StudentID: studentID,
			Status:    domain.AttendanceStatus(rec.Status),
			Note:      rec.Note,
		})
	}

	records, err := h.svc.MarkAttendance(r.Context(), sessionID, inputs)
	if err != nil {
		mapDomainError(w, err, "Session not found")
		return
	}
	response.Success(w, http.StatusOK, "Attendance recorded", records)
}

func (h *AttendanceHandler) Summary(w http.ResponseWriter, r *http.Request) {
	classSubjectID, ok := parseIDParam(w, r, "classSubjectID")
	if !ok {
		return
	}
	summary, err := h.svc.Summary(r.Context(), classSubjectID)
	if err != nil {
		mapDomainError(w, err, "")
		return
	}
	response.Success(w, http.StatusOK, "Attendance summary retrieved", summary)
}
