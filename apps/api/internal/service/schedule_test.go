package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type scheduleRepoStub struct {
	items       []domain.Schedule
	item        *domain.Schedule
	filter      domain.ScheduleFilter
	createCalls int
	updateCalls int
	deleteCalls int
	err         error
}

func (r *scheduleRepoStub) List(_ context.Context, filter domain.ScheduleFilter) ([]domain.Schedule, int64, error) {
	r.filter = filter
	return r.items, int64(len(r.items)), r.err
}
func (r *scheduleRepoStub) Get(_ context.Context, _ uuid.UUID) (*domain.Schedule, error) {
	return r.item, r.err
}
func (r *scheduleRepoStub) Create(_ context.Context, schedule *domain.Schedule, _ uuid.UUID) error {
	r.createCalls++
	r.item = schedule
	return r.err
}
func (r *scheduleRepoStub) Update(_ context.Context, schedule *domain.Schedule, _ uuid.UUID) error {
	r.updateCalls++
	r.item = schedule
	return r.err
}
func (r *scheduleRepoStub) Delete(_ context.Context, _ uuid.UUID, _ uuid.UUID) error {
	r.deleteCalls++
	return r.err
}

func TestScheduleCreateRejectsNonAdminAndInvalidInterval(t *testing.T) {
	repo := &scheduleRepoStub{}
	svc := NewScheduleService(repo)
	input := domain.ScheduleCreateInput{TeachingAssignmentID: uuid.New(), DayOfWeek: 1, StartsAt: "08:00", EndsAt: "09:00", EffectiveFrom: "2026-09-01"}
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleTeacher}
	if _, err := svc.Create(context.Background(), teacher, input); !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("teacher write: %v", err)
	}
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	input.EndsAt = "07:59"
	if _, err := svc.Create(context.Background(), admin, input); !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("invalid interval: %v", err)
	}
	if repo.createCalls != 0 {
		t.Fatalf("invalid writes reached repository: %d", repo.createCalls)
	}
}

func TestScheduleListScopesTeacherToOwnID(t *testing.T) {
	repo := &scheduleRepoStub{items: []domain.Schedule{}}
	svc := NewScheduleService(repo)
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleTeacher}
	other := uuid.New()
	_, _, err := svc.List(context.Background(), teacher, domain.ScheduleFilter{TeacherID: other, Page: 1, PerPage: 20})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("teacher requesting another teacher: %v", err)
	}
	_, _, err = svc.List(context.Background(), teacher, domain.ScheduleFilter{Page: 1, PerPage: 20})
	if err != nil {
		t.Fatal(err)
	}
	if repo.filter.TeacherID != teacher.ID {
		t.Fatalf("teacher query leaked scope: %s", repo.filter.TeacherID)
	}
}

func TestScheduleTodayUsesJakartaCalendarDate(t *testing.T) {
	repo := &scheduleRepoStub{items: []domain.Schedule{}}
	svc := NewScheduleService(repo)
	svc.now = func() time.Time { return time.Date(2026, 9, 27, 18, 30, 0, 0, time.UTC) }
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	_, _, err := svc.Today(context.Background(), admin, 1, 20)
	if err != nil {
		t.Fatal(err)
	}
	if repo.filter.OnDate != "2026-09-28" || repo.filter.DayOfWeek != 1 {
		t.Fatalf("wrong Jakarta date/day: %+v", repo.filter)
	}
}

func TestScheduleListOnDateMatchesWeekday(t *testing.T) {
	repo := &scheduleRepoStub{}
	svc := NewScheduleService(repo)
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	_, _, err := svc.List(context.Background(), admin, domain.ScheduleFilter{OnDate: "2026-09-26", Page: 1, PerPage: 20})
	if err != nil || repo.filter.DayOfWeek != 6 {
		t.Fatalf("Saturday date should filter Saturday schedules: filter=%+v err=%v", repo.filter, err)
	}
	_, _, err = svc.List(context.Background(), admin, domain.ScheduleFilter{OnDate: "2026-09-26", DayOfWeek: 1, Page: 1, PerPage: 20})
	if !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("conflicting date and weekday: %v", err)
	}
}

func TestScheduleUpdatePreservesRecordIDAndRejectsInvalidDateRange(t *testing.T) {
	id := uuid.New()
	repo := &scheduleRepoStub{item: &domain.Schedule{ID: id, TeachingAssignmentID: uuid.New(), DayOfWeek: 2, StartsAt: "08:00", EndsAt: "09:00", EffectiveFrom: "2026-09-01", Active: true}}
	svc := NewScheduleService(repo)
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	until := "2026-08-31"
	_, err := svc.Update(context.Background(), admin, id, domain.ScheduleUpdateInput{EffectiveUntil: &until})
	if !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("invalid effective range: %v", err)
	}
	if repo.updateCalls != 0 {
		t.Fatalf("invalid update reached repository: %d", repo.updateCalls)
	}
}
