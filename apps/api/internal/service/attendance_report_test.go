package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/wignn/komas-api/internal/domain"
)

type reportRepoStub struct {
	counts         domain.AttendanceCounts
	student        domain.StudentAttendanceSummary
	classes        []domain.SubjectClassReport
	class          domain.ClassAttendanceReport
	classAccess    bool
	studentAccess  bool
	subjectAccess  bool
	homeroomAccess bool
	activities     []domain.Activity
	err            error
	auditErr       error
	onAudit        func(domain.Activity)
}

func (r reportRepoStub) AdminDashboard(context.Context) (domain.AdminDashboard, error) {
	return domain.AdminDashboard{Attendance: r.counts}, r.err
}
func (r reportRepoStub) TeacherDashboard(context.Context, uuid.UUID) (domain.TeacherDashboard, error) {
	return domain.TeacherDashboard{Attendance: r.counts, Classes: r.classes}, r.err
}
func (r reportRepoStub) HomeroomDashboard(context.Context, uuid.UUID) (domain.TeacherDashboard, error) {
	return domain.TeacherDashboard{Attendance: r.counts}, r.err
}
func (r reportRepoStub) StudentSummary(context.Context, uuid.UUID) (domain.StudentAttendanceSummary, error) {
	return r.student, r.err
}
func (r reportRepoStub) SubjectClasses(context.Context, uuid.UUID, uuid.UUID, int32, int32) ([]domain.SubjectClassReport, int64, error) {
	return r.classes, int64(len(r.classes)), r.err
}
func (r reportRepoStub) ClassAttendance(context.Context, uuid.UUID, uuid.UUID, int32, int32) (domain.ClassAttendanceReport, int64, error) {
	return r.class, 1, r.err
}
func (r reportRepoStub) HomeroomReport(context.Context, uuid.UUID, uuid.UUID, int32, int32) (domain.ClassAttendanceReport, int64, error) {
	return r.class, 1, r.err
}
func (r reportRepoStub) Activities(context.Context, int32, int32) ([]domain.Activity, int64, error) {
	return r.activities, int64(len(r.activities)), r.err
}
func (r reportRepoStub) RecordActivity(_ context.Context, actorID uuid.UUID, action, entity string, entityID uuid.UUID) error {
	if r.onAudit != nil {
		r.onAudit(domain.Activity{ActorID: actorID, Action: action, Entity: entity, EntityID: entityID})
	}
	return r.auditErr
}
func (r reportRepoStub) CanAccessSubject(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return r.subjectAccess, r.err
}
func (r reportRepoStub) IsAssignedToClassSubject(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) (bool, error) {
	return r.classAccess, r.err
}
func (r reportRepoStub) IsHomeroomOfStudent(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return r.studentAccess, r.err
}
func (r reportRepoStub) IsHomeroomOfClass(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return r.homeroomAccess, r.err
}

func TestStudentSummaryMapsMissingStudentToNotFound(t *testing.T) {
	user := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}
	repo := reportRepoStub{err: pgx.ErrNoRows}
	_, err := NewAttendanceReportService(repo).StudentSummary(context.Background(), user, uuid.New())
	if err != domain.ErrNotFound {
		t.Fatalf("expected missing student to map to not found, got %v", err)
	}
}

func TestAdminDashboardRejectsNonAdmin(t *testing.T) {
	user := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	_, err := NewAttendanceReportService(reportRepoStub{}).AdminDashboard(context.Background(), user)
	if err != domain.ErrForbidden {
		t.Fatalf("expected non-admin dashboard access to be forbidden, got %v", err)
	}
}

func TestTeacherDashboardRecordsAuditActivity(t *testing.T) {
	user := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	var recorded domain.Activity
	repo := reportRepoStub{onAudit: func(activity domain.Activity) { recorded = activity }}
	_, err := NewAttendanceReportService(repo).TeacherDashboard(context.Background(), user)
	if err != nil {
		t.Fatal(err)
	}
	if recorded.ActorID != user.ID || recorded.Action != "VIEW" || recorded.Entity != "TEACHER_DASHBOARD" || recorded.EntityID != user.ID {
		t.Fatalf("expected teacher dashboard view audit event, got %+v", recorded)
	}
}

func TestTeacherDashboardReturnsAuditFailure(t *testing.T) {
	user := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	auditErr := errors.New("audit storage unavailable")
	_, err := NewAttendanceReportService(reportRepoStub{auditErr: auditErr}).TeacherDashboard(context.Background(), user)
	if !errors.Is(err, auditErr) {
		t.Fatalf("expected audit write error, got %v", err)
	}
}

func TestAttendanceCountsRateUsesEveryRecordedStatus(t *testing.T) {
	got := (domain.AttendanceCounts{Present: 7, Excused: 1, Sick: 1, UnexcusedAbsent: 1}).AttendanceRate()
	if got != 70 {
		t.Fatalf("expected attendance rate 70 from 10 recorded sessions, got %v", got)
	}
}

func TestAttendanceCountsRateIsZeroWhenNoSessionsRecorded(t *testing.T) {
	if got := (domain.AttendanceCounts{}).AttendanceRate(); got != 0 {
		t.Fatalf("expected zero rate with no recorded sessions, got %v", got)
	}
}

func TestStudentSummaryRejectsUnrelatedHomeroomTeacher(t *testing.T) {
	user := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleHomeroomTeacher}}
	repo := reportRepoStub{student: domain.StudentAttendanceSummary{Student: domain.Student{ID: user.ID}}, homeroomAccess: false}
	_, err := NewAttendanceReportService(repo).StudentSummary(context.Background(), user, user.ID)
	if err != domain.ErrForbidden {
		t.Fatalf("expected homeroom teacher without matching class to be forbidden, got %v", err)
	}
}

func TestClassAttendanceRejectsTeacherAssignedToSubjectButNotClass(t *testing.T) {
	user := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	repo := reportRepoStub{subjectAccess: true, classAccess: false}
	_, _, err := NewAttendanceReportService(repo).ClassAttendance(context.Background(), user, uuid.New(), uuid.New(), 1, 20)
	if err != domain.ErrForbidden {
		t.Fatalf("expected teacher without class assignment to be forbidden, got %v", err)
	}
}

func TestSubjectReportRejectsUnassignedTeacher(t *testing.T) {
	teacherID, subjectID := uuid.New(), uuid.New()
	repo := reportRepoStub{subjectAccess: false}
	svc := NewAttendanceReportService(repo)
	user := &domain.User{ID: teacherID, IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	_, _, err := svc.SubjectClasses(context.Background(), user, subjectID, 1, 20)
	if err != domain.ErrForbidden {
		t.Fatalf("expected unassigned teacher to be forbidden, got %v", err)
	}
}
