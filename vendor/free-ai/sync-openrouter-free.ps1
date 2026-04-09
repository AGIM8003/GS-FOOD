# FREEAI.md §34.1 — OpenRouter $0 / $0 models sync (allow/deny embedded; blueprint SSOT)
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Out = Join-Path $Root 'out'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

# Allowlist: trailing slash = id starts-with prefix; otherwise exact id (see §34.3)
$allowRaw = @(
  'google/gemini'
  'meta-llama/'
  'mistralai/'
  'qwen/'
)

$denyIds = @(
  # Add full model ids to exclude even if $0, e.g. 'vendor/unwanted-model'
)
$deny = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($d in $denyIds) { if ($d) { [void]$deny.Add($d) } }

function Test-AllowId([string]$id) {
  foreach ($rule in $allowRaw) {
    if ($rule.EndsWith('/')) {
      if ($id.StartsWith($rule, [StringComparison]::OrdinalIgnoreCase)) { return $true }
    } elseif ($id -eq $rule) { return $true }
  }
  return $false
}

$uri = 'https://openrouter.ai/api/v1/models'
$resp = Invoke-RestMethod -Uri $uri -Method Get
$free = New-Object System.Collections.Generic.List[object]
function Is-ZeroPrice([object]$v) {
  $s = [string]$v
  $d = 0.0
  if (-not [double]::TryParse($s, [ref]$d)) { return $false }
  return [math]::Abs($d) -lt 1e-12
}
foreach ($m in $resp.data) {
  if (-not (Is-ZeroPrice $m.pricing.prompt)) { continue }
  if (-not (Is-ZeroPrice $m.pricing.completion)) { continue }
  $id = [string]$m.id
  if (-not $id) { continue }
  if ($deny.Contains($id)) { continue }
  if (-not (Test-AllowId $id)) { continue }
  $free.Add($m) | Out-Null
}
$sorted = $free | Sort-Object @{Expression = { $_.context_length }; Descending = $true }, @{Expression = { $_.created }; Descending = $true }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$jsonPath = Join-Path $Out "openrouter-free-models-$stamp.json"
$idsPath = Join-Path $Out "openrouter-free-model-ids-$stamp.txt"
$sorted | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $jsonPath
$sorted | ForEach-Object { $_.id } | Set-Content -Encoding UTF8 $idsPath
Copy-Item $jsonPath (Join-Path $Out 'openrouter-free-models-latest.json') -Force
Copy-Item $idsPath (Join-Path $Out 'openrouter-free-model-ids-latest.txt') -Force

$prev = Join-Path $Out '.previous-ids.txt'
$currIds = $sorted | ForEach-Object { $_.id }
if (Test-Path $prev) {
  $old = Get-Content $prev | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  $newOnly = $currIds | Where-Object { $_ -notin $old }
  if ($newOnly.Count -gt 0) {
    Write-Host 'NEW FREE MODEL IDS (review for promotion):'
    $newOnly | ForEach-Object { Write-Host "  $_" }
    exit 2
  }
}
$currIds | Set-Content -Encoding UTF8 $prev
Write-Host "OK: $($sorted.Count) models written to $Out"
exit 0
