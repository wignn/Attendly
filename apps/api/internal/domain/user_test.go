package domain

import "testing"

func TestUserHasRole(t *testing.T) {
	user := User{Roles: []Role{RoleHomeroomTeacher, RoleTeacher}}

	if !user.HasRole(RoleTeacher) {
		t.Fatal("expected user to have teacher role")
	}
	if !user.HasRole(RoleHomeroomTeacher) {
		t.Fatal("expected user to have homeroom teacher role")
	}
	if user.HasRole(RoleSuperAdmin) {
		t.Fatal("did not expect user to have super admin role")
	}
	if user.HasRole(Role("UNKNOWN")) {
		t.Fatal("did not expect invalid role to match")
	}
}

func TestRoleIsValidUsesAttendlyRoles(t *testing.T) {
	for _, role := range []Role{RoleSuperAdmin, RoleTeacher, RoleHomeroomTeacher} {
		if !role.IsValid() {
			t.Errorf("expected %q to be a valid role", role)
		}
	}
	for _, role := range []Role{"ADMIN", "MEMBER", "USER", "UNKNOWN"} {
		if role.IsValid() {
			t.Errorf("expected legacy/unknown role %q to be invalid", role)
		}
	}
}
