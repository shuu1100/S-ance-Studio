param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$PythonExe = Join-Path $RootDir ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Seance Studio -- Full Stack Verification & Status        " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Run Backend Pytest Suite
Write-Host "`n[1/3] Running Backend Pytest Suite..." -ForegroundColor Yellow
& (Join-Path $ScriptDir "test-backend.ps1")
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backend test suite failed."
    exit 1
}

# 2. Run Frontend Unit Tests
Write-Host "`n[2/3] Running Frontend Unit Tests..." -ForegroundColor Yellow
Push-Location $FrontendDir
try {
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend test suite failed."
        exit 1
    }
}
finally {
    Pop-Location
}

# 3. Check Local AI Service Reachability
Write-Host "`n[3/3] Checking Local Ollama AI Daemon (127.0.0.1:11434)..." -ForegroundColor Yellow
try {
    $ollamaCheck = curl.exe -s http://127.0.0.1:11434/api/tags
    if ($ollamaCheck -match "qwen3:4b") {
        Write-Host "Local Ollama daemon is active with model 'qwen3:4b' available!" -ForegroundColor Green
    } else {
        Write-Host "Local Ollama daemon responded, but qwen3:4b was not found in tags." -ForegroundColor DarkYellow
    }
} catch {
    Write-Host "Ollama daemon not detected on port 11434. Scripted deterministic atmosphere engine will be used." -ForegroundColor DarkYellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Seance Studio Full Stack Verification: PASSED" -ForegroundColor Green
Write-Host " Backend dev server: powershell -File .\scripts\dev-backend.ps1" -ForegroundColor Gray
Write-Host " Frontend dev server: powershell -File .\scripts\dev-frontend.ps1" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
