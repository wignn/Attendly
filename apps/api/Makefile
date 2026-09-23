.PHONY: dev build test lint tidy migrate-up migrate-down sqlc

dev:
	go run cmd/server/main.go

build:
	mkdir -p bin
	go build -o bin/server cmd/server/main.go
	go build -o bin/worker cmd/worker/main.go

test:
	go test -v -race ./...

lint:
	golangci-lint run ./...

tidy:
	go mod tidy

migrate-up:
	go run cmd/migrate/main.go up

migrate-down:
	go run cmd/migrate/main.go down

sqlc:
	sqlc generate
