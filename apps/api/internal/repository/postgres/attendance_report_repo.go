package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type AttendanceReportRepo struct {
	pool *pgxpool.Pool
}

func NewAttendanceReportRepo(pool *pgxpool.Pool) domain.AttendanceReportRepository {
	return &AttendanceReportRepo{pool: pool}
}

const attendanceCountsExpr = `
	COUNT(*) FILTER (WHERE ar.status = 'PRESENT')::bigint,
	COUNT(*) FILTER (WHERE ar.status = 'EXCUSED')::bigint,
	COUNT(*) FILTER (WHERE ar.status = 'SICK')::bigint,
	COUNT(*) FILTER (WHERE ar.status = 'UNEXCUSED_ABSENT')::bigint,
	COUNT(ar.student_id)::bigint`

func scanCounts(row interface{ Scan(...any) error }, counts *domain.AttendanceCounts) error {
	return row.Scan(&counts.Present, &counts.Excused, &counts.Sick, &counts.UnexcusedAbsent, &counts.Total)
}

func (r *AttendanceReportRepo) AdminDashboard(ctx context.Context) (domain.AdminDashboard, error) {
	result := domain.AdminDashboard{Date: time.Now().Format("2006-01-02")}
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM students WHERE active`).Scan(&result.TotalStudents); err != nil {
		return result, err
	}
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles ro ON ro.role_id=ur.role_id WHERE ro.name IN ('TEACHER','HOMEROOM_TEACHER')`).Scan(&result.TotalTeachers); err != nil {
		return result, err
	}
	query := `SELECT ` + attendanceCountsExpr + ` FROM attendance_records ar JOIN attendance_sessions s ON s.id = ar.session_id WHERE s.held_at::date = CURRENT_DATE`
	err := scanCounts(r.pool.QueryRow(ctx, query), &result.Attendance)
	result.AttendanceRate = result.Attendance.AttendanceRate()
	return result, err
}

func (r *AttendanceReportRepo) TeacherDashboard(ctx context.Context, teacherID uuid.UUID) (domain.TeacherDashboard, error) {
	counts, _, err := r.teacherCounts(ctx, teacherID)
	if err != nil {
		return domain.TeacherDashboard{}, err
	}
	classes, _, err := r.SubjectClasses(ctx, uuid.Nil, teacherID, 1, 10)
	return domain.TeacherDashboard{Attendance: counts, Rate: counts.AttendanceRate(), Classes: classes}, err
}

