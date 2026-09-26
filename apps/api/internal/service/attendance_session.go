package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type AttendanceSessionService struct {
	repo domain.AttendanceSessionRepository
	now  func() time.Time
}

func NewAttendanceSessionService(repo domain.AttendanceSessionRepository) *AttendanceSessionService {
	return &AttendanceSessionService{
		repo: repo,
		now:  time.Now,
	}
}

func attendanceUser(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func attendanceAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

func (s *AttendanceSessionService) CreateOrGet(ctx context.Context, user *domain.User, in domain.CreateAttendanceSessionInput) (*domain.AttendanceSessionDetail, bool, error) {
	if !attendanceUser(user) {
		return nil, false, domain.ErrForbidden
	}

	jakarta, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return nil, false, err
	}

	var sessionDate time.Time
	if strings.TrimSpace(in.Date) == "" {
		today := s.now().In(jakarta)
		sessionDate = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, jakarta)
	} else {
		parsed, err := time.ParseInLocation("2006-01-02", in.Date, jakarta)
		if err != nil {
			return nil, false, domain.ErrValidation
		}
		sessionDate = parsed
	}

	if in.ScheduleID != nil && *in.ScheduleID != uuid.Nil {
		sched, err := s.repo.GetScheduleByID(ctx, *in.ScheduleID)
		if err != nil {
			return nil, false, err
		}
		if !attendanceAdmin(user) && sched.TeacherID != user.ID {
			return nil, false, domain.ErrForbidden
		}
		return s.repo.CreateOrGetFromSchedule(ctx, *in.ScheduleID, sessionDate, user.ID)
	}

	if in.ClassID != nil && *in.ClassID != uuid.Nil && in.SubjectID != nil && *in.SubjectID != uuid.Nil {
		teacherID := user.ID
		return s.repo.CreateOrGetManual(ctx, *in.ClassID, *in.SubjectID, teacherID, sessionDate, user.ID)
	}

	return nil, false, domain.ErrValidation
}

func (s *AttendanceSessionService) GetByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	if !attendanceUser(user) {
		return nil, domain.ErrForbidden
	}
	sess, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !attendanceAdmin(user) && sess.TeacherID != user.ID {
		// Homeroom or assigned teachers check can be extended, default check teacherID
		return nil, domain.ErrForbidden
	}
	return sess, nil
}

func (s *AttendanceSessionService) List(ctx context.Context, user *domain.User, f domain.AttendanceSessionFilter) ([]domain.AttendanceSessionDetail, int64, error) {
	if !attendanceUser(user) {
		return nil, 0, domain.ErrForbidden
	}
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PerPage < 1 || f.PerPage > 100 {
		f.PerPage = 20
	}
	if !attendanceAdmin(user) {
		if f.TeacherID != uuid.Nil && f.TeacherID != user.ID {
			return nil, 0, domain.ErrForbidden
		}
		f.TeacherID = user.ID
	}
	return s.repo.List(ctx, f)
}

func (s *AttendanceSessionService) UpdateRecords(ctx context.Context, user *domain.User, sessionID uuid.UUID, in domain.UpdateAttendanceRecordsInput) (*domain.AttendanceSessionDetail, error) {
	if !attendanceUser(user) {
		return nil, domain.ErrForbidden
	}
	sess, err := s.repo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if !attendanceAdmin(user) && sess.TeacherID != user.ID {
		return nil, domain.ErrForbidden
	}
	if sess.Status == domain.SessionStatusSubmitted {
		return nil, domain.ErrSessionLocked
	}
	for _, rec := range in.Records {
		if !rec.Status.IsValid() {
			return nil, domain.ErrValidation
		}
	}
	return s.repo.UpdateRecords(ctx, sessionID, in.Version, in.Records, user.ID)
}

func (s *AttendanceSessionService) Submit(ctx context.Context, user *domain.User, sessionID uuid.UUID, in domain.SubmitSessionInput) (*domain.AttendanceSessionDetail, error) {
	if !attendanceUser(user) {
		return nil, domain.ErrForbidden
	}
	sess, err := s.repo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if !attendanceAdmin(user) && sess.TeacherID != user.ID {
		return nil, domain.ErrForbidden
	}
	if sess.Status == domain.SessionStatusSubmitted {
		return nil, domain.ErrSessionLocked
	}
	return s.repo.Submit(ctx, sessionID, in.Version, user.ID)
}

func (s *AttendanceSessionService) Reopen(ctx context.Context, user *domain.User, sessionID uuid.UUID, in domain.ReopenSessionInput) (*domain.AttendanceSessionDetail, error) {
	if !attendanceAdmin(user) {
		return nil, domain.ErrForbidden
	}
	reason := strings.TrimSpace(in.Reason)
	if reason == "" {
		return nil, domain.ErrReopenReasonRequired
	}
	sess, err := s.repo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if sess.Status != domain.SessionStatusSubmitted {
		return nil, domain.ErrInvalidSessionStatus
	}
	return s.repo.Reopen(ctx, sessionID, user.ID, reason)
}
