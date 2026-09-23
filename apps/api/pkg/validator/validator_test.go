package validator

import (
	"testing"
)

type sampleUser struct {
	Name  string `validate:"required,min=2"`
	Email string `validate:"required,email"`
	Age   int    `validate:"gte=0,lte=130"`
}

func TestValidateStruct_Valid(t *testing.T) {
	u := sampleUser{
		Name:  "Alice",
		Email: "alice@example.com",
		Age:   30,
	}

	errs := ValidateStruct(u)
	if len(errs) != 0 {
		t.Fatalf("expected 0 errors, got %d: %+v", len(errs), errs)
	}
}

func TestValidateStruct_Invalid(t *testing.T) {
	u := sampleUser{
		Name:  "A",
		Email: "invalid-email",
		Age:   150,
	}

	errs := ValidateStruct(u)
	if len(errs) != 3 {
		t.Fatalf("expected 3 validation errors, got %d: %+v", len(errs), errs)
	}

	expectedFields := map[string]bool{
		"Name":  true,
		"Email": true,
		"Age":   true,
	}

	for _, err := range errs {
		if !expectedFields[err.Field] {
			t.Errorf("unexpected field error: %s", err.Field)
		}
	}
}
