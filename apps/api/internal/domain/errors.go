package domain

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound           = errors.New("resource not found")
	ErrConflict           = errors.New("resource already exists")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden access")
	ErrValidation         = errors.New("validation failed")
	ErrInvalidRole        = errors.New("invalid role")
	ErrInternal           = errors.New("internal server error")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrStudentNotFound    = errors.New("student not found")
	ErrDuplicateNIS       = errors.New("student NIS already exists")
	ErrDuplicateNISN           = errors.New("student NISN already exists")
	ErrEnrollmentConflict      = errors.New("student enrollment conflicts with existing history")
	ErrInvalidEnrollment       = errors.New("invalid student enrollment")
	ErrSessionLocked           = errors.New("attendance session is submitted and locked")
	ErrSessionVersionMismatch  = errors.New("attendance session has been modified concurrently")
	ErrInvalidSessionStatus    = errors.New("invalid attendance session status")
	ErrReopenReasonRequired    = errors.New("reopen reason is required")
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
