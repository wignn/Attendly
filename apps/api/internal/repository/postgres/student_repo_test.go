package postgres

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

// These tests require a disposable database with migrations 000001–000007 applied.
func studentTestDB(t *testing.T) (*pgxpool.Pool, context.Context, uuid.UUID, []uuid.UUID) {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is unset")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect TEST_DATABASE_URL: %v", err)
	}
	t.Cleanup(pool.Close)
	actor := uuid.New()
	if _, err := pool.Exec(ctx, `INSERT INTO users (id,email,password,name) VALUES ($1,$2,'test','Student repo test')`, actor, "student-repo-"+actor.String()+"@example.test"); err != nil {
		t.Fatalf("create test actor: %v", err)
	}
	classIDs := []uuid.UUID{uuid.New(), uuid.New(), uuid.New()}
	for i, id := range classIDs {
		if _, err := pool.Exec(ctx, `INSERT INTO classes (id,name) VALUES ($1,$2)`, id, fmt.Sprintf("student-repo-%s-class-%d", actor, i)); err != nil {
			t.Fatalf("create class: %v", err)
		}
	}
	t.Cleanup(func() {
		studentPrefix := "student-repo-" + actor.String() + "-%"
		var studentIDs []uuid.UUID
		rows, err := pool.Query(ctx, `SELECT id FROM students WHERE full_name LIKE $1`, studentPrefix)
		if err != nil {
			t.Errorf("find fixture students for cleanup: %v", err)
			return
		}
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err != nil {
				t.Errorf("scan fixture student for cleanup: %v", err)
				rows.Close()
				return
			}
			studentIDs = append(studentIDs, id)
		}
		if err := rows.Err(); err != nil {
			t.Errorf("read fixture students for cleanup: %v", err)
			rows.Close()
			return
		}
		rows.Close()
		runCleanup := func(label, query string, args ...any) {
			if _, err := pool.Exec(ctx, query, args...); err != nil {
				t.Errorf("cleanup %s: %v", label, err)
			}
		}
		if len(studentIDs) > 0 {
			runCleanup("student attendance", `DELETE FROM attendance_records WHERE student_id=ANY($1::uuid[])`, studentIDs)
			runCleanup("student enrollments", `DELETE FROM student_enrollments WHERE student_id=ANY($1::uuid[])`, studentIDs)
			runCleanup("student audit", `DELETE FROM audit_events WHERE entity_id=ANY($1::uuid[])`, studentIDs)
			runCleanup("students", `DELETE FROM students WHERE id=ANY($1::uuid[])`, studentIDs)
		}
		runCleanup("actor audit", `DELETE FROM audit_events WHERE actor_id=$1`, actor)
		runCleanup("actor sessions", `DELETE FROM attendance_sessions WHERE teacher_id=$1`, actor)
		runCleanup("classes", `DELETE FROM classes WHERE id = ANY($1::uuid[])`, classIDs)
		runCleanup("actor", `DELETE FROM users WHERE id=$1`, actor)
	})
	return pool, ctx, actor, classIDs
}

func newStudentRecord(actor, classID uuid.UUID, suffix, name string) domain.StudentRecord {
	return domain.StudentRecord{ID: uuid.New(), NIS: "r" + strings.ReplaceAll(actor.String(), "-", "") + "-" + suffix, FullName: "student-repo-" + actor.String() + "-" + name, CurrentClassID: classID, Active: true}
}

func TestStudentPageOffsetUsesInt64(t *testing.T) {
	got := studentPageOffset(2147483647, 100)
	want := (int64(2147483647) - 1) * 100
	if got != want || got <= int64(^uint32(0)>>1) {
		t.Fatalf("offset = %d, want int64 %d", got, want)
	}
}

func TestStudentRepoListFiltersSortsAndPaginates(t *testing.T) {
	pool, ctx, actor, classes := studentTestDB(t)
	repo := NewStudentRepo(pool)
	first := newStudentRecord(actor, classes[0], "list-a", "Alpha")
	second := newStudentRecord(actor, classes[1], "list-b", "Bravo")
	third := newStudentRecord(actor, classes[0], "list-c", "Charlie")
	for i, item := range []domain.StudentRecord{first, second, third} {
		if i == 1 {
			item.Active = false
		}
		if _, err := repo.Create(ctx, item, time.Now(), actor); err != nil {
			t.Fatalf("create student: %v", err)
		}
	}
	active := true
	got, total, err := repo.List(ctx, domain.StudentListFilter{Search: "student-repo-" + actor.String(), ClassID: &classes[0], Active: &active, SortBy: "full_name", SortOrder: "desc", Page: 1, PerPage: 1})
	if err != nil {
		t.Fatal(err)
	}
	if total != 2 || len(got) != 1 || got[0].ID != third.ID {
		t.Fatalf("filtered page = %#v, total %d; want Charlie and total 2", got, total)
	}
	got, total, err = repo.List(ctx, domain.StudentListFilter{Search: first.NIS, SortBy: "nis", SortOrder: "asc", Page: 1, PerPage: 10})
	if err != nil || total != 1 || len(got) != 1 || got[0].ID != first.ID {
		t.Fatalf("search result = %#v, total %d, err %v", got, total, err)
	}
}

