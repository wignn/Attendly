package domain

import "testing"

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
