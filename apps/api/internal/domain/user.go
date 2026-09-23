package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleAdmin   Role = "ADMIN"
	RoleMember  Role = "MEMBER"
	RoleUser    Role = "USER"
	RoleTeacher Role = "TEACHER"
	RoleStudent Role = "STUDENT"
)

func (r Role) IsValid() bool {
	switch r {
	case RoleAdmin, RoleMember, RoleUser, RoleTeacher, RoleStudent:
		return true
	default:
		return false
	}
}

type User struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	Name      string    `json:"name"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	List(ctx context.Context, offset, limit int32) ([]*User, int64, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error
}
