<#
.SYNOPSIS
    Séance Studio — Graceful Process Stopper
.DESCRIPTION
    Stops only the backend and frontend processes recorded by launch.ps1,
    or frees ports 8000/3000 if orphaned.
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $ScriptDir ".running_pids.json"

Write-Host "Stopping Séance Studio services..." -ForegroundColor Yellow

if (Test-Path $PidFile) {
    try {
        $pids = Get-Content $PidFile -Raw | ConvertFrom-Json
        if ($pids.backend_pid) {
            Stop-Process -Id $pids.backend_pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped Backend process (PID $($pids.backend_pid))" -ForegroundColor Gray
        }
        if ($pids.frontend_pid) {
            taskkill /F /T /PID $pids.frontend_pid 2>&1 | Out-Null
            Write-Host "  Stopped Frontend process (PID $($pids.frontend_pid))" -ForegroundColor Gray
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Host "  Could not read PID tracking file: $_" -ForegroundColor DarkGray
    }
}

# Fallback check for any listening node / uvicorn on ports 8000 / 3000
foreach ($port in @(8000, 3000)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $conns) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and ($proc.ProcessName -match "python|node|uvicorn")) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  Cleaned up process on port $port (PID $($proc.Id))" -ForegroundColor Gray
        }
    }
}

Write-Host "Séance Studio services have been stopped successfully." -ForegroundColor Green
