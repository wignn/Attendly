package service

import (
	"context"
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type studentRepoStub struct {
	listFilter                                                                                 domain.StudentListFilter
	gotID                                                                                      uuid.UUID
	includeDeleted                                                                             bool
	created                                                                                    domain.StudentRecord
	createdAt                                                                                  time.Time
	updated                                                                                    domain.StudentRecord
	deletedActor                                                                               uuid.UUID
	enrollmentActor                                                                            uuid.UUID
	transferClass                                                                              uuid.UUID
	transferDate                                                                               time.Time
	transferActor                                                                              uuid.UUID
	listCalls, getCalls, createCalls, updateCalls, deleteCalls, enrollmentCalls, transferCalls int
	listErr, getErr, createErr, updateErr, deleteErr, enrollmentErr, transferErr               error
	student                                                                                    domain.StudentRecord
	history                                                                                    []domain.StudentEnrollment
}

func (r *studentRepoStub) List(_ context.Context, filter domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
	r.listCalls++
	r.listFilter = filter
	return []domain.StudentRecord{r.student}, 1, r.listErr
}
func (r *studentRepoStub) Get(_ context.Context, id uuid.UUID, includeDeleted bool) (domain.StudentRecord, error) {
	r.getCalls++
	r.gotID = id
	r.includeDeleted = includeDeleted
	if r.student.ID == uuid.Nil {
		r.student.ID = id
	}
	return r.student, r.getErr
}
func (r *studentRepoStub) Create(_ context.Context, record domain.StudentRecord, date time.Time, actor uuid.UUID) (domain.StudentRecord, error) {
	r.createCalls++
	r.created = record
	r.createdAt = date
	r.transferActor = actor
	return record, r.createErr
}
func (r *studentRepoStub) Update(_ context.Context, record domain.StudentRecord, actor uuid.UUID) (domain.StudentRecord, error) {
	r.updateCalls++
	r.updated = record
	r.transferActor = actor
	return record, r.updateErr
}
func (r *studentRepoStub) SoftDelete(_ context.Context, _ uuid.UUID, actor uuid.UUID) error {
	r.deleteCalls++
	r.deletedActor = actor
	return r.deleteErr
}
func (r *studentRepoStub) Enrollments(_ context.Context, id uuid.UUID) ([]domain.StudentEnrollment, error) {
	r.enrollmentCalls++
	r.gotID = id
	r.enrollmentActor = uuid.Nil
	return r.history, r.enrollmentErr
}
func (r *studentRepoStub) Transfer(_ context.Context, id, classID uuid.UUID, date time.Time, actor uuid.UUID) (domain.StudentRecord, error) {
	r.transferCalls++
	r.gotID = id
	r.transferClass = classID
	r.transferDate = date
	r.transferActor = actor
	return r.student, r.transferErr
}

func adminUser() *domain.User { return &domain.User{ID: uuid.New(), Role: domain.RoleSuperAdmin} }

func TestStudentServiceRejectsNonAdminBeforeRepository(t *testing.T) {
	repo := &studentRepoStub{}
	svc := NewStudentService(repo)
	actors := []*domain.User{nil, {ID: uuid.New(), Role: domain.RoleTeacher}, {ID: uuid.New(), Role: domain.RoleHomeroomTeacher}}
	for _, actor := range actors {
		if _, _, err := svc.List(context.Background(), actor, domain.StudentListFilter{}); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("List error = %v, want forbidden", err)
		}
		if _, err := svc.Get(context.Background(), actor, uuid.New()); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("Get error = %v, want forbidden", err)
		}
		if _, err := svc.Create(context.Background(), actor, StudentCreateInput{}); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("Create error = %v, want forbidden", err)
		}
		if _, err := svc.Update(context.Background(), actor, uuid.New(), StudentUpdateInput{}); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("Update error = %v, want forbidden", err)
		}
		if err := svc.SoftDelete(context.Background(), actor, uuid.New()); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("SoftDelete error = %v, want forbidden", err)
		}
		if _, err := svc.Enrollments(context.Background(), actor, uuid.New()); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("Enrollments error = %v, want forbidden", err)
		}
		if _, err := svc.Transfer(context.Background(), actor, uuid.New(), StudentTransferInput{}); !errors.Is(err, domain.ErrForbidden) {
			t.Fatalf("Transfer error = %v, want forbidden", err)
		}
	}
	if repo.listCalls+repo.getCalls+repo.createCalls+repo.updateCalls+repo.deleteCalls+repo.enrollmentCalls+repo.transferCalls != 0 {
		t.Fatal("repository called for forbidden actor")
	}
}

