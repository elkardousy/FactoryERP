#!/bin/sh
# FactoryERP — Environment Health Check
# Verifies all required tools and configuration are present.
# Read-only: does not modify any files or state.
# Usage: bash scripts/doctor.sh
# Exit 0 = all checks pass; Exit 1 = one or more checks fail.

set -u

FAIL_COUNT=0
NVMRC_VERSION="$(cat "$(dirname "$0")/../.nvmrc" 2>/dev/null | tr -d '[:space:]')"

pass() { printf "[PASS] %s\n" "$1"; }
fail() { printf "[FAIL] %s\n" "$1"; printf "         Fix: %s\n" "$2"; FAIL_COUNT=$((FAIL_COUNT + 1)); }

# Source .env if present so DATABASE_URL and JWT_SECRET are available
if [ -f ".env" ]; then
  # shellcheck disable=SC1091
  . "./.env" > /dev/null 2>&1 || true
fi

# ── 1. Git ──────────────────────────────────────────────────────────────────
if command -v git > /dev/null 2>&1; then
  pass "git — $(git --version)"
else
  fail "git — not found" "install from https://git-scm.com"
fi

# ── 2. Node.js present ──────────────────────────────────────────────────────
if command -v node > /dev/null 2>&1; then
  NODE_VERSION="$(node --version 2>/dev/null | tr -d 'v[:space:]')"
  pass "node — version $NODE_VERSION"
  # ── 3. Node.js version matches .nvmrc ─────────────────────────────────────
  if [ "$NODE_VERSION" = "$NVMRC_VERSION" ]; then
    pass "node version — $NODE_VERSION matches .nvmrc"
  else
    fail "node version — $NODE_VERSION found, expected $NVMRC_VERSION" "run: nvm use"
  fi
else
  fail "node — not found" "install from https://nodejs.org or use nvm: nvm install $NVMRC_VERSION && nvm use"
  fail "node version — cannot check (node missing)" "install node $NVMRC_VERSION first"
fi

# ── 4. npm ───────────────────────────────────────────────────────────────────
if command -v npm > /dev/null 2>&1; then
  NPM_VERSION="$(npm --version 2>/dev/null | tr -d '[:space:]')"
  NPM_MAJOR="$(printf '%s' "$NPM_VERSION" | cut -d. -f1)"
  pass "npm — version $NPM_VERSION"
  # ── 5. npm version minimum ────────────────────────────────────────────────
  if [ "$NPM_MAJOR" -ge 11 ] 2>/dev/null; then
    pass "npm version — $NPM_VERSION meets minimum 11.0.0"
  else
    fail "npm version — $NPM_VERSION below minimum 11.0.0" "upgrade Node.js to 24.x (npm 11 is bundled)"
  fi
else
  fail "npm — not found" "should be bundled with Node.js"
  fail "npm version — cannot check (npm missing)" "install npm via Node.js"
fi

# ── 6. Docker ────────────────────────────────────────────────────────────────
if command -v docker > /dev/null 2>&1; then
  pass "docker — $(docker --version 2>/dev/null)"
else
  fail "docker — not found" "install Docker Desktop from https://www.docker.com"
fi

# ── 7. Docker daemon running ──────────────────────────────────────────────────
if docker info > /dev/null 2>&1; then
  pass "docker daemon — running"
else
  fail "docker daemon — not running" "start Docker Desktop"
fi

# ── 8. Docker Compose v2 ─────────────────────────────────────────────────────
if docker compose version > /dev/null 2>&1; then
  pass "docker compose — $(docker compose version 2>/dev/null)"
else
  fail "docker compose (v2) — not found" "upgrade to Docker Desktop 4.25+ which includes Compose v2"
fi

# ── 9. .env file ─────────────────────────────────────────────────────────────
if [ -f ".env" ]; then
  pass ".env — present"
else
  fail ".env — not found" "run: cp .env.example .env  then edit .env with real values"
fi

# ── 10. DATABASE_URL ──────────────────────────────────────────────────────────
if [ -n "${DATABASE_URL:-}" ]; then
  pass "DATABASE_URL — set"
else
  fail "DATABASE_URL — not set" "set DATABASE_URL in .env"
fi

# ── 11. JWT_SECRET ────────────────────────────────────────────────────────────
if [ -n "${JWT_SECRET:-}" ]; then
  pass "JWT_SECRET — set"
else
  fail "JWT_SECRET — not set" "set JWT_SECRET in .env (minimum 32 characters)"
fi

# ── 12. node_modules ──────────────────────────────────────────────────────────
if [ -d "node_modules" ]; then
  pass "node_modules — installed"
else
  fail "node_modules — not found" "run: npm ci"
fi

# ── 13. @prisma/client ────────────────────────────────────────────────────────
if [ -d "node_modules/@prisma/client" ]; then
  pass "@prisma/client — generated"
else
  fail "@prisma/client — not generated" "run: DATABASE_URL=\"\$DATABASE_URL\" npx prisma generate"
fi

# ── 14. PostgreSQL container healthy ─────────────────────────────────────────
if docker compose -f docker-compose.dev.yml ps --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
  pass "PostgreSQL — healthy"
else
  DB_STATUS="$(docker compose -f docker-compose.dev.yml ps db 2>/dev/null | tail -1)"
  fail "PostgreSQL — not healthy ($DB_STATUS)" "run: docker compose -f docker-compose.dev.yml up -d"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
printf -- "---\n"
if [ "$FAIL_COUNT" -eq 0 ]; then
  printf "All checks passed. Environment is ready.\n"
  exit 0
else
  printf "%d check(s) failed. Apply the fix commands above and re-run scripts/doctor.sh\n" "$FAIL_COUNT"
  exit 1
fi
