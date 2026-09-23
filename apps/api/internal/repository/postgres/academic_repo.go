package postgres

import (
	"context"
	"errors"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ClassRepo struct {
	pool *pgxpool.Pool
}

func NewClassRepo(pool *pgxpool.Pool) domain.ClassRepository {
	return &ClassRepo{pool: pool}
}

func (r *ClassRepo) Create(ctx context.Context, c *domain.Class) error {
	query := `
		INSERT INTO classes (id, name, grade_level, academic_year, homeroom_teacher_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.pool.Exec(ctx, query, c.ID, c.Name, c.GradeLevel, c.AcademicYear, c.HomeroomTeacherID, c.CreatedAt, c.UpdatedAt)
	return err
}

func (r *ClassRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Class, error) {
	query := `SELECT id, name, grade_level, academic_year, homeroom_teacher_id, created_at, updated_at FROM classes WHERE id = $1`
	var c domain.Class
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.Name, &c.GradeLevel, &c.AcademicYear, &c.HomeroomTeacherID, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &c, nil
}

func (r *ClassRepo) List(ctx context.Context, offset, limit int32) ([]*domain.Class, int64, error) {
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM classes`).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, name, grade_level, academic_year, homeroom_teacher_id, created_at, updated_at
		FROM classes ORDER BY academic_year DESC, name ASC LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var classes []*domain.Class
	for rows.Next() {
		var c domain.Class
		if err := rows.Scan(&c.ID, &c.Name, &c.GradeLevel, &c.AcademicYear, &c.HomeroomTeacherID, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, 0, err
		}
		classes = append(classes, &c)
	}
	return classes, total, rows.Err()
}

