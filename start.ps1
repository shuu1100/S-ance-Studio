# Séance Studio — 1-Click Launch Entrypoint
param([switch]$NoBrowser)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptDir "scripts\launch.ps1") -NoBrowser:$NoBrowser
