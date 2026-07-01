#Requires -Version 5.1
# FactoryERP — Development Environment Setup (Windows PowerShell)
# Prerequisite: Git, Node.js 24.16.0 (via nvm-windows), Docker Desktop must be installed.
# This script does NOT install tools — use scripts/doctor.ps1 to verify prerequisites.
# Usage: powershell.exe -File scripts/setup.ps1
# Idempotent: safe to run multiple times.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$NvmrcPath = Join-Path $RepoRoot ".nvmrc"
$NvmrcVersion = (Get-Content $NvmrcPath -Raw).Trim()
$TotalSteps = 7
$Step = 0

function Write-Step {
  param($msg)
  $script:Step++
  Write-Host "`n[STEP $($script:Step)/$TotalSteps] $msg"
}

# ── Step 1: Verify Node version ───────────────────────────────────────────────
Write-Step "Verify Node.js version"
$currentNode = (& node --version 2>&1).TrimStart('v').Trim()
if ($currentNode -ne $NvmrcVersion) {
  Write-Host "ERROR: Node.js $currentNode found; $NvmrcVersion required."
  Write-Host "Run: nvm use $NvmrcVersion"
  exit 1
}
Write-Host "Node.js $currentNode confirmed."

# ── Step 2: Verify Docker is running ──────────────────────────────────────────
Write-Step "Verify Docker daemon"
& docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Docker daemon is not running."
  Write-Host "Start Docker Desktop and retry."
  exit 1
}
Write-Host "Docker daemon is running."

# ── Step 3: Install dependencies ──────────────────────────────────────────────
Write-Step "Install npm dependencies (npm ci)"
Set-Location $RepoRoot
& npm ci
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: npm ci failed."; exit 1 }

# ── Step 4: Copy .env.example if .env is missing ─────────────────────────────
Write-Step "Configure .env"
$EnvFile = Join-Path $RepoRoot ".env"
$EnvExample = Join-Path $RepoRoot ".env.example"
if (-not (Test-Path $EnvFile)) {
  Copy-Item $EnvExample $EnvFile
  Write-Host ".env created from .env.example."
  Write-Host "IMPORTANT: Edit .env and set POSTGRES_PASSWORD and JWT_SECRET before continuing."
} else {
  Write-Host ".env already exists — skipping copy."
}

# ── Step 5: Start Docker Compose ─────────────────────────────────────────────
Write-Step "Start PostgreSQL via Docker Compose"
& docker compose -f (Join-Path $RepoRoot "docker-compose.dev.yml") up -d
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: docker compose up failed."; exit 1 }

# Wait for healthy state (max 30 seconds)
Write-Host "Waiting for PostgreSQL to become healthy..." -NoNewline
$wait = 0
$composeFile = Join-Path $RepoRoot "docker-compose.dev.yml"
do {
  if ($wait -ge 30) {
    Write-Host ""
    Write-Host "ERROR: PostgreSQL did not become healthy within 30 seconds."
    Write-Host "Check logs: docker logs factory-erp-db"
    exit 1
  }
  Start-Sleep -Seconds 1
  $wait++
  Write-Host "." -NoNewline
  $psJson = & docker compose -f $composeFile ps --format json 2>&1
} until ($psJson -match '"Health"\s*:\s*"healthy"')
Write-Host " healthy after ${wait}s."

# ── Step 6: Generate Prisma client ────────────────────────────────────────────
Write-Step "Generate Prisma client"
Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*?)\s*$') {
    $key = $matches[1].Trim()
    $val = $matches[2].Trim() -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
    [Environment]::SetEnvironmentVariable($key, $val, "Process")
  }
}
$dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
$env:DATABASE_URL = $dbUrl
& npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: prisma generate failed."; exit 1 }

# ── Step 7: Run doctor to confirm ─────────────────────────────────────────────
Write-Step "Verify environment (doctor)"
try {
  & powershell.exe -File (Join-Path $ScriptDir "doctor.ps1")
} catch {
  Write-Host "Doctor script reported issues — review above output."
}

Write-Host ""
Write-Host "========================================"
Write-Host "Setup complete. Next steps:"
Write-Host "  1. Edit .env if you haven't already (POSTGRES_PASSWORD, JWT_SECRET)"
Write-Host "  2. Run: npm run start:dev"
Write-Host "  3. Visit: http://localhost:3000/api/docs"
Write-Host "========================================"
