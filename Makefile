.PHONY: init dev build test lint clean db-up db-down migrate-up migrate-down sqlc swagger

init:
	pnpm install
	cd apps/api && go mod download

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

db-up:
	docker compose -f docker/docker-compose.yml up -d

db-down:
	docker compose -f docker/docker-compose.yml down

migrate-up:
	cd apps/api && go run cmd/migrate/main.go up

migrate-down:
	cd apps/api && go run cmd/migrate/main.go down

sqlc:
	cd apps/api && sqlc generate

swagger:
	@echo "OpenAPI contract: apps/api/docs/openapi.yaml"

clean:
	pnpm clean
