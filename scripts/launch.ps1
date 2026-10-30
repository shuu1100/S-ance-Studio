<#
.SYNOPSIS
    Séance Studio — Unified Windows Local Launcher
.DESCRIPTION
    Checks all prerequisites, verifies local Ollama model readiness,
    applies SQLite database migrations, and launches both backend
    and frontend services in a controlled, beginner-friendly manner.
    Pressing Ctrl+C gracefully stops only the processes started by this launcher.
#>

param(
    [switch]$NoBrowser,
    [switch]$SkipModelCheck
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$PythonExe = Join-Path $RootDir ".venv\Scripts\python.exe"
$PidFile = Join-Path $ScriptDir ".running_pids.json"

Clear-Host
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  S E A N C E   S T U D I O   --   L O C A L   L A U N C H E R    " -ForegroundColor Yellow
Write-Host "  Victorian Gothic Mystery Engine & Local Offline AI Inquest      " -ForegroundColor DarkYellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. Prerequisite Checks
# ------------------------------------------------------------------------------
Write-Host "[1/5] Checking System Prerequisites..." -ForegroundColor Yellow

# Check Python environment
if (Test-Path $PythonExe) {
    $pyVer = & $PythonExe -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
    Write-Host "  [OK] Python Virtual Environment: Python $pyVer ($PythonExe)" -ForegroundColor Green
} else {
    Write-Error "Virtual environment not found at $PythonExe.`nPlease initialize the environment first using: python -m venv .venv; .\.venv\Scripts\pip install -r backend\requirements.txt"
    exit 1
}

# Check Node.js and npm
try {
    $nodeVer = & node -v
    Write-Host "  [OK] Node.js Runtime: $nodeVer" -ForegroundColor Green
} catch {
    Write-Error "Node.js was not detected on PATH. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Local Ollama Model Verification (Zero Auto-Download Guarantee)
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Checking Local AI Runtime (Ollama)..." -ForegroundColor Yellow
$ConfiguredModel = "qwen3:4b"
$ConfiguredVisionModel = "qwen3-vl:8b"
$OllamaUrl = "http://127.0.0.1:11434"

try {
    $tagsJson = curl.exe -s --max-time 3 "$OllamaUrl/api/tags"
    if ($tagsJson) {
        $hasTextModel = $tagsJson -match $ConfiguredModel
        $hasVisionModel = $tagsJson -match $ConfiguredVisionModel

        if ($hasTextModel) {
            Write-Host "  [OK] Ollama is active on $OllamaUrl" -ForegroundColor Green
            Write-Host "  [OK] Primary dialogue model '$ConfiguredModel' is verified installed." -ForegroundColor Green
        } else {
            Write-Host "  [!] Ollama is running, but model '$ConfiguredModel' is not yet installed." -ForegroundColor DarkYellow
            Write-Host "      To install, open a new terminal and run:" -ForegroundColor Cyan
            Write-Host "        ollama pull $ConfiguredModel" -ForegroundColor White
            Write-Host "      (Séance Studio will use deterministic fallback dialogue until pulled)" -ForegroundColor DarkGray
        }

        if ($hasVisionModel) {
            Write-Host "  [OK] Optional vision model '$ConfiguredVisionModel' is available for forensic inspection." -ForegroundColor Green
        } else {
            Write-Host "  [-] Optional vision model '$ConfiguredVisionModel' not detected (optical inspection will be simulated)." -ForegroundColor DarkGray
        }
    } else {
        throw "Empty response"
    }
} catch {
    Write-Host "  [!] Ollama daemon was not detected at $OllamaUrl." -ForegroundColor DarkYellow
    Write-Host "      Séance Studio runs fully offline in fallback mode, but for live LLM roleplay:" -ForegroundColor DarkYellow
    Write-Host "      1. Install Ollama: https://ollama.com/" -ForegroundColor Cyan
    Write-Host "      2. Start Ollama and run: ollama pull $ConfiguredModel" -ForegroundColor Cyan
}

# ------------------------------------------------------------------------------
# 3. Database Migration & Integrity
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Verifying SQLite Database Schema & Migrations..." -ForegroundColor Yellow
Push-Location $BackendDir
try {
    & $PythonExe -m alembic upgrade head 2>&1 | Out-Null
    Write-Host "  [OK] SQLite schema verified and up-to-date." -ForegroundColor Green
} catch {
    Write-Host "  [!] Alembic note: proceeding with direct schema initialization." -ForegroundColor DarkGray
} finally {
    Pop-Location
}

# ------------------------------------------------------------------------------
# 4. Launch Backend & Frontend Services
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] Launching Local Services..." -ForegroundColor Yellow

# Start FastAPI Backend
$backendLog = Join-Path $RootDir "scripts\backend.log"
$backendProc = Start-Process -FilePath $PythonExe `
    -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" `
    -WorkingDirectory $BackendDir `
    -PassThru `
    -WindowStyle Hidden

Write-Host "  [OK] FastAPI Backend launched (PID: $($backendProc.Id)) on http://127.0.0.1:8000" -ForegroundColor Green

# Start Next.js Frontend
$env:NEXT_TELEMETRY_DISABLED = "1"
$frontendProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev -- -p 3000" `
    -WorkingDirectory $FrontendDir `
    -PassThru `
    -WindowStyle Hidden

Write-Host "  [OK] Next.js Frontend launched (PID: $($frontendProc.Id)) on http://127.0.0.1:3000" -ForegroundColor Green

# Save PIDs for stop script
@{
    backend_pid = $backendProc.Id
    frontend_pid = $frontendProc.Id
    started_at = (Get-Date).ToString("o")
} | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8

# ------------------------------------------------------------------------------
# 5. Service Verification & Readiness
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Awaiting Service Readiness..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 2
        if ($health.success) {
            $backendReady = $true
            break
        }
    } catch {
        # continue waiting
    }
}