func (r *AttendanceReportRepo) homeroomClasses(ctx context.Context, teacherID uuid.UUID, limit int32) ([]domain.SubjectClassReport, int64, error) {
	query := `SELECT c.id,c.name,c.homeroom_teacher_id,sub.id,sub.name,` + attendanceCountsExpr + `
		FROM classes c JOIN (SELECT DISTINCT class_id,subject_id FROM teaching_assignments) ta ON ta.class_id=c.id JOIN subjects sub ON sub.id=ta.subject_id LEFT JOIN attendance_sessions s ON s.class_id=c.id AND s.subject_id=sub.id LEFT JOIN attendance_records ar ON ar.session_id=s.id
		WHERE c.homeroom_teacher_id=$1 GROUP BY c.id,sub.id,sub.name ORDER BY c.name,sub.name LIMIT $2`
	rows, err := r.pool.Query(ctx, query, teacherID, limit)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	classes := make([]domain.SubjectClassReport, 0)
	for rows.Next() {
		var report domain.SubjectClassReport
		var subjectID uuid.UUID
		var subjectName string
		if err := rows.Scan(&report.Class.ID, &report.Class.Name, &report.Class.HomeroomTeacherID, &subjectID, &subjectName, &report.Counts.Present, &report.Counts.Excused, &report.Counts.Sick, &report.Counts.UnexcusedAbsent, &report.Counts.Total); err != nil {
			return nil, 0, err
		}
		report.Subject = domain.Subject{ID: subjectID, Name: subjectName}
		report.Rate = report.Counts.AttendanceRate()
		classes = append(classes, report)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM (SELECT DISTINCT c.id,sub.id FROM classes c JOIN teaching_assignments ta ON ta.class_id=c.id JOIN subjects sub ON sub.id=ta.subject_id WHERE c.homeroom_teacher_id=$1) pairs`, teacherID).Scan(&total); err != nil {
		return nil, 0, err
	}
	return classes, total, nil
}

func (r *AttendanceReportRepo) HomeroomDashboard(ctx context.Context, teacherID uuid.UUID) (domain.TeacherDashboard, error) {
	query := `SELECT ` + attendanceCountsExpr + ` FROM attendance_records ar JOIN attendance_sessions s ON s.id = ar.session_id JOIN classes c ON c.id = s.class_id WHERE c.homeroom_teacher_id = $1 AND s.held_at::date = CURRENT_DATE`
	var counts domain.AttendanceCounts
	if err := scanCounts(r.pool.QueryRow(ctx, query, teacherID), &counts); err != nil {
		return domain.TeacherDashboard{}, err
	}
	classes, _, err := r.homeroomClasses(ctx, teacherID, 10)
	return domain.TeacherDashboard{Attendance: counts, Rate: counts.AttendanceRate(), Classes: classes}, err
}

func (r *AttendanceReportRepo) teacherCounts(ctx context.Context, teacherID uuid.UUID) (domain.AttendanceCounts, int64, error) {
	query := `SELECT ` + attendanceCountsExpr + ` FROM attendance_records ar JOIN attendance_sessions s ON s.id = ar.session_id WHERE s.teacher_id=$1 AND s.held_at::date=CURRENT_DATE AND EXISTS (SELECT 1 FROM teaching_assignments ta WHERE ta.class_id=s.class_id AND ta.subject_id=s.subject_id AND ta.teacher_id=s.teacher_id)`
	var counts domain.AttendanceCounts
	err := scanCounts(r.pool.QueryRow(ctx, query, teacherID), &counts)
	return counts, 0, err
}

func (r *AttendanceReportRepo) StudentSummary(ctx context.Context, studentID uuid.UUID) (domain.StudentAttendanceSummary, error) {
	query := `SELECT st.id, st.student_number, st.full_name, st.class_id, st.active,
		COUNT(ar.student_id) FILTER (WHERE ar.status = 'PRESENT')::bigint,
		COUNT(ar.student_id) FILTER (WHERE ar.status = 'EXCUSED')::bigint,
		COUNT(ar.student_id) FILTER (WHERE ar.status = 'SICK')::bigint,
		COUNT(ar.student_id) FILTER (WHERE ar.status = 'UNEXCUSED_ABSENT')::bigint,
		COUNT(ar.student_id)::bigint
		FROM students st LEFT JOIN attendance_records ar ON ar.student_id = st.id LEFT JOIN attendance_sessions s ON s.id = ar.session_id
		WHERE st.id=$1 GROUP BY st.id`
	var result domain.StudentAttendanceSummary
	err := r.pool.QueryRow(ctx, query, studentID).Scan(&result.Student.ID, &result.Student.Number, &result.Student.FullName, &result.Student.ClassID, &result.Student.Active, &result.Counts.Present, &result.Counts.Excused, &result.Counts.Sick, &result.Counts.UnexcusedAbsent, &result.Counts.Total)
	result.Rate = result.Counts.AttendanceRate()
	return result, err
}

func (r *AttendanceReportRepo) SubjectClasses(ctx context.Context, subjectID, teacherID uuid.UUID, page, perPage int32) ([]domain.SubjectClassReport, int64, error) {
	const base = ` FROM classes c JOIN subjects sub ON ($1::uuid IS NULL OR sub.id=$1) AND EXISTS (SELECT 1 FROM teaching_assignments ta WHERE ta.class_id=c.id AND ta.subject_id=sub.id AND ($2::uuid IS NULL OR ta.teacher_id=$2)) LEFT JOIN attendance_sessions s ON s.class_id=c.id AND s.subject_id=sub.id AND ($2::uuid IS NULL OR s.teacher_id=$2) LEFT JOIN attendance_records ar ON ar.session_id=s.id`
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM (SELECT DISTINCT c.id, sub.id`+base+`) scoped_classes`, nullableUUID(subjectID), nullableUUID(teacherID)).Scan(&total); err != nil {
		return nil, 0, err
	}
	query := `SELECT c.id,c.name,c.homeroom_teacher_id,sub.id,sub.name,` + attendanceCountsExpr + base + ` GROUP BY c.id, sub.id, sub.name ORDER BY c.name,sub.name LIMIT $3 OFFSET $4`
	rows, err := r.pool.Query(ctx, query, nullableUUID(subjectID), nullableUUID(teacherID), perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var reports []domain.SubjectClassReport
	for rows.Next() {
		var report domain.SubjectClassReport
		if err := rows.Scan(&report.Class.ID, &report.Class.Name, &report.Class.HomeroomTeacherID, &report.Subject.ID, &report.Subject.Name, &report.Counts.Present, &report.Counts.Excused, &report.Counts.Sick, &report.Counts.UnexcusedAbsent, &report.Counts.Total); err != nil {
			return nil, 0, err
		}
		report.Rate = report.Counts.AttendanceRate()
		reports = append(reports, report)
	}
	return reports, total, rows.Err()
}

func nullableUUID(id uuid.UUID) any {
	if id == uuid.Nil {
		return nil
	}
	return id
}

func (r *AttendanceReportRepo) ClassAttendance(ctx context.Context, classID, subjectID uuid.UUID, page, perPage int32) (domain.ClassAttendanceReport, int64, error) {
	return r.classReport(ctx, classID, &subjectID, page, perPage)
}

func (r *AttendanceReportRepo) HomeroomReport(ctx context.Context, classID, teacherID uuid.UUID, page, perPage int32) (domain.ClassAttendanceReport, int64, error) {
	if teacherID != uuid.Nil {
		allowed, err := r.IsHomeroomOfClass(ctx, teacherID, classID)
		if err != nil {
			return domain.ClassAttendanceReport{}, 0, err
		}
		if !allowed {
			return domain.ClassAttendanceReport{}, 0, domain.ErrForbidden
		}
	}
	return r.classReport(ctx, classID, nil, page, perPage)
}

func (r *AttendanceReportRepo) classReport(ctx context.Context, classID uuid.UUID, subjectID *uuid.UUID, page, perPage int32) (domain.ClassAttendanceReport, int64, error) {
	var result domain.ClassAttendanceReport
	if err := r.pool.QueryRow(ctx, `SELECT id,name,homeroom_teacher_id FROM classes WHERE id=$1`, classID).Scan(&result.Class.ID, &result.Class.Name, &result.Class.HomeroomTeacherID); err != nil {
		return result, 0, err
	}
	filter := `s.class_id=$1 AND ($2::uuid IS NULL OR s.subject_id=$2)`
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT st.id) FROM students st WHERE st.class_id=$1`, classID).Scan(&total); err != nil {
		return result, 0, err
	}
	query := `SELECT ` + attendanceCountsExpr + ` FROM attendance_records ar JOIN attendance_sessions s ON s.id=ar.session_id WHERE ` + filter
	if err := scanCounts(r.pool.QueryRow(ctx, query, classID, subjectID), &result.Counts); err != nil {
		return result, 0, err
	}
	result.Rate = result.Counts.AttendanceRate()
	query = `SELECT st.id,st.student_number,st.full_name,st.class_id,st.active,
		COUNT(ar.student_id) FILTER (WHERE s.id IS NOT NULL AND ar.status = 'PRESENT')::bigint,
		COUNT(ar.student_id) FILTER (WHERE s.id IS NOT NULL AND ar.status = 'EXCUSED')::bigint,
		COUNT(ar.student_id) FILTER (WHERE s.id IS NOT NULL AND ar.status = 'SICK')::bigint,
		COUNT(ar.student_id) FILTER (WHERE s.id IS NOT NULL AND ar.status = 'UNEXCUSED_ABSENT')::bigint,
		COUNT(s.id)::bigint
		FROM students st LEFT JOIN attendance_records ar ON ar.student_id=st.id LEFT JOIN attendance_sessions s ON s.id=ar.session_id AND s.class_id=$1 AND ($2::uuid IS NULL OR s.subject_id=$2)
		WHERE st.class_id=$1 AND ($2::uuid IS NULL OR s.id IS NOT NULL) GROUP BY st.id ORDER BY st.full_name LIMIT $3 OFFSET $4`
	rows, err := r.pool.Query(ctx, query, classID, subjectID, perPage, (page-1)*perPage)
	if err != nil {
		return result, 0, err
	}
	defer rows.Close()
	for rows.Next() {
		var item domain.StudentAttendanceSummary
		if err := rows.Scan(&item.Student.ID, &item.Student.Number, &item.Student.FullName, &item.Student.ClassID, &item.Student.Active, &item.Counts.Present, &item.Counts.Excused, &item.Counts.Sick, &item.Counts.UnexcusedAbsent, &item.Counts.Total); err != nil {
			return result, 0, err
		}
		item.Rate = item.Counts.AttendanceRate()
		result.Students = append(result.Students, item)
	}
	if subjectID != nil {
		var subject domain.Subject
		if err := r.pool.QueryRow(ctx, `SELECT id,name FROM subjects WHERE id=$1`, *subjectID).Scan(&subject.ID, &subject.Name); err != nil {
			return result, 0, err
		}
		result.Subject = &subject
	}
	return result, total, rows.Err()
}

func (r *AttendanceReportRepo) CanAccessSubject(ctx context.Context, teacherID, subjectID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM teaching_assignments WHERE teacher_id=$1 AND subject_id=$2 AND active)`, teacherID, subjectID).Scan(&exists)
	return exists, err
}

