#!/bin/sh
# FactoryERP — Environment Reset (Linux/macOS)
# DESTRUCTIVE: destroys Docker volumes (database data) and node_modules.
# Usage: bash scripts/reset.sh
# Requires confirmation before destructive operations.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

printf "========================================\n"
printf "FactoryERP — Environment Reset\n"
printf "========================================\n"
printf "This will:\n"
printf "  1. Stop and remove all Docker containers\n"
printf "  2. DESTROY all named volumes (PostgreSQL data PERMANENTLY DELETED)\n"
printf "  3. Remove node_modules/\n"
printf "\n"
printf "WARNING: All local database data will be permanently lost.\n"
printf "Type \"yes\" to continue: "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  printf "Reset cancelled.\n"
  exit 0
fi

printf "\n[1/3] Stopping Docker containers and removing volumes...\n"
docker compose -f "$REPO_ROOT/docker-compose.dev.yml" down -v 2>/dev/null || true
printf "Done.\n"

printf "\n[2/3] Removing node_modules/...\n"
rm -rf "$REPO_ROOT/node_modules"
printf "Done.\n"

printf "\n[3/3] Removing dist/...\n"
rm -rf "$REPO_ROOT/dist"
printf "Done.\n"

printf "\n========================================\n"
printf "Reset complete.\n"
printf "To restore the environment:\n"
printf "  1. cp .env.example .env  (and fill in values)\n"
printf "  2. bash scripts/setup.sh\n"
printf "========================================\n"
