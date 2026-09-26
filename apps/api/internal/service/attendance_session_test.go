package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type mockAttendanceSessionRepo struct {
	sessions  map[uuid.UUID]*domain.AttendanceSessionDetail
	schedules map[uuid.UUID]*domain.Schedule
}

func newMockAttendanceSessionRepo() *mockAttendanceSessionRepo {
	return &mockAttendanceSessionRepo{
		sessions:  make(map[uuid.UUID]*domain.AttendanceSessionDetail),
		schedules: make(map[uuid.UUID]*domain.Schedule),
	}
}

func (m *mockAttendanceSessionRepo) CanTeachClassSubject(_ context.Context, teacherID, classID, subjectID uuid.UUID) (bool, error) {
	for _, schedule := range m.schedules {
		if schedule.TeacherID == teacherID && schedule.ClassID == classID && schedule.SubjectID == subjectID {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockAttendanceSessionRepo) GetScheduleByID(_ context.Context, id uuid.UUID) (*domain.Schedule, error) {
	s, ok := m.schedules[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return s, nil
}

func (m *mockAttendanceSessionRepo) CreateOrGetFromSchedule(_ context.Context, scheduleID uuid.UUID, heldAt time.Time, actorID uuid.UUID) (*domain.AttendanceSessionDetail, bool, error) {
	for _, s := range m.sessions {
		if s.ScheduleID != nil && *s.ScheduleID == scheduleID && s.HeldAt.Format("2006-01-02") == heldAt.Format("2006-01-02") {
			return s, false, nil
		}
	}
	sched := m.schedules[scheduleID]
	sess := &domain.AttendanceSessionDetail{
		ID:          uuid.New(),
		ScheduleID:  &scheduleID,
		ClassID:     sched.ClassID,
		SubjectID:   sched.SubjectID,
		TeacherID:   sched.TeacherID,
		HeldAt:      heldAt,
		Status:      domain.SessionStatusDraft,
		Version:     1,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Records: []domain.AttendanceRecordItem{
			{
				StudentID:  uuid.New(),
				StudentNIS: "1001",
				Status:     domain.AttendancePresent,
			},
		},
	}
	m.sessions[sess.ID] = sess
	return sess, true, nil
}

func (m *mockAttendanceSessionRepo) CreateOrGetManual(_ context.Context, classID, subjectID, teacherID uuid.UUID, heldAt time.Time, _ uuid.UUID) (*domain.AttendanceSessionDetail, bool, error) {
	sess := &domain.AttendanceSessionDetail{
		ID:        uuid.New(),
		ClassID:   classID,
		SubjectID: subjectID,
		TeacherID: teacherID,
		HeldAt:    heldAt,
		Status:    domain.SessionStatusDraft,
		Version:   1,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.sessions[sess.ID] = sess
	return sess, true, nil
}

func (m *mockAttendanceSessionRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	sess, ok := m.sessions[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return sess, nil
}

func (m *mockAttendanceSessionRepo) List(_ context.Context, f domain.AttendanceSessionFilter) ([]domain.AttendanceSessionDetail, int64, error) {
	var list []domain.AttendanceSessionDetail
	for _, s := range m.sessions {
		if f.TeacherID != uuid.Nil && s.TeacherID != f.TeacherID {
			continue
		}
		if f.ClassID != uuid.Nil && s.ClassID != f.ClassID {
			continue
		}
		list = append(list, *s)
	}
	return list, int64(len(list)), nil
}

func (m *mockAttendanceSessionRepo) UpdateRecords(_ context.Context, sessionID uuid.UUID, expectedVersion int, records []domain.RecordUpdateItem, _ uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	sess, ok := m.sessions[sessionID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if sess.Status == domain.SessionStatusSubmitted {
		return nil, domain.ErrSessionLocked
	}
	if expectedVersion > 0 && sess.Version != expectedVersion {
		return nil, domain.ErrSessionVersionMismatch
	}
	sess.Version++
	sess.UpdatedAt = time.Now()
	for _, r := range records {
		for i, existing := range sess.Records {
			if existing.StudentID == r.StudentID {
				sess.Records[i].Status = r.Status
				sess.Records[i].Remarks = r.Remarks
			}
		}
	}
	return sess, nil
}

func (m *mockAttendanceSessionRepo) Submit(_ context.Context, sessionID uuid.UUID, expectedVersion int, actorID uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	sess, ok := m.sessions[sessionID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if sess.Status == domain.SessionStatusSubmitted {
		return nil, domain.ErrSessionLocked
	}
	if expectedVersion > 0 && sess.Version != expectedVersion {
		return nil, domain.ErrSessionVersionMismatch
	}
	sess.Status = domain.SessionStatusSubmitted
	sess.SubmittedBy = &actorID
	now := time.Now()
	sess.SubmittedAt = &now
	sess.Version++
	sess.UpdatedAt = now
	return sess, nil
}

func (m *mockAttendanceSessionRepo) Reopen(_ context.Context, sessionID uuid.UUID, actorID uuid.UUID, reason string) (*domain.AttendanceSessionDetail, error) {
	sess, ok := m.sessions[sessionID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if sess.Status != domain.SessionStatusSubmitted {
		return nil, domain.ErrInvalidSessionStatus
	}
	sess.Status = domain.SessionStatusReopened
	sess.ReopenedBy = &actorID
	now := time.Now()
	sess.ReopenedAt = &now
	sess.ReopenReason = &reason
	sess.Version++
	sess.UpdatedAt = now
	return sess, nil
}

func TestManualAttendanceSessionRequiresClassSubjectAssignment(t *testing.T) {
	ctx := context.Background()
	repo := newMockAttendanceSessionRepo()
	svc := NewAttendanceSessionService(repo)
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	classID, subjectID := uuid.New(), uuid.New()
	input := domain.CreateAttendanceSessionInput{ClassID: &classID, SubjectID: &subjectID, Date: "2026-09-26"}

	if _, _, err := svc.CreateOrGet(ctx, teacher, input); err != domain.ErrForbidden {
		t.Fatalf("expected unassigned teacher to be forbidden, got %v", err)
	}

	scheduleID := uuid.New()
	repo.schedules[scheduleID] = &domain.Schedule{ID: scheduleID, TeacherID: teacher.ID, ClassID: classID, SubjectID: subjectID}
	if _, _, err := svc.CreateOrGet(ctx, teacher, input); err != nil {
		t.Fatalf("expected assigned teacher to create a manual session, got %v", err)
	}
}

func TestAttendanceSessionWorkflow(t *testing.T) {
	ctx := context.Background()
	repo := newMockAttendanceSessionRepo()
	svc := NewAttendanceSessionService(repo)

	teacherID := uuid.New()
	otherTeacherID := uuid.New()
	adminID := uuid.New()

	teacherUser := &domain.User{ID: teacherID, IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	otherTeacher := &domain.User{ID: otherTeacherID, IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	adminUser := &domain.User{ID: adminID, IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}

	schedID := uuid.New()
	classID := uuid.New()
	subjectID := uuid.New()
	repo.schedules[schedID] = &domain.Schedule{
		ID:        schedID,
		TeacherID: teacherID,
		ClassID:   classID,
		SubjectID: subjectID,
	}

	// 1. Other teacher cannot create session for this schedule
	_, _, err := svc.CreateOrGet(ctx, otherTeacher, domain.CreateAttendanceSessionInput{
		ScheduleID: &schedID,
		Date:       "2026-09-26",
	})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for other teacher, got %v", err)
	}

	// 2. Assigned teacher creates session
	sess, created, err := svc.CreateOrGet(ctx, teacherUser, domain.CreateAttendanceSessionInput{
		ScheduleID: &schedID,
		Date:       "2026-09-26",
	})
	if err != nil || !created {
		t.Fatalf("failed to create session: %v", err)
	}
	if sess.Status != domain.SessionStatusDraft || sess.Version != 1 {
		t.Fatalf("expected draft status and version 1, got %v, %d", sess.Status, sess.Version)
	}

	// 3. Idempotent call returns existing session
	sess2, created2, err := svc.CreateOrGet(ctx, teacherUser, domain.CreateAttendanceSessionInput{
		ScheduleID: &schedID,
		Date:       "2026-09-26",
	})
	if err != nil || created2 || sess2.ID != sess.ID {
		t.Fatalf("expected idempotent fetch of existing session, created=%v", created2)
	}

	// 4. Update records
	studentID := sess.Records[0].StudentID
	updated, err := svc.UpdateRecords(ctx, teacherUser, sess.ID, domain.UpdateAttendanceRecordsInput{
		Version: 1,
		Records: []domain.RecordUpdateItem{
			{StudentID: studentID, Status: domain.AttendanceSick, Remarks: "Demam"},
		},
	})
	if err != nil {
		t.Fatalf("failed to update records: %v", err)
	}
	if updated.Version != 2 {
		t.Fatalf("expected version 2, got %d", updated.Version)
	}

	// 5. Version conflict check
	_, err = svc.UpdateRecords(ctx, teacherUser, sess.ID, domain.UpdateAttendanceRecordsInput{
		Version: 1, // outdated
		Records: []domain.RecordUpdateItem{
			{StudentID: studentID, Status: domain.AttendanceExcused},
		},
	})
	if err != domain.ErrSessionVersionMismatch {
		t.Fatalf("expected ErrSessionVersionMismatch, got %v", err)
	}

	// 6. Submit session
	submitted, err := svc.Submit(ctx, teacherUser, sess.ID, domain.SubmitSessionInput{Version: 2})
	if err != nil {
		t.Fatalf("failed to submit session: %v", err)
	}
	if submitted.Status != domain.SessionStatusSubmitted {
		t.Fatalf("expected SUBMITTED status, got %v", submitted.Status)
	}

	// 7. Modifying submitted session is rejected
	_, err = svc.UpdateRecords(ctx, teacherUser, sess.ID, domain.UpdateAttendanceRecordsInput{
		Version: 3,
		Records: []domain.RecordUpdateItem{
			{StudentID: studentID, Status: domain.AttendancePresent},
		},
	})
	if err != domain.ErrSessionLocked {
		t.Fatalf("expected ErrSessionLocked, got %v", err)
	}

	// 8. Reopening requires Super Admin
	_, err = svc.Reopen(ctx, teacherUser, sess.ID, domain.ReopenSessionInput{Reason: "Salah input"})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher reopening, got %v", err)
	}

	// 9. Reopening requires non-empty reason
	_, err = svc.Reopen(ctx, adminUser, sess.ID, domain.ReopenSessionInput{Reason: "  "})
	if err != domain.ErrReopenReasonRequired {
		t.Fatalf("expected ErrReopenReasonRequired, got %v", err)
	}

	// 10. Super Admin successfully reopens
	reopened, err := svc.Reopen(ctx, adminUser, sess.ID, domain.ReopenSessionInput{Reason: "Koreksi absensi"})
	if err != nil {
		t.Fatalf("failed to reopen session: %v", err)
	}
	if reopened.Status != domain.SessionStatusReopened || reopened.ReopenReason == nil || *reopened.ReopenReason != "Koreksi absensi" {
		t.Fatalf("expected REOPENED status with reason, got status=%v", reopened.Status)
	}
}