func (r *AttendanceReportRepo) IsAssignedToClassSubject(ctx context.Context, teacherID, classID, subjectID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM teaching_assignments WHERE teacher_id=$1 AND class_id=$2 AND subject_id=$3 AND active)`, teacherID, classID, subjectID).Scan(&exists)
	return exists, err
}

func (r *AttendanceReportRepo) IsHomeroomOfStudent(ctx context.Context, teacherID, studentID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM students st JOIN classes c ON c.id=st.class_id WHERE st.id=$1 AND c.homeroom_teacher_id=$2)`, studentID, teacherID).Scan(&exists)
	return exists, err
}

func (r *AttendanceReportRepo) IsHomeroomOfClass(ctx context.Context, teacherID, classID uuid.UUID) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM classes WHERE id=$1 AND homeroom_teacher_id=$2)`, classID, teacherID).Scan(&exists)
	return exists, err
}

func (r *AttendanceReportRepo) RecordActivity(ctx context.Context, actorID uuid.UUID, action, entity string, entityID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, $2, $3, $4)`, actorID, action, entity, entityID)
	return err
}

func (r *AttendanceReportRepo) Activities(ctx context.Context, page, perPage int32) ([]domain.Activity, int64, error) {
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_events`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT id,actor_id,action,entity,entity_id,created_at FROM audit_events ORDER BY created_at DESC LIMIT $1 OFFSET $2`, perPage, (page-1)*perPage)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var activities []domain.Activity
	for rows.Next() {
		var a domain.Activity
		if err := rows.Scan(&a.ID, &a.ActorID, &a.Action, &a.Entity, &a.EntityID, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		activities = append(activities, a)
	}
	return activities, total, rows.Err()
}