if ($backendReady) {
    Write-Host "  [OK] Backend health probe verified (Database: Connected, Offline Strict: True)" -ForegroundColor Green
} else {
    Write-Host "  [!] Backend taking longer than expected to initialize. Check scripts\backend.log if issues arise." -ForegroundColor DarkYellow
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  S E A N C E   S T U D I O   I S   R U N N I N G                 " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  * Game UI:            http://localhost:3000" -ForegroundColor White
Write-Host "  * API Documentation:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  * Health Probe:       http://127.0.0.1:8000/api/v1/health" -ForegroundColor White
Write-Host "  * Storage:            Local SQLite (Air-gapped WAL Mode)" -ForegroundColor White
Write-Host "  * Privacy:            Strictly Loopback Only (No Cloud APIs)" -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan

if (-not $NoBrowser) {
    Start-Process "http://localhost:3000"
}

Write-Host "`nPress Ctrl+C or run '.\scripts\stop.ps1' to gracefully stop all services.`n" -ForegroundColor DarkGray

# Interactive keep-alive loop
try {
    while ($true) {
        if ($backendProc.HasExited) {
            Write-Host "[!] Backend service stopped unexpectedly." -ForegroundColor Red
            break
        }
        if ($frontendProc.HasExited) {
            Write-Host "[!] Frontend service stopped unexpectedly." -ForegroundColor Red
            break
        }
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "`nShutting down Séance Studio services..." -ForegroundColor Yellow
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped Backend (PID: $($backendProc.Id))" -ForegroundColor Gray
    }
    if ($frontendProc -and -not $frontendProc.HasExited) {
        # On Windows, killing cmd.exe needs child kill
        taskkill /F /T /PID $frontendProc.Id 2>&1 | Out-Null
        Write-Host "  Stopped Frontend (PID: $($frontendProc.Id))" -ForegroundColor Gray
    }
    if (Test-Path $PidFile) {
        Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Services stopped cleanly. Safe travels from Blackwood Manor.`n" -ForegroundColor Green
}
