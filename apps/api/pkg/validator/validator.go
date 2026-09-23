package validator

import (
	"fmt"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func ValidateStruct(s any) []domain.FieldError {
	err := validate.Struct(s)
	if err == nil {
		return nil
	}

	var fieldErrors []domain.FieldError
	if valErrors, ok := err.(validator.ValidationErrors); ok {
		for _, err := range valErrors {
			fieldErrors = append(fieldErrors, domain.FieldError{
				Field: err.Field(),
				Issue: fmt.Sprintf("failed on '%s' tag", err.Tag()),
			})
		}
	} else {
		fieldErrors = append(fieldErrors, domain.FieldError{
			Field: "general",
			Issue: err.Error(),
		})
	}
	return fieldErrors
}
