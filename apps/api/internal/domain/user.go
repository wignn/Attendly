package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleSuperAdmin      Role = "SUPER_ADMIN"
	RoleTeacher         Role = "TEACHER"
	RoleHomeroomTeacher Role = "HOMEROOM_TEACHER"
)

func (r Role) IsValid() bool {
	switch r {
	case RoleSuperAdmin, RoleTeacher, RoleHomeroomTeacher:
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
	IsActive  bool      `json:"is_active"`
	Role      Role      `json:"role,omitempty"`
	Roles     []Role    `json:"roles,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u User) HasRole(role Role) bool {
	if !role.IsValid() {
		return false
	}
	for _, assignedRole := range u.Roles {
		if assignedRole == role {
			return true
		}
	}
	return u.Role == role
}

func (u *User) SetRoles(roles []Role) {
	u.Roles = append([]Role(nil), roles...)
	if len(roles) > 0 {
		u.Role = roles[0]
	}
}

func (u User) RoleSet() []Role {
	if len(u.Roles) > 0 {
		return append([]Role(nil), u.Roles...)
	}
	if u.Role.IsValid() {
		return []Role{u.Role}
	}
	return nil
}

type RoleRepository interface {
	SetRoles(ctx context.Context, userID uuid.UUID, roles []Role) error
}

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	List(ctx context.Context, offset, limit int32) ([]*User, int64, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id uuid.UUID) error
}