func TestStudentServicePassesDuplicateErrorsThrough(t *testing.T) {
	for _, duplicate := range []error{domain.ErrDuplicateNIS, domain.ErrDuplicateNISN} {
		repo := &studentRepoStub{createErr: duplicate}
		_, err := NewStudentService(repo).Create(context.Background(), adminUser(), StudentCreateInput{NIS: "N1", FullName: "Ada", ClassID: uuid.New()})
		if !errors.Is(err, duplicate) {
			t.Fatalf("error = %v, want %v", err, duplicate)
		}
	}
}

func TestStudentServiceCreateNormalizesAndDefaultsDateInJakarta(t *testing.T) {
	actor := adminUser()
	repo := &studentRepoStub{}
	_, err := NewStudentService(repo).Create(context.Background(), actor, StudentCreateInput{NIS: "  001 ", NISN: strPtr("  123 "), FullName: " Ada Lovelace ", ClassID: uuid.New()})
	if err != nil {
		t.Fatal(err)
	}
	if repo.created.NIS != "001" || repo.created.NISN == nil || *repo.created.NISN != "123" || repo.created.FullName != "Ada Lovelace" {
		t.Fatalf("input not normalized: %+v", repo.created)
	}
	loc, _ := time.LoadLocation("Asia/Jakarta")
	now := time.Now().In(loc)
	if repo.createdAt.Location().String() != loc.String() || repo.createdAt.Format("2006-01-02") != now.Format("2006-01-02") {
		t.Fatalf("effective date = %v, want today's Jakarta date", repo.createdAt)
	}
	if repo.createdAt.UTC().Format("2006-01-02") != now.Format("2006-01-02") {
		t.Fatalf("UTC serialization changed effective date: %v", repo.createdAt)
	}
	if repo.transferActor != actor.ID {
		t.Fatalf("actor = %v, want %v", repo.transferActor, actor.ID)
	}
}

func TestStudentServiceCreateValidation(t *testing.T) {
	cases := []struct {
		name  string
		input StudentCreateInput
	}{
		{"missing NIS", StudentCreateInput{FullName: "Ada", ClassID: uuid.New()}},
		{"missing name", StudentCreateInput{NIS: "001", ClassID: uuid.New()}},
		{"missing class", StudentCreateInput{NIS: "001", FullName: "Ada"}},
		{"zero date", StudentCreateInput{NIS: "001", FullName: "Ada", ClassID: uuid.New(), EffectiveOn: timePtr(time.Time{})}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := &studentRepoStub{}
			_, err := NewStudentService(repo).Create(context.Background(), adminUser(), tc.input)
			if !errors.Is(err, domain.ErrValidation) {
				t.Fatalf("error=%v, want validation", err)
			}
			if repo.createCalls != 0 {
				t.Fatal("repository called on invalid input")
			}
		})
	}
}

func TestStudentServiceUpdateMergesOptionalNISNAndRejectsClassChange(t *testing.T) {
	id := uuid.New()
	repo := &studentRepoStub{student: domain.StudentRecord{ID: id, NIS: "1", NISN: strPtr("abc"), FullName: "Old", CurrentClassID: uuid.New(), Active: true}}
	svc := NewStudentService(repo)
	actor := adminUser()
	_, err := svc.Update(context.Background(), actor, id, StudentUpdateInput{FullName: strPtr(" New ")})
	if err != nil {
		t.Fatal(err)
	}
	if repo.updated.NISN == nil || *repo.updated.NISN != "abc" || repo.updated.FullName != "New" {
		t.Fatalf("omitted NISN not preserved / name not normalized: %+v", repo.updated)
	}
	if repo.transferActor != actor.ID {
		t.Fatalf("update actor=%s, want %s", repo.transferActor, actor.ID)
	}
	repo = &studentRepoStub{student: domain.StudentRecord{ID: id, NIS: "1", CurrentClassID: uuid.New(), Active: true}}
	_, err = NewStudentService(repo).Update(context.Background(), actor, id, StudentUpdateInput{ClassID: uuidPtr(uuid.New())})
	if !errors.Is(err, domain.ErrValidation) || repo.updateCalls != 0 {
		t.Fatalf("class change err=%v update calls=%d", err, repo.updateCalls)
	}
}