func (r *ClassRepo) Update(ctx context.Context, c *domain.Class) error {
	query := `UPDATE classes SET name = $2, grade_level = $3, academic_year = $4, homeroom_teacher_id = $5, updated_at = NOW() WHERE id = $1`
	ct, err := r.pool.Exec(ctx, query, c.ID, c.Name, c.GradeLevel, c.AcademicYear, c.HomeroomTeacherID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *ClassRepo) Delete(ctx context.Context, id uuid.UUID) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM classes WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type SubjectRepo struct {
	pool *pgxpool.Pool
}

func NewSubjectRepo(pool *pgxpool.Pool) domain.SubjectRepository {
	return &SubjectRepo{pool: pool}
}

func (r *SubjectRepo) Create(ctx context.Context, s *domain.Subject) error {
	query := `INSERT INTO subjects (id, code, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.pool.Exec(ctx, query, s.ID, s.Code, s.Name, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *SubjectRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Subject, error) {
	return r.scanOne(ctx, `SELECT id, code, name, created_at, updated_at FROM subjects WHERE id = $1`, id)
}

func (r *SubjectRepo) GetByCode(ctx context.Context, code string) (*domain.Subject, error) {
	return r.scanOne(ctx, `SELECT id, code, name, created_at, updated_at FROM subjects WHERE code = $1`, code)
}

func (r *SubjectRepo) scanOne(ctx context.Context, query string, arg any) (*domain.Subject, error) {
	var s domain.Subject
	err := r.pool.QueryRow(ctx, query, arg).Scan(&s.ID, &s.Code, &s.Name, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *SubjectRepo) List(ctx context.Context, offset, limit int32) ([]*domain.Subject, int64, error) {
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM subjects`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `SELECT id, code, name, created_at, updated_at FROM subjects ORDER BY name ASC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var subjects []*domain.Subject
	for rows.Next() {
		var s domain.Subject
		if err := rows.Scan(&s.ID, &s.Code, &s.Name, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, 0, err
		}
		subjects = append(subjects, &s)
	}
	return subjects, total, rows.Err()
}

func (r *SubjectRepo) Update(ctx context.Context, s *domain.Subject) error {
	ct, err := r.pool.Exec(ctx, `UPDATE subjects SET code = $2, name = $3, updated_at = NOW() WHERE id = $1`, s.ID, s.Code, s.Name)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *SubjectRepo) Delete(ctx context.Context, id uuid.UUID) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM subjects WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}


type StudentRepo struct {
	pool *pgxpool.Pool
}

func NewStudentRepo(pool *pgxpool.Pool) domain.StudentRepository {
	return &StudentRepo{pool: pool}
}

const studentCols = `id, user_id, class_id, nis, full_name, created_at, updated_at`

func scanStudent(row pgx.Row) (*domain.Student, error) {
	var s domain.Student
	err := row.Scan(&s.ID, &s.UserID, &s.ClassID, &s.NIS, &s.FullName, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *StudentRepo) Create(ctx context.Context, s *domain.Student) error {
	query := `INSERT INTO students (id, user_id, class_id, nis, full_name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.pool.Exec(ctx, query, s.ID, s.UserID, s.ClassID, s.NIS, s.FullName, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *StudentRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Student, error) {
	return scanStudent(r.pool.QueryRow(ctx, `SELECT `+studentCols+` FROM students WHERE id = $1`, id))
}

func (r *StudentRepo) ListByClass(ctx context.Context, classID uuid.UUID) ([]*domain.Student, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+studentCols+` FROM students WHERE class_id = $1 ORDER BY full_name ASC`, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s, err := scanStudent(rows)
		if err != nil {
			return nil, err
		}
		students = append(students, s)
	}
	return students, rows.Err()
}

func (r *StudentRepo) List(ctx context.Context, offset, limit int32) ([]*domain.Student, int64, error) {
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM students`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `SELECT `+studentCols+` FROM students ORDER BY full_name ASC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var students []*domain.Student
	for rows.Next() {
		s, err := scanStudent(rows)
		if err != nil {
			return nil, 0, err
		}
		students = append(students, s)
	}
	return students, total, rows.Err()
}

func (r *StudentRepo) Update(ctx context.Context, s *domain.Student) error {
	query := `UPDATE students SET class_id = $2, nis = $3, full_name = $4, updated_at = NOW() WHERE id = $1`
	ct, err := r.pool.Exec(ctx, query, s.ID, s.ClassID, s.NIS, s.FullName)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *StudentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM students WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

type ClassSubjectRepo struct {
	pool *pgxpool.Pool
}

func NewClassSubjectRepo(pool *pgxpool.Pool) domain.ClassSubjectRepository {
	return &ClassSubjectRepo{pool: pool}
}

const selectClassSubject = `
	SELECT cs.id, cs.class_id, cs.subject_id, cs.teacher_id, cs.created_at, cs.updated_at,
	       c.name AS class_name, s.name AS subject_name, COALESCE(u.name, '') AS teacher_name
	FROM class_subjects cs
	JOIN classes c ON c.id = cs.class_id
	JOIN subjects s ON s.id = cs.subject_id
	LEFT JOIN users u ON u.id = cs.teacher_id`

func scanClassSubject(row pgx.Row) (*domain.ClassSubject, error) {
	var cs domain.ClassSubject
	err := row.Scan(
		&cs.ID, &cs.ClassID, &cs.SubjectID, &cs.TeacherID, &cs.CreatedAt, &cs.UpdatedAt,
		&cs.ClassName, &cs.SubjectName, &cs.TeacherName,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &cs, nil
}

func (r *ClassSubjectRepo) Create(ctx context.Context, cs *domain.ClassSubject) error {
	query := `INSERT INTO class_subjects (id, class_id, subject_id, teacher_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.pool.Exec(ctx, query, cs.ID, cs.ClassID, cs.SubjectID, cs.TeacherID, cs.CreatedAt, cs.UpdatedAt)
	return err
}

func (r *ClassSubjectRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.ClassSubject, error) {
	return scanClassSubject(r.pool.QueryRow(ctx, selectClassSubject+` WHERE cs.id = $1`, id))
}

func (r *ClassSubjectRepo) listBy(ctx context.Context, whereCol string, arg uuid.UUID) ([]*domain.ClassSubject, error) {
	rows, err := r.pool.Query(ctx, selectClassSubject+` WHERE `+whereCol+` = $1 ORDER BY c.name, s.name`, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*domain.ClassSubject
	for rows.Next() {
		cs, err := scanClassSubject(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, cs)
	}
	return list, rows.Err()
}

func (r *ClassSubjectRepo) ListByClass(ctx context.Context, classID uuid.UUID) ([]*domain.ClassSubject, error) {
	return r.listBy(ctx, "cs.class_id", classID)
}

func (r *ClassSubjectRepo) ListByTeacher(ctx context.Context, teacherID uuid.UUID) ([]*domain.ClassSubject, error) {
	return r.listBy(ctx, "cs.teacher_id", teacherID)
}

func (r *ClassSubjectRepo) Delete(ctx context.Context, id uuid.UUID) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM class_subjects WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
