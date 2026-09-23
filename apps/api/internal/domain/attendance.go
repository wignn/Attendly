package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AttendanceStatus string

const (
	AttendancePresent AttendanceStatus = "PRESENT"
	AttendanceAbsent  AttendanceStatus = "ABSENT"
	AttendanceLate    AttendanceStatus = "LATE"
	AttendanceSick    AttendanceStatus = "SICK"
	AttendanceExcused AttendanceStatus = "EXCUSED"
)

func (s AttendanceStatus) IsValid() bool {
	switch s {
	case AttendancePresent, AttendanceAbsent, AttendanceLate, AttendanceSick, AttendanceExcused:
		return true
	default:
		return false
	}
}

type AttendanceSession struct {
	ID             uuid.UUID  `json:"id"`
	ClassSubjectID uuid.UUID  `json:"class_subject_id"`
	SessionDate    time.Time  `json:"session_date"`
	Topic          string     `json:"topic"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	Records []*AttendanceRecord `json:"records,omitempty"`
}

type AttendanceRecord struct {
	ID        uuid.UUID        `json:"id"`
	SessionID uuid.UUID        `json:"session_id"`
	StudentID uuid.UUID        `json:"student_id"`
	Status    AttendanceStatus `json:"status"`
	Note      string           `json:"note"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	StudentName string `json:"student_name,omitempty"`
	StudentNIS  string `json:"student_nis,omitempty"`
}

type AttendanceSummary struct {
	StudentID   uuid.UUID `json:"student_id"`
	StudentName string    `json:"student_name"`
	Present     int64     `json:"present"`
	Absent      int64     `json:"absent"`
	Late        int64     `json:"late"`
	Sick        int64     `json:"sick"`
	Excused     int64     `json:"excused"`
	Total       int64     `json:"total"`
}

type AttendanceRepository interface {
	CreateSession(ctx context.Context, s *AttendanceSession) error
	GetSessionByID(ctx context.Context, id uuid.UUID) (*AttendanceSession, error)
	ListSessionsByClassSubject(ctx context.Context, classSubjectID uuid.UUID) ([]*AttendanceSession, error)
	DeleteSession(ctx context.Context, id uuid.UUID) error
	UpsertRecords(ctx context.Context, sessionID uuid.UUID, records []*AttendanceRecord) error
	ListRecordsBySession(ctx context.Context, sessionID uuid.UUID) ([]*AttendanceRecord, error)
	SummaryByClassSubject(ctx context.Context, classSubjectID uuid.UUID) ([]*AttendanceSummary, error)
}
