# ============================================================
# Marketplace Rental Platform — Makefile
# ============================================================

.PHONY: help db db-down db-logs db-reset minio-logs setup backend frontend dev clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make db              — Start all Docker services (Postgres + MinIO)"
	@echo "  make db-down         — Stop all Docker services"
	@echo "  make db-logs         — Show PostgreSQL logs"
	@echo "  make minio-logs      — Show MinIO logs"
	@echo "  make db-reset        — Stop, remove volumes, and restart all services"
	@echo "  make setup           — Install dependencies for backend & frontend"
	@echo "  make backend         — Start backend dev server (NestJS on :3001)"
	@echo "  make frontend        — Start frontend dev server (Next.js on :3000)"
	@echo "  make dev             — Start both backend and frontend"
	@echo "  make prisma-gen      — Generate Prisma client"
	@echo "  make prisma-migrate  — Run Prisma migration (dev)"
	@echo "  make prisma-studio   — Open Prisma Studio GUI"
	@echo "  make prisma-seed     — Seed the database"
	@echo "  make clean           — Remove node_modules and build artifacts"

# -----------------------------------------------------------
# Docker
# -----------------------------------------------------------

db:
	docker compose up -d --wait

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

minio-logs:
	docker compose logs -f minio

db-reset:
	docker compose down -v
	docker compose up -d --wait

# -----------------------------------------------------------
# Setup
# -----------------------------------------------------------

setup:
	cd backend && npm install
	cd frontend && npm install

# -----------------------------------------------------------
# Development Servers
# -----------------------------------------------------------

backend:
	cd backend && npm run start:dev

frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend (:3001) and frontend (:3000)..."
	@trap 'kill %1; kill %2' SIGINT; \
		cd backend && npm run start:dev & \
		cd frontend && npm run dev & \
		wait

# -----------------------------------------------------------
# Prisma
# -----------------------------------------------------------

prisma-gen:
	cd backend && npx prisma generate

prisma-migrate:
	cd backend && npx prisma migrate dev

prisma-studio:
	cd backend && npx prisma studio

prisma-seed:
	cd backend && npm run db:seed

# -----------------------------------------------------------
# Clean
# -----------------------------------------------------------

clean:
	cd backend && rm -rf node_modules dist
	cd frontend && rm -rf node_modules .next
