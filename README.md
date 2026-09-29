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

### 2. Full-Stack Docker Deployment (Project Lengkap)
Untuk menjalankan seluruh layanan (PostgreSQL, Redis, Mailpit, Database Migration, Backend API, dan Frontend Web) dalam container:
```bash
# Jalankan seluruh stack
docker compose up -d --build

# Pantau log
docker compose logs -f

# Hentikan seluruh stack
docker compose down
```

### 3. Local Development Setup
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
| `make seed` | Seed database with comprehensive realistic test data |
| `make sqlc` | Generate type-safe Go database queries |

## Teacher assignments and class schedules (KOM-13)

Migration `000007` creates an academic period for the current Asia/Jakarta semester and preserves existing teaching assignments. The optional `apps/api/db/seeds/kom13.sql` can be rerun to add the example 2026/2027 period without duplicating it. Academic-year management endpoints belong to KOM-10.

Super Admin can create, update, and deactivate teaching assignments and recurring schedules under `/api/v1/teaching-assignments` and `/api/v1/schedules`. Teachers and homeroom teachers can read only their own records. `/api/v1/schedules/today` uses the Asia/Jakarta calendar date. Deactivating an assignment also deactivates its schedules; existing attendance sessions retain their recorded teacher, class, subject, and time.

## Homeroom Teacher Dashboard (KOM-18)

Dashboard khusus Wali Kelas (`/dashboard` dengan role `HOMEROOM_TEACHER` atau tab *Rekap Kelas Wali*) untuk memantau kehadiran siswa di kelas binaan secara real-time.
- **Ringkasan Kelas:** Total siswa, tingkat kehadiran (attendance rate %), jumlah siswa hadir, sakit, izin, dan tanpa keterangan (alpa).
- **Pemantauan & Filter:** Tab filter siswa berstatus normal, perhatian (< 85% kehadiran atau terdapat alpa), dan izin/sakit, dilengkapi pencarian berdasarkan nama dan NIS.
- **Drill-down Siswa:** Modal detail presensi individual siswa dengan rincian breakdown kehadiran berdasarkan mata pelajaran.
- **Integrasi API:** Menggunakan endpoint `/teachers/me/homeroom-dashboard`, `/reports/homeroom/{class_id}`, dan `/students/{student_id}/attendance-summary`.

## Attendance Management & Audit Logs (KOM-21)

Alat Super Admin untuk memonitor, meninjau, dan mengelola seluruh riwayat presensi dan audit aktivitas sistem:
- **Attendance Management (`/absensi`):** Filter sesi berdasarkan tanggal, kelas, mata pelajaran, guru, dan status (draft/submitted). Dilengkapi modal peninjauan detail sesi beserta daftar catatan presensi per siswa, serta fungsi reopen sesi presensi terkunci dengan validasi alasan (*reason*).
- **Audit Logs (`/audit`):** Log aktivitas sistem dengan filter entitas (`ATTENDANCE_SESSION`, `STUDENT`, `TEACHER`, dsb.), jenis aksi (`CREATE`, `UPDATE`, `SUBMIT`, `REOPEN`, dsb.), rentang tanggal, dan pencarian teks.
- **Export Laporan:** Modal ekspor riwayat absensi multi-format (CSV, XLSX, PDF) dengan *job polling* otomatis dan tautan unduhan langsung.
- **Integrasi API:** Terhubung dengan `/attendance-sessions`, `/attendance-sessions/{id}`, `/audit-logs`, dan `/exports/attendance`.

## Subject Attendance Statistics & Class Detail (KOM-23)

Alur pelaporan dan visualisasi statistik kehadiran untuk Guru Mata Pelajaran:
- **Statistik Mata Pelajaran (`TeacherMapelStatistics`):** Ringkasan tingkat kehadiran keseluruhan mata pelajaran, pemilih mata pelajaran yang diampu, serta daftar kelas dengan metrik kehadiran dan progress bar interaktif.
- **Detail Kehadiran Kelas (`/kelas/[classId]`):** Halaman breakdown kehadiran tingkat siswa per kelas dengan filter status (Semua, Perlu Perhatian, Kritis, Kehadiran Sempurna) dan pencarian siswa. Konteks mata pelajaran dipertahankan melalui URL parameter `subject_id`.
- **Integrasi API:** Menggunakan endpoint `/reports/subject-attendance` dan `/reports/classes/{class_id}/attendance`.

## End-to-End Frontend API Integration (KOM-25)

Penyelesaian seluruh integrasi antarmuka frontend Attendly dengan backend API berbasis OpenAPI 3.1:
- **Unified API Client:** Client HTTP tunggal dengan injeksi otomatis Bearer JWT access token dan penanganan refresh token otomatis saat access token kadaluarsa.
- **Role-Based Access Control (RBAC):** Navigasi, proteksi rute, dan batasan aksi dinamis sesuai peran `SUPER_ADMIN`, `TEACHER`, dan `HOMEROOM_TEACHER`.
- **Zero Mock Data:** Seluruh halaman (Master Data Guru, Siswa, Kelas, Mapel, Jadwal, Tahun Ajaran, Presensi Guru, Dashboard Admin & Wali Kelas, Audit & Ekspor) terhubung ke API nyata dengan state handling komprehensif (loading skeletons, empty states, actionable error retry, dan feedback toast).




