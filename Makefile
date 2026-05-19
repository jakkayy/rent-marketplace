# ============================================================
# Marketplace Rental Platform — Makefile
# ============================================================

.PHONY: help db db-down db-logs db-reset setup backend frontend dev clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make db          — Start PostgreSQL container"
	@echo "  make db-down     — Stop PostgreSQL container"
	@echo "  make db-logs     — Show PostgreSQL logs"
	@echo "  make db-reset    — Stop, remove volume, and restart PostgreSQL"
	@echo "  make setup       — Install dependencies for backend & frontend"
	@echo "  make backend     — Start backend dev server (NestJS)"
	@echo "  make frontend    — Start frontend dev server (Next.js)"
	@echo "  make dev         — Start both backend and frontend"
	@echo "  make prisma-gen  — Generate Prisma client"
	@echo "  make prisma-migrate — Run Prisma migration (dev)"
	@echo "  make prisma-studio — Open Prisma Studio GUI"
	@echo "  make clean       — Remove node_modules and build artifacts"

# -----------------------------------------------------------
# Docker / Database
# -----------------------------------------------------------

db:
	docker compose up -d --wait

db-down:
	docker compose down

db-logs:
	docker compose logs -f postgres

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
	@echo "Starting backend and frontend..."
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
