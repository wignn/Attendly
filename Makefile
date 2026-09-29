SHELL := /bin/bash

APP_NAME        := attendly
API_DIR         := apps/api
WEB_DIR         := apps/web
DOCKER_DIR      := docker
COMPOSE_FILE    := $(DOCKER_DIR)/docker-compose.yml

PNPM            := pnpm
GO              := go
DOCKER          := docker
DOCKER_COMPOSE  := $(DOCKER) compose -f $(COMPOSE_FILE)

ENV             ?= development
MIGRATION_STEP  ?= 1
SERVICE         ?=
LOG_LINES       ?= 200

.DEFAULT_GOAL := help

GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
RESET  := \033[0m

.PHONY: \
	help init install check \
	dev dev-api dev-web \
	build build-api build-web \
	test test-api test-web test-cover \
	lint lint-api lint-web fmt \
	db-up db-down db-restart db-reset db-logs \
	docker-up docker-down docker-restart docker-build docker-logs docker-ps \
	migrate-up migrate-down migrate-status migrate-create \
	seed \
	sqlc swagger \
	api-run api-build \
	clean clean-all \
	health doctor

help: ## Show available commands
	@echo ""
	@echo "$(BLUE)$(APP_NAME) Makefile$(RESET)"
	@echo ""
	@echo "Usage:"
	@echo "  make <target> [VARIABLE=value]"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "Examples:"
	@echo "  make dev"
	@echo "  make db-up"
	@echo "  make docker-logs SERVICE=api"
	@echo "  make migrate-down MIGRATION_STEP=2"
	@echo ""

init: check install sqlc ## Initialize entire project
	@echo "$(GREEN)Project initialized successfully.$(RESET)"

install: ## Install frontend and backend dependencies
	@echo "$(BLUE)Installing pnpm dependencies...$(RESET)"
	$(PNPM) install
	@echo "$(BLUE)Downloading Go modules...$(RESET)"
	cd $(API_DIR) && $(GO) mod download
	@echo "$(GREEN)Dependencies installed.$(RESET)"

check: ## Check required development tools
	@echo "$(BLUE)Checking required tools...$(RESET)"
	@command -v $(PNPM) >/dev/null 2>&1 || { echo "$(RED)pnpm not found$(RESET)"; exit 1; }
	@command -v $(GO) >/dev/null 2>&1 || { echo "$(RED)go not found$(RESET)"; exit 1; }
	@command -v $(DOCKER) >/dev/null 2>&1 || { echo "$(RED)docker not found$(RESET)"; exit 1; }
	@command -v sqlc >/dev/null 2>&1 || { echo "$(YELLOW)sqlc not found$(RESET)"; }
	@echo "$(GREEN)Tool check completed.$(RESET)"

doctor: check ## Diagnose local development environment
	@echo ""
	@echo "$(BLUE)Environment$(RESET)"
	@echo "ENV:       $(ENV)"
	@echo "pnpm:      $$($(PNPM) --version)"
	@echo "Go:        $$($(GO) version)"
	@echo "Docker:    $$($(DOCKER) --version)"
	@echo "Compose:   $$($(DOCKER) compose version)"
	@echo ""

dev: ## Start all development services
	$(PNPM) dev

dev-api: ## Start Go API in development mode
	cd $(API_DIR) && $(GO) run ./cmd/api

dev-web: ## Start web application only
	$(PNPM) --filter web dev

api-run: dev-api ## Alias for dev-api

build: ## Build all applications
	$(PNPM) build

build-api: ## Build Go API
	@mkdir -p bin
	cd $(API_DIR) && $(GO) build -o ../../bin/api ./cmd/api
	@echo "$(GREEN)API built: bin/api$(RESET)"

build-web: ## Build frontend
	$(PNPM) --filter web build

api-build: build-api ## Alias for build-api

test: ## Run all tests
	$(PNPM) test
	cd $(API_DIR) && $(GO) test ./...

test-api: ## Run API tests
	cd $(API_DIR) && $(GO) test ./...

test-web: ## Run frontend tests
	$(PNPM) --filter web test

test-cover: ## Run Go tests with coverage
	cd $(API_DIR) && \
		$(GO) test -coverprofile=coverage.out ./... && \
		$(GO) tool cover -func=coverage.out

lint: lint-web lint-api ## Run all linters

lint-web: ## Lint frontend
	$(PNPM) lint

lint-api: ## Lint Go backend
	cd $(API_DIR) && $(GO) vet ./...

fmt: ## Format frontend and Go code
	$(PNPM) format
	cd $(API_DIR) && $(GO) fmt ./...

db-up: ## Start database services
	@echo "$(BLUE)Starting database...$(RESET)"
	$(DOCKER_COMPOSE) up -d db

db-down: ## Stop database services
	$(DOCKER_COMPOSE) stop db

db-restart: db-down db-up ## Restart database

db-reset: ## Completely recreate database
	@echo "$(YELLOW)Resetting database...$(RESET)"
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d db
	@sleep 3
	$(MAKE) migrate-up
	@echo "$(GREEN)Database reset completed.$(RESET)"

db-logs: ## Show database logs
	$(DOCKER_COMPOSE) logs -f --tail=$(LOG_LINES) db

docker-up: ## Build and start Docker stack
	$(DOCKER_COMPOSE) up -d --build

docker-down: ## Stop Docker stack
	$(DOCKER_COMPOSE) down

docker-restart: ## Restart Docker stack
	$(DOCKER_COMPOSE) restart

docker-build: ## Build Docker images
	$(DOCKER_COMPOSE) build

docker-ps: ## Show Docker service status
	$(DOCKER_COMPOSE) ps

docker-logs: ## Show Docker logs. Usage: make docker-logs SERVICE=api
ifdef SERVICE
	$(DOCKER_COMPOSE) logs -f --tail=$(LOG_LINES) $(SERVICE)
else
	$(DOCKER_COMPOSE) logs -f --tail=$(LOG_LINES)
endif

migrate-up: ## Run all pending migrations
	cd $(API_DIR) && $(GO) run cmd/migrate/main.go up

migrate-down: ## Roll back migrations
	cd $(API_DIR) && $(GO) run cmd/migrate/main.go down $(MIGRATION_STEP)

migrate-status: ## Show migration status
	cd $(API_DIR) && $(GO) run cmd/migrate/main.go status

migrate-create: ## Create migration. Usage: make migrate-create NAME=create_users
ifndef NAME
	$(error NAME is required. Example: make migrate-create NAME=create_users)
endif
	cd $(API_DIR) && $(GO) run cmd/migrate/main.go create $(NAME)

seed: ## Seed database with comprehensive realistic test data
	cd $(API_DIR) && $(GO) run cmd/seed/main.go

sqlc: ## Generate Go code from SQL
	@command -v sqlc >/dev/null 2>&1 || { \
		echo "$(RED)sqlc is not installed.$(RESET)"; \
		exit 1; \
	}
	cd $(API_DIR) && sqlc generate
	@echo "$(GREEN)sqlc generation completed.$(RESET)"

swagger: ## Show OpenAPI contract location
	@echo "$(BLUE)OpenAPI contract$(RESET)"
	@echo "$(API_DIR)/docs/openapi.yaml"

health: ## Check Docker service health
	@echo "$(BLUE)Docker services$(RESET)"
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "$(BLUE)API health$(RESET)"
	@curl -fsS http://localhost:8080/health \
		&& echo "" \
		|| echo "$(YELLOW)API is unavailable on localhost:8080$(RESET)"

clean: ## Remove generated/build artifacts
	$(PNPM) clean
	rm -rf bin
	rm -rf $(API_DIR)/coverage.out

clean-all: clean ## Remove builds, dependencies, and Docker volumes
	rm -rf node_modules
	rm -rf $(WEB_DIR)/node_modules
	$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "$(GREEN)Full cleanup completed.$(RESET)"
