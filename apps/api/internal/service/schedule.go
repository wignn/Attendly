package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type ScheduleService struct {
	repo domain.ScheduleRepository
	now  func() time.Time
}

func NewScheduleService(repo domain.ScheduleRepository) *ScheduleService {
	return &ScheduleService{repo: repo, now: time.Now}
}

func scheduleReader(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func scheduleAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

func (s *ScheduleService) List(ctx context.Context, user *domain.User, filter domain.ScheduleFilter) ([]domain.Schedule, int64, error) {
	if !scheduleReader(user) {
		return nil, 0, domain.ErrForbidden
	}
	if filter.Page < 1 || filter.PerPage < 1 || filter.PerPage > 100 || filter.DayOfWeek < 0 || filter.DayOfWeek > 7 {
		return nil, 0, domain.ErrValidation
	}
	if filter.OnDate != "" {
		if !validDate(filter.OnDate) {
			return nil, 0, domain.ErrValidation
		}
		date, _ := time.Parse("2006-01-02", filter.OnDate)
		weekday := (int(date.Weekday())+6)%7 + 1
		if filter.DayOfWeek != 0 && filter.DayOfWeek != weekday {
			return nil, 0, domain.ErrValidation
		}
		filter.DayOfWeek = weekday
	}
	if !user.HasRole(domain.RoleSuperAdmin) {
		if filter.TeacherID != uuid.Nil && filter.TeacherID != user.ID {
			return nil, 0, domain.ErrForbidden
		}
		filter.TeacherID = user.ID
	}
	return s.repo.List(ctx, filter)
}

func (s *ScheduleService) Today(ctx context.Context, user *domain.User, page, perPage int32) ([]domain.Schedule, int64, error) {
	jakarta, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return nil, 0, err
	}
	today := s.now().In(jakarta)
	active := true
	return s.List(ctx, user, domain.ScheduleFilter{DayOfWeek: int(today.Weekday()+6)%7 + 1, OnDate: today.Format("2006-01-02"), CurrentOnly: true, Active: &active, Page: page, PerPage: perPage})
}

func (s *ScheduleService) Get(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.Schedule, error) {
	if !scheduleReader(user) {
		return nil, domain.ErrForbidden
	}
	if id == uuid.Nil {
		return nil, domain.ErrValidation
	}
	item, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, domain.ErrNotFound
	}
	if !user.HasRole(domain.RoleSuperAdmin) && item.TeacherID != user.ID {
		return nil, domain.ErrForbidden
	}
	return item, nil
}

func (s *ScheduleService) Create(ctx context.Context, user *domain.User, input domain.ScheduleCreateInput) (*domain.Schedule, error) {
	if !scheduleAdmin(user) {
		return nil, domain.ErrForbidden
	}
	item := &domain.Schedule{ID: uuid.New(), TeachingAssignmentID: input.TeachingAssignmentID, DayOfWeek: input.DayOfWeek, StartsAt: input.StartsAt, EndsAt: input.EndsAt, EffectiveFrom: input.EffectiveFrom, EffectiveUntil: input.EffectiveUntil, Active: true}
	if err := validateSchedule(item); err != nil {
		return nil, err
	}
	if err := s.repo.Create(ctx, item, user.ID); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *ScheduleService) Update(ctx context.Context, user *domain.User, id uuid.UUID, input domain.ScheduleUpdateInput) (*domain.Schedule, error) {
	if !scheduleAdmin(user) {
		return nil, domain.ErrForbidden
	}
	if id == uuid.Nil {
		return nil, domain.ErrValidation
	}
	item, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, domain.ErrNotFound
	}
	if !item.Active {
		return nil, domain.ErrConflict
	}
	if input.TeachingAssignmentID != nil {
		item.TeachingAssignmentID = *input.TeachingAssignmentID
	}
	if input.DayOfWeek != nil {
		item.DayOfWeek = *input.DayOfWeek
	}
	if input.StartsAt != nil {
		item.StartsAt = *input.StartsAt
	}
	if input.EndsAt != nil {
		item.EndsAt = *input.EndsAt
	}
	if input.EffectiveFrom != nil {
		item.EffectiveFrom = *input.EffectiveFrom
	}
	if input.EffectiveUntil != nil {
		item.EffectiveUntil = input.EffectiveUntil
	}
	if input.ClearEffectiveUntil {
		item.EffectiveUntil = nil
	}
	if err := validateSchedule(item); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, item, user.ID); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *ScheduleService) Delete(ctx context.Context, user *domain.User, id uuid.UUID) error {
	if !scheduleAdmin(user) {
		return domain.ErrForbidden
	}
	if id == uuid.Nil {
		return domain.ErrValidation
	}
	return s.repo.Delete(ctx, id, user.ID)
}

func validDate(value string) bool {
	t, err := time.Parse("2006-01-02", value)
	return err == nil && t.Format("2006-01-02") == value
}

func parseClock(value string) (time.Time, error) {
	if t, err := time.Parse("15:04", value); err == nil {
		return t, nil
	}
	return time.Parse("15:04:05", value)
}

func validateSchedule(item *domain.Schedule) error {
	if item.TeachingAssignmentID == uuid.Nil || item.DayOfWeek < 1 || item.DayOfWeek > 7 || !validDate(item.EffectiveFrom) {
		return domain.ErrValidation
	}
	start, startErr := parseClock(item.StartsAt)
	end, endErr := parseClock(item.EndsAt)
	if startErr != nil || endErr != nil || !start.Before(end) {
		return domain.ErrValidation
	}
	if item.EffectiveUntil != nil && (!validDate(*item.EffectiveUntil) || *item.EffectiveUntil < item.EffectiveFrom) {
		return domain.ErrValidation
	}
	return nil
}
