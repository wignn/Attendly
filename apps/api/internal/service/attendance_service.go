package service

import (
	"context"
	"time"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/google/uuid"
)


type AttendanceService struct {
	attendance    domain.AttendanceRepository
	classSubjects domain.ClassSubjectRepository
}

func NewAttendanceService(
	attendance domain.AttendanceRepository,
	classSubjects domain.ClassSubjectRepository,
) *AttendanceService {
	return &AttendanceService{
		attendance:    attendance,
		classSubjects: classSubjects,
	}
}

type RecordInput struct {
	StudentID uuid.UUID
	Status    domain.AttendanceStatus
	Note      string
}

func (s *AttendanceService) CreateSession(ctx context.Context, classSubjectID uuid.UUID, date time.Time, topic string, createdBy *uuid.UUID) (*domain.AttendanceSession, error) {
	if _, err := s.classSubjects.GetByID(ctx, classSubjectID); err != nil {
		return nil, err
	}

	now := time.Now()
	session := &domain.AttendanceSession{
		ID:             uuid.New(),
		ClassSubjectID: classSubjectID,
		SessionDate:    date,
		Topic:          topic,
		CreatedBy:      createdBy,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if err := s.attendance.CreateSession(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *AttendanceService) GetSession(ctx context.Context, id uuid.UUID) (*domain.AttendanceSession, error) {
	session, err := s.attendance.GetSessionByID(ctx, id)
	if err != nil {
		return nil, err
	}
	records, err := s.attendance.ListRecordsBySession(ctx, id)
	if err != nil {
		return nil, err
	}
	session.Records = records
	return session, nil
}

func (s *AttendanceService) ListSessions(ctx context.Context, classSubjectID uuid.UUID) ([]*domain.AttendanceSession, error) {
	return s.attendance.ListSessionsByClassSubject(ctx, classSubjectID)
}

func (s *AttendanceService) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return s.attendance.DeleteSession(ctx, id)
}

func (s *AttendanceService) MarkAttendance(ctx context.Context, sessionID uuid.UUID, inputs []RecordInput) ([]*domain.AttendanceRecord, error) {
	if _, err := s.attendance.GetSessionByID(ctx, sessionID); err != nil {
		return nil, err
	}

	records := make([]*domain.AttendanceRecord, 0, len(inputs))
	for _, in := range inputs {
		status := in.Status
		if status == "" {
			status = domain.AttendancePresent
		}
		if !status.IsValid() {
			return nil, domain.ErrValidation
		}
		records = append(records, &domain.AttendanceRecord{
			SessionID: sessionID,
			StudentID: in.StudentID,
			Status:    status,
			Note:      in.Note,
		})
	}

	if err := s.attendance.UpsertRecords(ctx, sessionID, records); err != nil {
		return nil, err
	}
	return s.attendance.ListRecordsBySession(ctx, sessionID)
}

func (s *AttendanceService) Summary(ctx context.Context, classSubjectID uuid.UUID) ([]*domain.AttendanceSummary, error) {
	return s.attendance.SummaryByClassSubject(ctx, classSubjectID)
}
