# Regenerate android/ and ios/ for an existing Flutter app (Windows).
# Requires Flutter on PATH.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Error "Flutter not found on PATH. Install Flutter and reopen the terminal."
}

flutter create . --org com.foodguide --project-name food_guide_app --platforms=android,ios
Write-Host "Done. Set android/local.properties (flutter.sdk, sdk.dir) if needed, then: flutter run"
