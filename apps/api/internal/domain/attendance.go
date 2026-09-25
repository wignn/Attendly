package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AttendanceStatus string

const (
	AttendancePresent         AttendanceStatus = "PRESENT"
	AttendanceExcused         AttendanceStatus = "EXCUSED"
	AttendanceSick            AttendanceStatus = "SICK"
	AttendanceUnexcusedAbsent AttendanceStatus = "UNEXCUSED_ABSENT"
)

func (s AttendanceStatus) IsValid() bool {
	switch s {
	case AttendancePresent, AttendanceExcused, AttendanceSick, AttendanceUnexcusedAbsent:
		return true
	default:
		return false
	}
}

type AttendanceCounts struct {
	Present         int64 `json:"present"`
	Excused         int64 `json:"excused"`
	Sick            int64 `json:"sick"`
	UnexcusedAbsent int64 `json:"unexcused_absent"`
	Total           int64 `json:"total_recorded_sessions"`
}

func (c AttendanceCounts) RecordedSessions() int64 {
	return c.Present + c.Excused + c.Sick + c.UnexcusedAbsent
}

func (c AttendanceCounts) AttendanceRate() float64 {
	total := c.RecordedSessions()
	if total == 0 {
		return 0
	}
	return float64(c.Present) / float64(total) * 100
}

type Student struct {
	ID       uuid.UUID `json:"id"`
	Number   string    `json:"student_number"`
	FullName string    `json:"full_name"`
	ClassID  uuid.UUID `json:"class_id"`
	Active   bool      `json:"active"`
}

type SchoolClass struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	HomeroomTeacherID uuid.UUID `json:"homeroom_teacher_id"`
}

type Subject struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type TeachingAssignment struct {
	ID        uuid.UUID `json:"id"`
	TeacherID uuid.UUID `json:"teacher_id"`
	ClassID   uuid.UUID `json:"class_id"`
	SubjectID uuid.UUID `json:"subject_id"`
}

type AttendanceSession struct {
	ID        uuid.UUID `json:"id"`
	ClassID   uuid.UUID `json:"class_id"`
	SubjectID uuid.UUID `json:"subject_id"`
	TeacherID uuid.UUID `json:"teacher_id"`
	HeldAt    time.Time `json:"held_at"`
}

type AttendanceRecord struct {
	SessionID uuid.UUID        `json:"session_id"`
	StudentID uuid.UUID        `json:"student_id"`
	Status    AttendanceStatus `json:"status"`
}

type StudentAttendanceSummary struct {
	Student Student          `json:"student"`
	Counts  AttendanceCounts `json:"counts"`
	Rate    float64          `json:"attendance_rate"`
}

type SubjectClassReport struct {
	Class  SchoolClass      `json:"class"`
	Counts AttendanceCounts `json:"counts"`
	Rate   float64          `json:"attendance_rate"`
}

type ClassAttendanceReport struct {
	Class    SchoolClass                `json:"class"`
	Subject  *Subject                   `json:"subject,omitempty"`
	Counts   AttendanceCounts           `json:"counts"`
	Rate     float64                    `json:"attendance_rate"`
	Students []StudentAttendanceSummary `json:"students"`
}

type AdminDashboard struct {
	Date           string           `json:"date"`
	TotalStudents  int64            `json:"total_students"`
	TotalTeachers  int64            `json:"total_teachers"`
	Attendance     AttendanceCounts `json:"attendance"`
	AttendanceRate float64          `json:"attendance_rate_today"`
}

type TeacherDashboard struct {
	Attendance AttendanceCounts     `json:"attendance"`
	Rate       float64              `json:"attendance_rate"`
	Classes    []SubjectClassReport `json:"classes"`
}

type Activity struct {
	ID        uuid.UUID `json:"id"`
	ActorID   uuid.UUID `json:"actor_id"`
	Action    string    `json:"action"`
	Entity    string    `json:"entity"`
	EntityID  uuid.UUID `json:"entity_id"`
	CreatedAt time.Time `json:"created_at"`
}

type AttendanceReportRepository interface {
	AdminDashboard(context.Context) (AdminDashboard, error)
	TeacherDashboard(context.Context, uuid.UUID) (TeacherDashboard, error)
	HomeroomDashboard(context.Context, uuid.UUID) (TeacherDashboard, error)
	StudentSummary(context.Context, uuid.UUID) (StudentAttendanceSummary, error)
	SubjectClasses(context.Context, uuid.UUID, uuid.UUID, int32, int32) ([]SubjectClassReport, int64, error)
	ClassAttendance(context.Context, uuid.UUID, uuid.UUID, int32, int32) (ClassAttendanceReport, int64, error)
	HomeroomReport(context.Context, uuid.UUID, uuid.UUID, int32, int32) (ClassAttendanceReport, int64, error)
	Activities(context.Context, int32, int32) ([]Activity, int64, error)
	CanAccessSubject(context.Context, uuid.UUID, uuid.UUID) (bool, error)
	IsAssignedToClassSubject(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) (bool, error)
	IsHomeroomOfStudent(context.Context, uuid.UUID, uuid.UUID) (bool, error)
	IsHomeroomOfClass(context.Context, uuid.UUID, uuid.UUID) (bool, error)
}
