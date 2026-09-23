package domain

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound          = errors.New("resource not found")
	ErrConflict          = errors.New("resource already exists")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden access")
	ErrValidation        = errors.New("validation failed")
	ErrInternal          = errors.New("internal server error")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type FieldError struct {
	Field string `json:"field"`
	Issue string `json:"issue"`
}

type AppError struct {
	Err     error        `json:"-"`
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Details []FieldError `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func NewAppError(code, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}
