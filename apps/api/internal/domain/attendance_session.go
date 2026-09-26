package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AttendanceSessionStatus string

const (
	SessionStatusDraft     AttendanceSessionStatus = "DRAFT"
	SessionStatusSubmitted AttendanceSessionStatus = "SUBMITTED"
	SessionStatusReopened  AttendanceSessionStatus = "REOPENED"
)

func (s AttendanceSessionStatus) IsValid() bool {
	switch s {
	case SessionStatusDraft, SessionStatusSubmitted, SessionStatusReopened:
		return true
	default:
		return false
	}
}

type AttendanceRecordItem struct {
	StudentID   uuid.UUID        `json:"student_id"`
	StudentNIS  string           `json:"student_nis"`
	StudentName string           `json:"student_name"`
	Status      AttendanceStatus `json:"status"`
	Remarks     string           `json:"remarks"`
	RecordedAt  time.Time        `json:"recorded_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

type AttendanceSessionDetail struct {
	ID             uuid.UUID               `json:"id"`
	ScheduleID     *uuid.UUID              `json:"schedule_id,omitempty"`
	ClassID        uuid.UUID               `json:"class_id"`
	ClassName      string                  `json:"class_name"`
	SubjectID      uuid.UUID               `json:"subject_id"`
	SubjectName    string                  `json:"subject_name"`
	TeacherID      uuid.UUID               `json:"teacher_id"`
	TeacherName    string                  `json:"teacher_name"`
	HeldAt         time.Time               `json:"held_at"`
	Status         AttendanceSessionStatus `json:"status"`
	Version        int                     `json:"version"`
	SubmittedBy    *uuid.UUID              `json:"submitted_by,omitempty"`
	SubmittedAt    *time.Time              `json:"submitted_at,omitempty"`
	ReopenedBy     *uuid.UUID              `json:"reopened_by,omitempty"`
	ReopenedAt     *time.Time              `json:"reopened_at,omitempty"`
	ReopenReason   *string                 `json:"reopen_reason,omitempty"`
	TotalStudents  int                     `json:"total_students"`
	PresentCount   int                     `json:"present_count"`
	ExcusedCount   int                     `json:"excused_count"`
	SickCount      int                     `json:"sick_count"`
	AbsentCount    int                     `json:"absent_count"`
	Records        []AttendanceRecordItem  `json:"records,omitempty"`
	CreatedAt      time.Time               `json:"created_at"`
	UpdatedAt      time.Time               `json:"updated_at"`
}

type CreateAttendanceSessionInput struct {
	ScheduleID *uuid.UUID `json:"schedule_id,omitempty"`
	ClassID    *uuid.UUID `json:"class_id,omitempty"`
	SubjectID  *uuid.UUID `json:"subject_id,omitempty"`
	Date       string     `json:"date"` // YYYY-MM-DD
}

type RecordUpdateItem struct {
	StudentID uuid.UUID        `json:"student_id"`
	Status    AttendanceStatus `json:"status"`
	Remarks   string           `json:"remarks"`
}

type UpdateAttendanceRecordsInput struct {
	Version int                `json:"version"`
	Records []RecordUpdateItem `json:"records"`
}

type ReopenSessionInput struct {
	Reason string `json:"reason"`
}

type SubmitSessionInput struct {
	Version int `json:"version"`
}

type AttendanceSessionFilter struct {
	ClassID   uuid.UUID
	SubjectID uuid.UUID
	TeacherID uuid.UUID
	Status    string
	Date      string
	FromDate  string
	ToDate    string
	Page      int32
	PerPage   int32
}

type AttendanceSessionRepository interface {
	CreateOrGetFromSchedule(ctx context.Context, scheduleID uuid.UUID, heldAt time.Time, actorID uuid.UUID) (*AttendanceSessionDetail, bool, error)
	CreateOrGetManual(ctx context.Context, classID, subjectID, teacherID uuid.UUID, heldAt time.Time, actorID uuid.UUID) (*AttendanceSessionDetail, bool, error)
	GetByID(ctx context.Context, id uuid.UUID) (*AttendanceSessionDetail, error)
	List(ctx context.Context, filter AttendanceSessionFilter) ([]AttendanceSessionDetail, int64, error)
	UpdateRecords(ctx context.Context, sessionID uuid.UUID, expectedVersion int, records []RecordUpdateItem, actorID uuid.UUID) (*AttendanceSessionDetail, error)
	Submit(ctx context.Context, sessionID uuid.UUID, expectedVersion int, actorID uuid.UUID) (*AttendanceSessionDetail, error)
	Reopen(ctx context.Context, sessionID uuid.UUID, actorID uuid.UUID, reason string) (*AttendanceSessionDetail, error)
	GetScheduleByID(ctx context.Context, scheduleID uuid.UUID) (*Schedule, error)
	CanTeachClassSubject(ctx context.Context, teacherID, classID, subjectID uuid.UUID) (bool, error)
}