func TestStudentServiceUpdateNISNClearAndStatusTransitions(t *testing.T) {
	id := uuid.New()
	repo := &studentRepoStub{student: domain.StudentRecord{ID: id, NIS: "1", NISN: strPtr("abc"), FullName: "Ada", Active: true}}
	_, err := NewStudentService(repo).Update(context.Background(), adminUser(), id, StudentUpdateInput{NISN: strPtr("")})
	if err != nil {
		t.Fatal(err)
	}
	if repo.updated.NISN != nil {
		t.Fatalf("empty NISN must clear value, got %v", *repo.updated.NISN)
	}
	repo = &studentRepoStub{student: domain.StudentRecord{ID: id, NIS: "1", FullName: "Ada", Active: true}}
	_, err = NewStudentService(repo).Update(context.Background(), adminUser(), id, StudentUpdateInput{Active: boolPtr(false)})
	if err != nil || repo.updated.Active {
		t.Fatalf("deactivation: record=%+v err=%v", repo.updated, err)
	}
	repo.student = domain.StudentRecord{ID: id, NIS: "1", FullName: "Ada", Active: false}
	_, err = NewStudentService(repo).Update(context.Background(), adminUser(), id, StudentUpdateInput{Active: boolPtr(true)})
	if err != nil || !repo.updated.Active {
		t.Fatalf("reactivation: record=%+v err=%v", repo.updated, err)
	}
	repo.student.DeletedAt = timePtr(time.Now())
	_, err = NewStudentService(repo).Update(context.Background(), adminUser(), id, StudentUpdateInput{Active: boolPtr(true)})
	if !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("deleted reactivation error=%v, want validation", err)
	}
}

func TestStudentServiceDeleteIsIdempotentForAlreadyDeletedAndPassesActor(t *testing.T) {
	id := uuid.New()
	actor := adminUser()
	repo := &studentRepoStub{student: domain.StudentRecord{ID: id, DeletedAt: timePtr(time.Now())}}
	if err := NewStudentService(repo).SoftDelete(context.Background(), actor, id); err != nil {
		t.Fatal(err)
	}
	if repo.deleteCalls != 0 {
		t.Fatalf("repository delete calls=%d, want 0 for already deleted", repo.deleteCalls)
	}
	repo.student.DeletedAt = nil
	if err := NewStudentService(repo).SoftDelete(context.Background(), actor, id); err != nil {
		t.Fatal(err)
	}
	if repo.deleteCalls != 1 || repo.deletedActor != actor.ID {
		t.Fatalf("delete calls=%d actor=%s", repo.deleteCalls, repo.deletedActor)
	}
}

func TestStudentServiceListValidatesSortAndNormalizesPagination(t *testing.T) {
	repo := &studentRepoStub{}
	svc := NewStudentService(repo)
	actor := adminUser()
	filter := domain.StudentListFilter{Page: 0, PerPage: 101, SortBy: "nope", SortOrder: "up"}
	if _, _, err := svc.List(context.Background(), actor, filter); !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("invalid sort error=%v", err)
	}
	if repo.listCalls != 0 {
		t.Fatal("repository called for invalid sort")
	}
	if _, _, err := svc.List(context.Background(), actor, domain.StudentListFilter{Page: -1}); !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("negative page error=%v, want validation", err)
	}
	filter = domain.StudentListFilter{Page: 0, PerPage: 0, SortBy: "full_name", SortOrder: "DESC", Search: "  Ada  "}
	if _, _, err := svc.List(context.Background(), actor, filter); err != nil {
		t.Fatal(err)
	}
	if repo.listFilter.Page != 1 || repo.listFilter.PerPage != 20 || repo.listFilter.SortOrder != "desc" || repo.listFilter.Search != "Ada" {
		t.Fatalf("filter not normalized: %+v", repo.listFilter)
	}
	filter = domain.StudentListFilter{ClassID: uuidPtr(uuid.Nil)}
	if _, _, err := svc.List(context.Background(), actor, filter); !errors.Is(err, domain.ErrValidation) {
		t.Fatalf("nil class filter error=%v, want validation", err)
	}
	filter = domain.StudentListFilter{Page: 2, PerPage: 500}
	_, _, err := svc.List(context.Background(), actor, filter)
	if err != nil {
		t.Fatal(err)
	}
	if repo.listFilter.PerPage != 100 {
		t.Fatalf("per page=%d, want max 100", repo.listFilter.PerPage)
	}
}

