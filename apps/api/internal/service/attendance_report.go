package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/wignn/komas-api/internal/domain"
)

type AttendanceReportService struct {
	repo domain.AttendanceReportRepository
}

func NewAttendanceReportService(repo domain.AttendanceReportRepository) *AttendanceReportService {
	return &AttendanceReportService{repo: repo}
}

func (s *AttendanceReportService) AdminDashboard(ctx context.Context, user *domain.User) (domain.AdminDashboard, error) {
	if user == nil || !user.HasRole(domain.RoleSuperAdmin) {
		return domain.AdminDashboard{}, domain.ErrForbidden
	}
	dashboard, err := s.repo.AdminDashboard(ctx)
	if err != nil {
		return domain.AdminDashboard{}, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "ADMIN_DASHBOARD", user.ID); err != nil {
		return domain.AdminDashboard{}, err
	}
	dashboard.AttendanceRate = dashboard.Attendance.AttendanceRate()
	return dashboard, nil
}

func (s *AttendanceReportService) TeacherDashboard(ctx context.Context, user *domain.User) (domain.TeacherDashboard, error) {
	if user == nil || !user.HasRole(domain.RoleTeacher) {
		return domain.TeacherDashboard{}, domain.ErrForbidden
	}
	dashboard, err := s.repo.TeacherDashboard(ctx, user.ID)
	if err != nil {
		return domain.TeacherDashboard{}, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "TEACHER_DASHBOARD", user.ID); err != nil {
		return domain.TeacherDashboard{}, err
	}
	dashboard.Rate = dashboard.Attendance.AttendanceRate()
	return dashboard, nil
}

func (s *AttendanceReportService) HomeroomDashboard(ctx context.Context, user *domain.User) (domain.TeacherDashboard, error) {
	if user == nil || !user.HasRole(domain.RoleHomeroomTeacher) {
		return domain.TeacherDashboard{}, domain.ErrForbidden
	}
	dashboard, err := s.repo.HomeroomDashboard(ctx, user.ID)
	if err != nil {
		return domain.TeacherDashboard{}, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "HOMEROOM_DASHBOARD", user.ID); err != nil {
		return domain.TeacherDashboard{}, err
	}
	dashboard.Rate = dashboard.Attendance.AttendanceRate()
	return dashboard, nil
}

func (s *AttendanceReportService) StudentSummary(ctx context.Context, user *domain.User, studentID uuid.UUID) (domain.StudentAttendanceSummary, error) {
	if user == nil {
		return domain.StudentAttendanceSummary{}, domain.ErrForbidden
	}
	if !user.HasRole(domain.RoleSuperAdmin) {
		if !user.HasRole(domain.RoleHomeroomTeacher) {
			return domain.StudentAttendanceSummary{}, domain.ErrForbidden
		}
		allowed, err := s.repo.IsHomeroomOfStudent(ctx, user.ID, studentID)
		if err != nil {
			return domain.StudentAttendanceSummary{}, err
		}
		if !allowed {
			return domain.StudentAttendanceSummary{}, domain.ErrForbidden
		}
	}
	summary, err := s.repo.StudentSummary(ctx, studentID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.StudentAttendanceSummary{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.StudentAttendanceSummary{}, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "STUDENT_ATTENDANCE_SUMMARY", studentID); err != nil {
		return domain.StudentAttendanceSummary{}, err
	}
	summary.Rate = summary.Counts.AttendanceRate()
	return summary, nil
}

func (s *AttendanceReportService) SubjectClasses(ctx context.Context, user *domain.User, subjectID uuid.UUID, page, perPage int32) ([]domain.SubjectClassReport, int64, error) {
	if user == nil || (!user.HasRole(domain.RoleSuperAdmin) && !user.HasRole(domain.RoleTeacher)) {
		return nil, 0, domain.ErrForbidden
	}
	if !user.HasRole(domain.RoleSuperAdmin) {
		allowed, err := s.repo.CanAccessSubject(ctx, user.ID, subjectID)
		if err != nil {
			return nil, 0, err
		}
		if !allowed {
			return nil, 0, domain.ErrForbidden
		}
	}
	classes, total, err := s.repo.SubjectClasses(ctx, subjectID, reportTeacherScope(user), page, perPage)
	if err != nil {
		return nil, 0, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "SUBJECT_ATTENDANCE_REPORT", subjectID); err != nil {
		return nil, 0, err
	}
	return classes, total, nil
}

func reportTeacherScope(user *domain.User) uuid.UUID {
	if user.HasRole(domain.RoleSuperAdmin) {
		return uuid.Nil
	}
	return user.ID
}

func (s *AttendanceReportService) ClassAttendance(ctx context.Context, user *domain.User, classID, subjectID uuid.UUID, page, perPage int32) (domain.ClassAttendanceReport, int64, error) {
	if user == nil || (!user.HasRole(domain.RoleSuperAdmin) && !user.HasRole(domain.RoleTeacher)) {
		return domain.ClassAttendanceReport{}, 0, domain.ErrForbidden
	}
	if !user.HasRole(domain.RoleSuperAdmin) {
		allowed, err := s.repo.CanAccessSubject(ctx, user.ID, subjectID)
		if err != nil {
			return domain.ClassAttendanceReport{}, 0, err
		}
		if !allowed {
			return domain.ClassAttendanceReport{}, 0, domain.ErrForbidden
		}
		classAllowed, err := s.repo.IsAssignedToClassSubject(ctx, user.ID, classID, subjectID)
		if err != nil {
			return domain.ClassAttendanceReport{}, 0, err
		}
		if !classAllowed {
			return domain.ClassAttendanceReport{}, 0, domain.ErrForbidden
		}
	}
	report, total, err := s.repo.ClassAttendance(ctx, classID, subjectID, page, perPage)
	if err != nil {
		return domain.ClassAttendanceReport{}, 0, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "CLASS_ATTENDANCE_REPORT", classID); err != nil {
		return domain.ClassAttendanceReport{}, 0, err
	}
	return report, total, nil
}

func (s *AttendanceReportService) HomeroomReport(ctx context.Context, user *domain.User, classID uuid.UUID, page, perPage int32) (domain.ClassAttendanceReport, int64, error) {
	if user == nil || (!user.HasRole(domain.RoleSuperAdmin) && !user.HasRole(domain.RoleHomeroomTeacher)) {
		return domain.ClassAttendanceReport{}, 0, domain.ErrForbidden
	}
	if !user.HasRole(domain.RoleSuperAdmin) {
		allowed, err := s.repo.IsHomeroomOfClass(ctx, user.ID, classID)
		if err != nil {
			return domain.ClassAttendanceReport{}, 0, err
		}
		if !allowed {
			return domain.ClassAttendanceReport{}, 0, domain.ErrForbidden
		}
	}
	report, total, err := s.repo.HomeroomReport(ctx, classID, reportTeacherScope(user), page, perPage)
	if err != nil {
		return domain.ClassAttendanceReport{}, 0, err
	}
	if err := s.repo.RecordActivity(ctx, user.ID, "VIEW", "HOMEROOM_REPORT", classID); err != nil {
		return domain.ClassAttendanceReport{}, 0, err
	}
	return report, total, nil
}

func (s *AttendanceReportService) Activities(ctx context.Context, user *domain.User, page, perPage int32) ([]domain.Activity, int64, error) {
	if user == nil || !user.HasRole(domain.RoleSuperAdmin) {
		return nil, 0, domain.ErrForbidden
	}
	return s.repo.Activities(ctx, page, perPage)
}
