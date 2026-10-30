param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $RootDir "backend"
$PytestExe = Join-Path $RootDir ".venv\Scripts\pytest.exe"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Seance Studio -- Executing Pytest Backend Test Suite      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $PytestExe)) {
    Write-Error "Pytest executable not found at $PytestExe."
    exit 1
}

Push-Location $BackendDir
try {
    & $PytestExe -v
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($exitCode -eq 0) {
    Write-Host "All backend tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host "Backend tests encountered failures. Exit code: $exitCode" -ForegroundColor Red
}

exit $exitCode
