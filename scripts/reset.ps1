#Requires -Version 5.1
# FactoryERP — Environment Reset (Windows PowerShell)
# DESTRUCTIVE: destroys Docker volumes (database data) and node_modules.
# Usage: powershell.exe -File scripts/reset.ps1
# Requires confirmation before destructive operations.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

Write-Host "========================================"
Write-Host "FactoryERP — Environment Reset"
Write-Host "========================================"
Write-Host "This will:"
Write-Host "  1. Stop and remove all Docker containers"
Write-Host "  2. DESTROY all named volumes (PostgreSQL data PERMANENTLY DELETED)"
Write-Host "  3. Remove node_modules/"
Write-Host ""
Write-Host "WARNING: All local database data will be permanently lost."
$confirm = Read-Host 'Type "yes" to continue'

if ($confirm -ne "yes") {
  Write-Host "Reset cancelled."
  exit 0
}

Write-Host ""
Write-Host "[1/3] Stopping Docker containers and removing volumes..."
$composeFile = Join-Path $RepoRoot "docker-compose.dev.yml"
try {
  & docker compose -f $composeFile down -v 2>&1 | Out-Null
} catch {
  Write-Host "Note: docker compose down encountered an issue (containers may not have been running)."
}
Write-Host "Done."

Write-Host ""
Write-Host "[2/3] Removing node_modules/..."
$nodeModules = Join-Path $RepoRoot "node_modules"
if (Test-Path $nodeModules) {
  Remove-Item $nodeModules -Recurse -Force -Confirm:$false
}
Write-Host "Done."

Write-Host ""
Write-Host "[3/3] Removing dist/..."
$dist = Join-Path $RepoRoot "dist"
if (Test-Path $dist) {
  Remove-Item $dist -Recurse -Force -Confirm:$false
}
Write-Host "Done."

Write-Host ""
Write-Host "========================================"
Write-Host "Reset complete."
Write-Host "To restore the environment:"
Write-Host "  1. Copy-Item .env.example .env  (and fill in values)"
Write-Host "  2. powershell.exe -File scripts/setup.ps1"
Write-Host "========================================"
