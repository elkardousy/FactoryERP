#Requires -Version 5.1
# FactoryERP — Environment Health Check (Windows PowerShell)
# Verifies all required tools and configuration are present.
# Read-only: does not modify any files or state.
# Usage: powershell.exe -File scripts/doctor.ps1
# Exit 0 = all checks pass; Exit 1 = one or more checks fail.

$ErrorActionPreference = "Stop"

$FailCount = 0
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$NvmrcPath = Join-Path $RepoRoot ".nvmrc"
$NvmrcVersion = if (Test-Path $NvmrcPath) { (Get-Content $NvmrcPath -Raw).Trim() } else { "unknown" }

function Write-Pass { param($msg) Write-Host "[PASS] $msg" }
function Write-Fail {
  param($msg, $fix)
  Write-Host "[FAIL] $msg"
  Write-Host "         Fix: $fix"
  $script:FailCount++
}

# Source .env if present
$EnvFile = Join-Path $RepoRoot ".env"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*?)\s*$') {
      $key = $matches[1].Trim()
      $val = $matches[2].Trim() -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
      if (-not [Environment]::GetEnvironmentVariable($key)) {
        [Environment]::SetEnvironmentVariable($key, $val, "Process")
      }
    }
  }
}

# ── 1. Git ───────────────────────────────────────────────────────────────────
try {
  $gitVer = & git --version 2>&1
  Write-Pass "git — $gitVer"
} catch {
  Write-Fail "git — not found" "install from https://git-scm.com"
}

# ── 2 & 3. Node.js ───────────────────────────────────────────────────────────
try {
  $nodeVer = (& node --version 2>&1).TrimStart('v').Trim()
  Write-Pass "node — version $nodeVer"
  if ($nodeVer -eq $NvmrcVersion) {
    Write-Pass "node version — $nodeVer matches .nvmrc"
  } else {
    Write-Fail "node version — $nodeVer found, expected $NvmrcVersion" "run: nvm use $NvmrcVersion"
  }
} catch {
  Write-Fail "node — not found" "install from https://nodejs.org or: nvm install $NvmrcVersion"
  Write-Fail "node version — cannot check (node missing)" "install node $NvmrcVersion first"
}

# ── 4 & 5. npm ───────────────────────────────────────────────────────────────
try {
  $npmVer = (& npm --version 2>&1).Trim()
  $npmMajor = [int]($npmVer -split '\.')[0]
  Write-Pass "npm — version $npmVer"
  if ($npmMajor -ge 11) {
    Write-Pass "npm version — $npmVer meets minimum 11.0.0"
  } else {
    Write-Fail "npm version — $npmVer below minimum 11.0.0" "upgrade Node.js to 24.x (npm 11 bundled)"
  }
} catch {
  Write-Fail "npm — not found" "should be bundled with Node.js"
  Write-Fail "npm version — cannot check" "install Node.js 24.x"
}

# ── 6. Docker ────────────────────────────────────────────────────────────────
try {
  $dockerVer = & docker --version 2>&1
  Write-Pass "docker — $dockerVer"
} catch {
  Write-Fail "docker — not found" "install Docker Desktop from https://www.docker.com"
}

# ── 7. Docker daemon ──────────────────────────────────────────────────────────
try {
  & docker info > $null 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Pass "docker daemon — running"
  } else {
    Write-Fail "docker daemon — not running" "start Docker Desktop"
  }
} catch {
  Write-Fail "docker daemon — error checking" "start Docker Desktop"
}

# ── 8. Docker Compose v2 ─────────────────────────────────────────────────────
try {
  $composeVer = & docker compose version 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Pass "docker compose — $composeVer"
  } else {
    Write-Fail "docker compose (v2) — not found" "upgrade to Docker Desktop 4.25+"
  }
} catch {
  Write-Fail "docker compose (v2) — not found" "upgrade to Docker Desktop 4.25+"
}

# ── 9. .env ──────────────────────────────────────────────────────────────────
if (Test-Path $EnvFile) {
  Write-Pass ".env — present"
} else {
  Write-Fail ".env — not found" "run: Copy-Item .env.example .env  then edit .env with real values"
}

# ── 10. DATABASE_URL ─────────────────────────────────────────────────────────
$dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
if ($dbUrl) {
  Write-Pass "DATABASE_URL — set"
} else {
  Write-Fail "DATABASE_URL — not set" "set DATABASE_URL in .env"
}

# ── 11. JWT_SECRET ───────────────────────────────────────────────────────────
$jwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET", "Process")
if ($jwtSecret) {
  Write-Pass "JWT_SECRET — set"
} else {
  Write-Fail "JWT_SECRET — not set" "set JWT_SECRET in .env (minimum 32 characters)"
}

# ── 12. node_modules ─────────────────────────────────────────────────────────
$nodeModules = Join-Path $RepoRoot "node_modules"
if (Test-Path $nodeModules) {
  Write-Pass "node_modules — installed"
} else {
  Write-Fail "node_modules — not found" "run: npm ci"
}

# ── 13. @prisma/client ───────────────────────────────────────────────────────
$prismaClient = Join-Path $RepoRoot "node_modules/@prisma/client"
if (Test-Path $prismaClient) {
  Write-Pass "@prisma/client — generated"
} else {
  Write-Fail "@prisma/client — not generated" "run: `$env:DATABASE_URL=`"..`" ; npx prisma generate"
}

# ── 14. PostgreSQL container ──────────────────────────────────────────────────
try {
  $psJson = & docker compose -f docker-compose.dev.yml ps --format json 2>&1
  if ($LASTEXITCODE -eq 0 -and $psJson -match '"Health"\s*:\s*"healthy"') {
    Write-Pass "PostgreSQL — healthy"
  } else {
    Write-Fail "PostgreSQL — not healthy" "run: docker compose -f docker-compose.dev.yml up -d"
  }
} catch {
  Write-Fail "PostgreSQL — could not check" "run: docker compose -f docker-compose.dev.yml up -d"
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host "---"
if ($FailCount -eq 0) {
  Write-Host "All checks passed. Environment is ready."
  exit 0
} else {
  Write-Host "$FailCount check(s) failed. Apply the fix commands above and re-run scripts/doctor.ps1"
  exit 1
}
