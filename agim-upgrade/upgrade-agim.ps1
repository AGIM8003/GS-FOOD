<#
Safe AGIM/Antigravity upgrade orchestrator.
Edit the `$InstallerUrl` and `$ExpectedSHA256` variables before running.
Run from an elevated PowerShell prompt when you are ready to perform the upgrade.
#>

param(
    [string]$InstallerUrl = '',
    [string]$ExpectedSHA256 = ''
)

function Require-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) { Write-Warning 'This script is not running elevated. Please re-run in an elevated PowerShell.'; return $false }
    return $true
}

if (-not (Require-Admin)) { exit 1 }

$ts = Get-Date -Format 'yyyyMMddTHHmmss'
$installDir = Join-Path $env:LOCALAPPDATA 'Programs\Antigravity'
if (-not (Test-Path $installDir)) { Write-Warning "Antigravity install directory not found at $installDir" }

$backupRoot = Join-Path $env:APPDATA "Antigravity-upgrade-backup-$ts"
Write-Host "Creating backup at: $backupRoot"
New-Item -Path $backupRoot -ItemType Directory -Force | Out-Null
if (Test-Path $installDir) { Copy-Item -Path $installDir -Destination $backupRoot -Recurse -Force }

if (-not $InstallerUrl) { Write-Host 'No InstallerUrl provided. Exiting after backup.'; exit 0 }

$tempInstaller = Join-Path $env:TEMP "Antigravity-installer-$ts.exe"
Write-Host "Downloading installer to $tempInstaller"
try { Invoke-WebRequest -Uri $InstallerUrl -OutFile $tempInstaller -UseBasicParsing -ErrorAction Stop } catch { Write-Error "Download failed: $($_.Exception.Message)"; exit 2 }

if ($ExpectedSHA256) {
    Write-Host 'Verifying checksum...'
    $computed = (Get-FileHash -Path $tempInstaller -Algorithm SHA256).Hash
    Write-Host "Computed: $computed`nExpected: $ExpectedSHA256"
    if ($computed -ine $ExpectedSHA256) { Write-Error 'Checksum mismatch — aborting upgrade.'; exit 3 }
}

# Stop related services before install
$svcNames = @('McpManagementService')
foreach ($s in $svcNames) {
    $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') { Write-Host "Stopping service $s"; Stop-Service -Name $s -Force -ErrorAction SilentlyContinue }
}

Write-Host 'Starting installer (may prompt for elevation).'
try {
    Start-Process -FilePath $tempInstaller -ArgumentList '/S' -Wait -NoNewWindow
} catch {
    Write-Warning 'Installer execution failed; you may need to run manually with elevated rights.'
}

# Restart services and run smoke tests
foreach ($s in $svcNames) { try { Start-Service -Name $s -ErrorAction SilentlyContinue } catch {} }

Write-Host 'Running smoke tests...'
& "$PSScriptRoot\smoke_tests.ps1"

Write-Host "Upgrade orchestration finished. Backup kept at: $backupRoot"
