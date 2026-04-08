<#
Simple watchdog to ensure AGIM-related services are running.
This creates an optional scheduled task or can be run as a background loop.
Run with `-CreateTask` to create a scheduled task that runs every 5 minutes.
#>

param(
    [switch]$CreateTask,
    [int]$IntervalSeconds = 30
)

$svcName = 'McpManagementService'

function CheckAndRestart {
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if (-not $svc) { Write-Warning "Service $svcName not found"; return }
    if ($svc.Status -ne 'Running') {
        Write-Warning "Service $svcName is $($svc.Status). Attempting start..."
        try { Start-Service -Name $svcName -ErrorAction Stop; Write-Host "Started $svcName" } catch { Write-Warning "Start failed: $($_.Exception.Message)" }
    }
}

if ($CreateTask) {
    $action = New-ScheduledTaskAction -Execute 'PowerShell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSScriptRoot\watchdog.ps1`""
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)
    Register-ScheduledTask -TaskName 'AGIM-Watchdog' -Action $action -Trigger $trigger -RunLevel Highest -Force
    Write-Host 'Scheduled task AGIM-Watchdog created (runs every 5 minutes).' ; exit 0
}

Write-Host "Starting watchdog loop (check interval: $IntervalSeconds seconds). Press Ctrl+C to stop."
while ($true) {
    CheckAndRestart
    Start-Sleep -Seconds $IntervalSeconds
}