func TestStudentRepoMapsDuplicateNISAndNISN(t *testing.T) {
	pool, ctx, actor, classes := studentTestDB(t)
	repo := NewStudentRepo(pool)
	first := newStudentRecord(actor, classes[0], "dup-a", "Duplicate A")
	nisn := "nisn-" + actor.String()
	first.NISN = &nisn
	if _, err := repo.Create(ctx, first, time.Now(), actor); err != nil {
		t.Fatal(err)
	}
	duplicateNIS := newStudentRecord(actor, classes[0], "dup-x", "Duplicate NIS")
	duplicateNIS.NIS = first.NIS
	if _, err := repo.Create(ctx, duplicateNIS, time.Now(), actor); !errors.Is(err, domain.ErrDuplicateNIS) {
		t.Fatalf("duplicate NIS error = %v", err)
	}
	duplicateNISN := newStudentRecord(actor, classes[0], "dup-c", "Duplicate NISN")
	duplicateNISN.NISN = &nisn
	if _, err := repo.Create(ctx, duplicateNISN, time.Now(), actor); !errors.Is(err, domain.ErrDuplicateNISN) {
		t.Fatalf("duplicate NISN error = %v", err)
	}
}

func TestStudentRepoPatchUpdatePreservesOmittedFields(t *testing.T) {
	pool, ctx, actor, classes := studentTestDB(t)
	repo := NewStudentRepo(pool)
	student := newStudentRecord(actor, classes[0], "patch", "Patch")
	student.NISN = ptrString("kept-nisn")
	if _, err := repo.Create(ctx, student, time.Now(), actor); err != nil {
		t.Fatal(err)
	}
	newNIS := "updated-nis"
	got, err := repo.Update(ctx, student.ID, domain.StudentUpdate{NIS: &newNIS}, actor)
	if err != nil {
		t.Fatal(err)
	}
	if got.NIS != newNIS || got.NISN == nil || *got.NISN != "kept-nisn" || got.FullName != student.FullName || !got.Active {
		t.Fatalf("partial NIS update changed omitted fields: %+v", got)
	}
	newName := "Updated independent field"
	got, err = repo.Update(ctx, student.ID, domain.StudentUpdate{FullName: &newName}, actor)
	if err != nil {
		t.Fatal(err)
	}
	if got.NIS != newNIS || got.FullName != newName || got.NISN == nil || *got.NISN != "kept-nisn" {
		t.Fatalf("partial name update reset other fields: %+v", got)
	}
}

func ptrString(value string) *string { return &value }

func TestStudentRepoEnrollmentHistoryChronological(t *testing.T) {
	pool, ctx, actor, classes := studentTestDB(t)
	repo := NewStudentRepo(pool)
	student := newStudentRecord(actor, classes[0], "history", "History")
	if _, err := repo.Create(ctx, student, time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), actor); err != nil {
		t.Fatal(err)
	}
	for i, classID := range classes[1:] {
		date := time.Date(2026, time.Month(i+2), 1, 0, 0, 0, 0, time.UTC)
		if _, err := repo.Transfer(ctx, student.ID, classID, date, actor); err != nil {
			t.Fatal(err)
		}
	}
	history, err := repo.Enrollments(ctx, student.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(history) != 3 || history[0].ClassID != classes[0] || history[1].ClassID != classes[1] || history[2].ClassID != classes[2] {
		t.Fatalf("history class order = %#v", history)
	}
}

func TestStudentRepoTransferRollsBackWhenClassDoesNotExist(t *testing.T) {
	pool, ctx, actor, classes := studentTestDB(t)
	repo := NewStudentRepo(pool)
	student := newStudentRecord(actor, classes[0], "rollback", "Rollback")
	if _, err := repo.Create(ctx, student, time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), actor); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Transfer(ctx, student.ID, uuid.New(), time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC), actor); err == nil {
		t.Fatal("Transfer succeeded with missing class")
	}
	got, err := repo.Get(ctx, student.ID, false)
	if err != nil || got.CurrentClassID != classes[0] {
		t.Fatalf("current class after rollback = %v, err %v", got.CurrentClassID, err)
	}
	history, err := repo.Enrollments(ctx, student.ID)
	if err != nil || len(history) != 1 || history[0].ValidTo != nil {
		t.Fatalf("history after rollback = %#v, err %v", history, err)
	}
}

func TestStudentRepoSoftDeletePreservesAttendance(t *testing.T) {
	pool, ctx, actor, classes := studentTestDB(t)
	repo := NewStudentRepo(pool)
	student := newStudentRecord(actor, classes[0], "attendance", "Attendance")
	if _, err := repo.Create(ctx, student, time.Now(), actor); err != nil {
		t.Fatal(err)
	}
	var subjectID uuid.UUID
	if err := pool.QueryRow(ctx, `INSERT INTO subjects (name) VALUES ($1) RETURNING id`, "student-repo-"+actor.String()+"-subject").Scan(&subjectID); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = pool.Exec(ctx, `DELETE FROM attendance_sessions WHERE subject_id=$1`, subjectID)
		_, _ = pool.Exec(ctx, `DELETE FROM subjects WHERE id=$1`, subjectID)
	})
	var sessionID uuid.UUID
	if err := pool.QueryRow(ctx, `INSERT INTO attendance_sessions (class_id,subject_id,teacher_id,held_at) VALUES ($1,$2,$3,NOW()) RETURNING id`, classes[0], subjectID, actor).Scan(&sessionID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO attendance_records (session_id,student_id,status) VALUES ($1,$2,'PRESENT')`, sessionID, student.ID); err != nil {
		t.Fatal(err)
	}
	if err := repo.SoftDelete(ctx, student.ID, actor); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM attendance_records WHERE session_id=$1 AND student_id=$2`, sessionID, student.ID).Scan(&count); err != nil || count != 1 {
		t.Fatalf("attendance count = %d, err %v", count, err)
	}
	if _, err := repo.Get(ctx, student.ID, false); !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("Get deleted student error = %v", err)
	}
	if _, err := repo.Get(ctx, student.ID, true); err != nil {
		t.Fatalf("includeDeleted Get error = %v", err)
	}
}
