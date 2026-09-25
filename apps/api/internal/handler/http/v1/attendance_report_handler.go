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

type AttendanceReportHandler struct {
	service *service.AttendanceReportService
}

func NewAttendanceReportHandler(svc *service.AttendanceReportService) *AttendanceReportHandler {
	return &AttendanceReportHandler{service: svc}
}

func (h *AttendanceReportHandler) AdminDashboard(w http.ResponseWriter, r *http.Request) {
	if !hasReportRole(r, domain.RoleSuperAdmin) {
		reportForbidden(w)
		return
	}
	data, err := h.service.AdminDashboard(r.Context(), middleware.GetAuthenticatedUser(r.Context()))
	if err != nil {
		reportInternal(w)
		return
	}
	response.Success(w, http.StatusOK, "Admin dashboard retrieved", data)
}
func (h *AttendanceReportHandler) Activities(w http.ResponseWriter, r *http.Request) {
	if !hasReportRole(r, domain.RoleSuperAdmin) {
		reportForbidden(w)
		return
	}
	page, perPage, ok := reportPagination(w, r)
	if !ok {
		return
	}
	data, total, err := h.service.Activities(r.Context(), middleware.GetAuthenticatedUser(r.Context()), page, perPage)
	if err != nil {
		reportInternal(w)
		return
	}
	response.Paginated(w, http.StatusOK, "Activities retrieved", data, int(page), int(perPage), total)
}
func (h *AttendanceReportHandler) TeacherDashboard(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetAuthenticatedUser(r.Context())
	data, err := h.service.TeacherDashboard(r.Context(), user)
	if err != nil {
		writeReportError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Teacher dashboard retrieved", data)
}
func (h *AttendanceReportHandler) HomeroomDashboard(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetAuthenticatedUser(r.Context())
	data, err := h.service.HomeroomDashboard(r.Context(), user)
	if err != nil {
		writeReportError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Homeroom dashboard retrieved", data)
}
func (h *AttendanceReportHandler) StudentSummary(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "student_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid student ID", nil)
		return
	}
	data, err := h.service.StudentSummary(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id)
	if err != nil {
		writeReportError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Student attendance summary retrieved", data)
}
func (h *AttendanceReportHandler) SubjectAttendance(w http.ResponseWriter, r *http.Request) {
	subjectID, err := uuid.Parse(r.URL.Query().Get("subject_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "A valid subject_id is required", nil)
		return
	}
	page, perPage, ok := reportPagination(w, r)
	if !ok {
		return
	}
	classes, total, err := h.service.SubjectClasses(r.Context(), middleware.GetAuthenticatedUser(r.Context()), subjectID, page, perPage)
	if err != nil {
		writeReportError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Subject attendance retrieved", classes, int(page), int(perPage), total)
}
func (h *AttendanceReportHandler) ClassAttendance(w http.ResponseWriter, r *http.Request) {
	classID, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}
	subjectID, err := uuid.Parse(r.URL.Query().Get("subject_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_FILTER", "A valid subject_id is required", nil)
		return
	}
	page, perPage, ok := reportPagination(w, r)
	if !ok {
		return
	}
	data, total, err := h.service.ClassAttendance(r.Context(), middleware.GetAuthenticatedUser(r.Context()), classID, subjectID, page, perPage)
	if err != nil {
		writeReportError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Class attendance retrieved", data, int(page), int(perPage), total)
}
func (h *AttendanceReportHandler) HomeroomReport(w http.ResponseWriter, r *http.Request) {
	classID, err := uuid.Parse(chi.URLParam(r, "class_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid class ID", nil)
		return
	}
	page, perPage, ok := reportPagination(w, r)
	if !ok {
		return
	}
	data, total, err := h.service.HomeroomReport(r.Context(), middleware.GetAuthenticatedUser(r.Context()), classID, page, perPage)
	if err != nil {
		writeReportError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Homeroom attendance retrieved", data, int(page), int(perPage), total)
}
func reportPagination(w http.ResponseWriter, r *http.Request) (int32, int32, bool) {
	page, perPage := int64(1), int64(20)
	var err error
	if value := r.URL.Query().Get("page"); value != "" {
		page, err = strconv.ParseInt(value, 10, 32)
		if err != nil || page < 1 {
			response.Error(w, http.StatusBadRequest, "INVALID_PAGINATION", "page must be a positive integer", nil)
			return 0, 0, false
		}
	}
	if value := r.URL.Query().Get("per_page"); value != "" {
		perPage, err = strconv.ParseInt(value, 10, 32)
		if err != nil || perPage < 1 || perPage > 100 {
			response.Error(w, http.StatusBadRequest, "INVALID_PAGINATION", "per_page must be between 1 and 100", nil)
			return 0, 0, false
		}
	}
	return int32(page), int32(perPage), true
}
func hasReportRole(r *http.Request, roles ...domain.Role) bool {
	user := middleware.GetAuthenticatedUser(r.Context())
	if user == nil {
		return false
	}
	for _, role := range roles {
		if user.HasRole(role) {
			return true
		}
	}
	return false
}
func reportForbidden(w http.ResponseWriter) {
	response.Error(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to access this resource", nil)
}
func reportInternal(w http.ResponseWriter) {
	response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not retrieve attendance report", nil)
}
func writeReportError(w http.ResponseWriter, err error) {
	if errors.Is(err, domain.ErrForbidden) {
		reportForbidden(w)
		return
	}
	if errors.Is(err, domain.ErrNotFound) {
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Report resource not found", nil)
		return
	}
	reportInternal(w)
}