func TestStudentServiceTransferValidatesAndPassesActorAndDate(t *testing.T) {
	id, classID := uuid.New(), uuid.New()
	actor := adminUser()
	start := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	repo := &studentRepoStub{student: domain.StudentRecord{ID: id, CurrentClassID: uuid.New(), Active: true}, history: []domain.StudentEnrollment{{ClassID: uuid.New(), ValidFrom: start}}}
	svc := NewStudentService(repo)
	_, err := svc.Transfer(context.Background(), actor, id, StudentTransferInput{ClassID: repo.student.CurrentClassID})
	if !errors.Is(err, domain.ErrEnrollmentConflict) || repo.transferCalls != 0 {
		t.Fatalf("same-class error=%v transfer calls=%d", err, repo.transferCalls)
	}
	_, err = svc.Transfer(context.Background(), actor, id, StudentTransferInput{ClassID: classID, EffectiveOn: timePtr(start.AddDate(0, 0, -1))})
	if !errors.Is(err, domain.ErrEnrollmentConflict) || repo.transferCalls != 0 {
		t.Fatalf("earlier-date error=%v transfer calls=%d", err, repo.transferCalls)
	}
	repo.student.DeletedAt = timePtr(time.Now())
	_, err = svc.Transfer(context.Background(), actor, id, StudentTransferInput{ClassID: classID})
	if !errors.Is(err, domain.ErrNotFound) || repo.transferCalls != 0 {
		t.Fatalf("deleted transfer error=%v calls=%d", err, repo.transferCalls)
	}
	repo.student.DeletedAt = nil
	repo.history = nil
	_, err = svc.Transfer(context.Background(), actor, id, StudentTransferInput{ClassID: classID, EffectiveOn: timePtr(time.Time{})})
	if !errors.Is(err, domain.ErrValidation) || repo.transferCalls != 0 {
		t.Fatalf("zero date error=%v calls=%d", err, repo.transferCalls)
	}
	repo.history = []domain.StudentEnrollment{{ClassID: repo.student.CurrentClassID, ValidFrom: start}}
	_, err = svc.Transfer(context.Background(), actor, id, StudentTransferInput{ClassID: classID})
	if err != nil {
		t.Fatal(err)
	}
	if repo.transferActor != actor.ID || repo.transferClass != classID {
		t.Fatalf("transfer actor/class: %s / %s", repo.transferActor, repo.transferClass)
	}
	loc, _ := time.LoadLocation("Asia/Jakarta")
	if repo.transferDate.Location().String() != loc.String() || repo.transferDate.Format("2006-01-02") != time.Now().In(loc).Format("2006-01-02") {
		t.Fatalf("default date=%v", repo.transferDate)
	}
	if repo.transferDate.UTC().Format("2006-01-02") != time.Now().In(loc).Format("2006-01-02") {
		t.Fatalf("UTC serialization changed transfer date: %v", repo.transferDate)
	}
}

func TestStudentServiceHistoryDelegatesForDeletedIdentity(t *testing.T) {
	id := uuid.New()
	repo := &studentRepoStub{student: domain.StudentRecord{ID: id, DeletedAt: timePtr(time.Now())}, history: []domain.StudentEnrollment{{StudentID: id}}}
	got, err := NewStudentService(repo).Enrollments(context.Background(), adminUser(), id)
	if err != nil {
		t.Fatal(err)
	}
	if repo.getCalls != 0 || repo.enrollmentCalls != 1 || !reflect.DeepEqual(got, repo.history) {
		t.Fatalf("get calls=%d enrollment calls=%d", repo.getCalls, repo.enrollmentCalls)
	}
}

func strPtr(s string) *string        { return &s }
func timePtr(v time.Time) *time.Time { return &v }
func boolPtr(v bool) *bool           { return &v }
func uuidPtr(v uuid.UUID) *uuid.UUID { return &v }
