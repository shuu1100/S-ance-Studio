# Séance Studio — Frontend Development Launcher
# Starts the Next.js local development server on http://127.0.0.1:3000

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host " Séance Studio — Victorian Gothic Mystery UI (Phase 1)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Target URL: http://127.0.0.1:3000" -ForegroundColor Cyan
Write-Host "Mode: Air-gapped Local Workstation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Yellow

Set-Location "$PSScriptRoot\..\frontend"

npm run dev -- -p 3000
