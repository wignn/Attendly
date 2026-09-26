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

type ExportAuditHandler struct {
	service *service.ExportAuditService
}

func NewExportAuditHandler(svc *service.ExportAuditService) *ExportAuditHandler {
	return &ExportAuditHandler{service: svc}
}

func (h *ExportAuditHandler) CreateExport(w http.ResponseWriter, r *http.Request) {
	var in domain.CreateExportInput
	if err := decodeJSON(r, &in); err != nil {
		response.Error(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid request body", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	job, err := h.service.CreateExportJob(r.Context(), user, in)
	if err != nil {
		writeExportAuditError(w, err)
		return
	}

	response.Success(w, http.StatusAccepted, "Export job created", job)
}

func (h *ExportAuditHandler) GetExportJob(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "job_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid export job ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	job, err := h.service.GetExportJobByID(r.Context(), user, id)
	if err != nil {
		writeExportAuditError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Export job retrieved", job)
}

func (h *ExportAuditHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	var filter domain.AuditLogFilter

	if s := q.Get("actor_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.ActorID = id
		}
	}
	if s := q.Get("entity_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.EntityID = id
		}
	}
	filter.Entity = q.Get("entity")
	filter.Action = q.Get("action")
	filter.FromDate = q.Get("from_date")
	filter.ToDate = q.Get("to_date")

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
	filter.Page = page
	filter.PerPage = perPage

	user := middleware.GetAuthenticatedUser(r.Context())
	items, total, err := h.service.ListAuditLogs(r.Context(), user, filter)
	if err != nil {
		writeExportAuditError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, "Audit logs retrieved", items, int(page), int(perPage), total)
}

func (h *ExportAuditHandler) GetAuditLog(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "audit_log_id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid audit log ID", nil)
		return
	}

	user := middleware.GetAuthenticatedUser(r.Context())
	item, err := h.service.GetAuditLogByID(r.Context(), user, id)
	if err != nil {
		writeExportAuditError(w, err)
		return
	}

	response.Success(w, http.StatusOK, "Audit log retrieved", item)
}

func writeExportAuditError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Resource not found", nil)
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "Forbidden access", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Validation failed", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}
