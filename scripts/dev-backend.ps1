param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$PythonExe = Join-Path $RootDir ".venv\Scripts\python.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Seance Studio -- Launching Authoritative Backend Service  " -ForegroundColor Yellow
Write-Host " Host: 127.0.0.1:8000  (Loopback Only)                   " -ForegroundColor Green
Write-Host " Database: SQLite WAL mode                                " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $PythonExe)) {
    Write-Error "Virtual environment python not found at $PythonExe. Please initialize .venv first."
    exit 1
}

# Run alembic migrations prior to starting server
Write-Host "Verifying database migrations..." -ForegroundColor DarkGray
& $PythonExe -m alembic -c (Join-Path $BackendDir "alembic.ini") upgrade head

# Start uvicorn
Write-Host "Starting Uvicorn server on http://127.0.0.1:8000..." -ForegroundColor Green
& $PythonExe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --app-dir $BackendDir
