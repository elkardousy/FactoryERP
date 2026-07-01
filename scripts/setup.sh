#!/bin/sh
# FactoryERP — Development Environment Setup (Linux/macOS)
# Prerequisite: Git, Node.js 24.16.0 (via nvm), Docker, Docker Compose v2 must be installed.
# This script does NOT install tools — use scripts/doctor.sh to verify prerequisites.
# Usage: bash scripts/setup.sh
# Idempotent: safe to run multiple times.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NVMRC_VERSION="$(cat "$REPO_ROOT/.nvmrc" | tr -d '[:space:]')"
TOTAL_STEPS=7
STEP=0

step() {
  STEP=$((STEP + 1))
  printf "\n[STEP %d/%d] %s\n" "$STEP" "$TOTAL_STEPS" "$1"
}

# ── Step 1: Verify Node version ───────────────────────────────────────────────
step "Verify Node.js version"
CURRENT_NODE="$(node --version 2>/dev/null | tr -d 'v[:space:]')"
if [ "$CURRENT_NODE" != "$NVMRC_VERSION" ]; then
  printf "ERROR: Node.js %s found; %s required.\n" "$CURRENT_NODE" "$NVMRC_VERSION"
  printf "Run: nvm use\n"
  exit 1
fi
printf "Node.js %s confirmed.\n" "$CURRENT_NODE"

# ── Step 2: Verify Docker is running ──────────────────────────────────────────
step "Verify Docker daemon"
if ! docker info > /dev/null 2>&1; then
  printf "ERROR: Docker daemon is not running.\n"
  printf "Start Docker Desktop and retry.\n"
  exit 1
fi
printf "Docker daemon is running.\n"

# ── Step 3: Install dependencies ──────────────────────────────────────────────
step "Install npm dependencies (npm ci)"
cd "$REPO_ROOT"
npm ci

# ── Step 4: Copy .env.example if .env is missing ─────────────────────────────
step "Configure .env"
if [ ! -f "$REPO_ROOT/.env" ]; then
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  printf ".env created from .env.example.\n"
  printf "IMPORTANT: Edit .env and set POSTGRES_PASSWORD and JWT_SECRET before continuing.\n"
else
  printf ".env already exists — skipping copy.\n"
fi

# ── Step 5: Start Docker Compose ─────────────────────────────────────────────
step "Start PostgreSQL via Docker Compose"
docker compose -f "$REPO_ROOT/docker-compose.dev.yml" up -d

# Wait for healthy state (max 30 seconds)
printf "Waiting for PostgreSQL to become healthy..."
WAIT=0
until docker compose -f "$REPO_ROOT/docker-compose.dev.yml" ps --format json 2>/dev/null | grep -q '"Health":"healthy"'; do
  if [ "$WAIT" -ge 30 ]; then
    printf "\nERROR: PostgreSQL did not become healthy within 30 seconds.\n"
    printf "Check logs: docker logs factory-erp-db\n"
    exit 1
  fi
  sleep 1
  WAIT=$((WAIT + 1))
  printf "."
done
printf " healthy after %ds.\n" "$WAIT"

# ── Step 6: Source .env and generate Prisma client ────────────────────────────
step "Generate Prisma client"
. "$REPO_ROOT/.env" > /dev/null 2>&1 || true
DATABASE_URL="${DATABASE_URL}" npx prisma generate

# ── Step 7: Run doctor to confirm ─────────────────────────────────────────────
step "Verify environment (doctor)"
sh "$SCRIPT_DIR/doctor.sh" || true

printf "\n========================================\n"
printf "Setup complete. Next steps:\n"
printf "  1. Edit .env if you haven't already (POSTGRES_PASSWORD, JWT_SECRET)\n"
printf "  2. Run: npm run start:dev\n"
printf "  3. Visit: http://localhost:3000/api/docs\n"
printf "========================================\n"
