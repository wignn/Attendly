# Monorepo (Golang + Next.js)

Production-grade, enterprise-ready polyglot monorepo combining a high-performance **Golang Clean Architecture REST backend** and a modern **Next.js 15+ App Router frontend**.

## Tech Stack

- **Monorepo:** Turborepo, pnpm workspaces, GNU Make, Docker Compose
- **Backend (`apps/api`):** Go 1.24+, Chi Router, PostgreSQL 16, pgx/v5 (pgxpool), sqlc, Redis 7, Asynq, Swagger UI, RBAC, JWT
- **Frontend (`apps/web`):** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query v5, Zod
- **Shared Packages (`packages/*`):** `@komas/ui`, `@komas/shared-types`, `@komas/tailwind-config`, `@komas/tsconfig`, `@komas/eslint-config`

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Go 1.24+
- Node.js 22+ & pnpm 10+

### 2. Initialization & Dev Setup
```bash
# 1. Install all dependencies
make init

# 2. Start PostgreSQL and Redis infrastructure
make db-up

# 3. Apply database migrations
make migrate-up

# 4. Start all applications with live-reload
make dev
```

- **Frontend Web:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8080](http://localhost:8080)
- **Interactive Swagger Docs:** [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html) (contract: `apps/api/docs/openapi.yaml`, served at `/swagger/openapi.yaml`)
- **ReDoc API Reference:** [http://localhost:8080/redoc](http://localhost:8080/redoc)
- **Local Mailpit:** [http://localhost:8025](http://localhost:8025)

## Available Commands

| Command | Action |
|---|---|
| `make init` | Install pnpm packages & download Go modules |
| `make dev` | Run all applications concurrently via Turborepo |
| `make build` | Build all packages, Next.js frontend, and Go binaries |
| `make test` | Run all tests across packages, frontend, and backend |
| `make lint` | Run code quality linters across workspace |
| `make db-up` | Start Postgres & Redis containers |
| `make db-down` | Stop infrastructure containers |
| `make migrate-up` | Execute PostgreSQL schema migrations |
| `make migrate-down` | Rollback PostgreSQL schema migrations |
| `make sqlc` | Generate type-safe Go database queries |

## Teacher assignments and class schedules (KOM-13)

Migration `000007` creates an academic period for the current Asia/Jakarta semester and preserves existing teaching assignments. The optional `apps/api/db/seeds/kom13.sql` can be rerun to add the example 2026/2027 period without duplicating it. Academic-year management endpoints belong to KOM-10.

Super Admin can create, update, and deactivate teaching assignments and recurring schedules under `/api/v1/teaching-assignments` and `/api/v1/schedules`. Teachers and homeroom teachers can read only their own records. `/api/v1/schedules/today` uses the Asia/Jakarta calendar date. Deactivating an assignment also deactivates its schedules; existing attendance sessions retain their recorded teacher, class, subject, and time.
