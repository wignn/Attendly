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

type ScheduleHandler struct{ service *service.ScheduleService }

func NewScheduleHandler(svc *service.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{service: svc}
}

func (h *ScheduleHandler) List(w http.ResponseWriter, r *http.Request) {
	filter, ok := scheduleListFilter(w, r)
	if !ok {
		return
	}
	items, total, err := h.service.List(r.Context(), middleware.GetAuthenticatedUser(r.Context()), filter)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Schedules retrieved", items, int(filter.Page), int(filter.PerPage), total)
}

func (h *ScheduleHandler) Today(w http.ResponseWriter, r *http.Request) {
	page, perPage, ok := reportPagination(w, r)
	if !ok {
		return
	}
	items, total, err := h.service.Today(r.Context(), middleware.GetAuthenticatedUser(r.Context()), page, perPage)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, "Today's schedules retrieved", items, int(page), int(perPage), total)
}

func (h *ScheduleHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := scheduleParamID(w, r)
	if !ok {
		return
	}
	item, err := h.service.Get(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Schedule retrieved", item)
}

func (h *ScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input domain.ScheduleCreateInput
	if !decodeScheduleJSON(w, r, &input) {
		return
	}
	item, err := h.service.Create(r.Context(), middleware.GetAuthenticatedUser(r.Context()), input)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	response.Success(w, http.StatusCreated, "Schedule created", item)
}

func (h *ScheduleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := scheduleParamID(w, r)
	if !ok {
		return
	}
	var input domain.ScheduleUpdateInput
	body, ok := readScheduleBody(w, r)
	if !ok {
		return
	}
	if !decodeScheduleBytes(w, body, &input) {
		return
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(body, &fields); err != nil || len(fields) == 0 {
		scheduleBadRequest(w, "A nonempty JSON object is required")
		return
	}
	for name, raw := range fields {
		if name != "effective_until" && bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
			scheduleBadRequest(w, "Schedule fields cannot be null")
			return
		}
	}
	if raw, exists := fields["effective_until"]; exists && bytes.Equal(bytes.TrimSpace(raw), []byte("null")) {
		input.ClearEffectiveUntil = true
	}
	item, err := h.service.Update(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id, input)
	if err != nil {
		writeScheduleError(w, err)
		return
	}
	response.Success(w, http.StatusOK, "Schedule updated", item)
}

func (h *ScheduleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := scheduleParamID(w, r)
	if !ok {
		return
	}
	if err := h.service.Delete(r.Context(), middleware.GetAuthenticatedUser(r.Context()), id); err != nil {
		writeScheduleError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func scheduleListFilter(w http.ResponseWriter, r *http.Request) (domain.ScheduleFilter, bool) {
	page, perPage, ok := reportPagination(w, r)
	if !ok {
		return domain.ScheduleFilter{}, false
	}
	q := r.URL.Query()
	filter := domain.ScheduleFilter{Page: page, PerPage: perPage, OnDate: q.Get("on_date")}
	for _, item := range []struct {
		name   string
		target *uuid.UUID
	}{
		{"teacher_id", &filter.TeacherID}, {"class_id", &filter.ClassID},
		{"subject_id", &filter.SubjectID}, {"academic_year_id", &filter.AcademicYearID},
	} {
		if raw := q.Get(item.name); raw != "" {
			id, err := uuid.Parse(raw)
			if err != nil || id == uuid.Nil {
				scheduleBadRequest(w, "Invalid "+item.name)
				return domain.ScheduleFilter{}, false
			}
			*item.target = id
		}
	}
	if raw := q.Get("day_of_week"); raw != "" {
		day, err := strconv.Atoi(raw)
		if err != nil || day < 1 || day > 7 {
			scheduleBadRequest(w, "day_of_week must be between 1 and 7")
			return domain.ScheduleFilter{}, false
		}
		filter.DayOfWeek = day
	}
	if raw := q.Get("active"); raw != "" {
		active, err := strconv.ParseBool(raw)
		if err != nil {
			scheduleBadRequest(w, "active must be a boolean")
			return domain.ScheduleFilter{}, false
		}
		filter.Active = &active
	}
	return filter, true
}

func scheduleParamID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(chi.URLParam(r, "schedule_id"))
	if err != nil || id == uuid.Nil {
		response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid schedule ID", nil)
		return uuid.Nil, false
	}
	return id, true
}

func readScheduleBody(w http.ResponseWriter, r *http.Request) ([]byte, bool) {
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 64<<10))
	if err != nil {
		scheduleBadRequest(w, "Invalid or oversized JSON body")
		return nil, false
	}
	return body, true
}

func decodeScheduleJSON(w http.ResponseWriter, r *http.Request, target any) bool {
	body, ok := readScheduleBody(w, r)
	return ok && decodeScheduleBytes(w, body, target)
}

func decodeScheduleBytes(w http.ResponseWriter, body []byte, target any) bool {
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		scheduleBadRequest(w, "Invalid JSON body")
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		scheduleBadRequest(w, "Only one JSON object is allowed")
		return false
	}
	return true
}

func scheduleBadRequest(w http.ResponseWriter, message string) {
	response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", message, nil)
}

func writeScheduleError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrForbidden):
		response.Error(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to access this schedule", nil)
	case errors.Is(err, domain.ErrNotFound):
		response.Error(w, http.StatusNotFound, "NOT_FOUND", "Schedule not found", nil)
	case errors.Is(err, domain.ErrConflict):
		response.Error(w, http.StatusConflict, "CONFLICT", "Schedule conflicts with an existing schedule", nil)
	case errors.Is(err, domain.ErrValidation):
		response.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid schedule data", nil)
	default:
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Could not process schedule", nil)
	}
}
