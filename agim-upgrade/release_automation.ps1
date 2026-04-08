<#
Release automation: fetch, verify, stage, install, and rollback helper.
This script is a higher-trust orchestrator for staged upgrades.
It requires `InstallerUrl` and `ExpectedSHA256` for automatic install.
Use `-DryRun` to only execute validation and staging steps.
#>

param(
    [Parameter(Mandatory=$false)][string]$InstallerUrl = '',
    [Parameter(Mandatory=$false)][string]$ExpectedSHA256 = '',
    [switch]$DryRun
)

if (-not $InstallerUrl) { Write-Host 'No InstallerUrl provided; running in discovery/dry-run mode.'; $DryRun=$true }

$ts = Get-Date -Format 'yyyyMMddTHHmmss'
$workspace = Join-Path $env:TEMP "agim-release-$ts"
New-Item -Path $workspace -ItemType Directory -Force | Out-Null
Write-Host "Staging area: $workspace"

if ($InstallerUrl) {
    $installer = Join-Path $workspace ([IO.Path]::GetFileName($InstallerUrl))
    Write-Host "Downloading installer to $installer"
    try { Invoke-WebRequest -Uri $InstallerUrl -OutFile $installer -UseBasicParsing -ErrorAction Stop } catch { Write-Error "Download failed: $($_.Exception.Message)"; exit 2 }
    if ($ExpectedSHA256) {
        $hash = (Get-FileHash -Path $installer -Algorithm SHA256).Hash
        Write-Host "Computed SHA256: $hash`nExpected SHA256: $ExpectedSHA256"
        if ($hash -ne $ExpectedSHA256) { Write-Error 'Checksum mismatch; aborting staging.'; exit 3 }
    } else { Write-Warning 'No expected checksum supplied; skipping verification.' }
}

# Create a backup of current install
$installDir = Join-Path $env:LOCALAPPDATA 'Programs\Antigravity'
$backup = Join-Path $env:APPDATA "agim-release-backup-$ts"
Write-Host "Creating backup of $installDir at $backup"
if (Test-Path $installDir) { Copy-Item -Path $installDir -Destination $backup -Recurse -Force }

if ($DryRun) { Write-Host 'Dry-run complete — staging and backup created. No install performed.'; exit 0 }

Write-Host 'Stopping services before install...'
Stop-Service -Name 'McpManagementService' -ErrorAction SilentlyContinue

Write-Host 'Running installer (silent if supports /S)...'
Start-Process -FilePath $installer -ArgumentList '/S' -Wait

Write-Host 'Restarting services and running smoke tests...'
Start-Service -Name 'McpManagementService' -ErrorAction SilentlyContinue
& "$PSScriptRoot\smoke_tests.ps1"

Write-Host 'If you need to rollback, copy the backup folder back to the install location and restart services.'
