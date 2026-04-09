# FREEAI.md §34.7 — multi-vendor free-tier probe (blueprint)
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Out = Join-Path $Root 'out'
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$vendors = @(
  @{ id='openrouter'; name='OpenRouter'; url='https://openrouter.ai/api/v1/models'; type='json' },
  @{ id='openai'; name='OpenAI'; url='https://api.openai.com/v1/models'; type='json' },
  @{ id='anthropic'; name='Anthropic'; url='https://api.anthropic.com/v1/models'; type='json' },
  @{ id='gemini'; name='Google Gemini'; url='https://api.openrouter.ai/bridge/google/models'; type='json' },
  @{ id='grok'; name='xAI Grok'; url='https://api.grok.ai/models'; type='json' },
  @{ id='deepseek'; name='DeepSeek'; url='https://api.deepseek.ai/models'; type='json' },
  @{ id='regional-cn'; name='Regional CN providers'; url='https://example.cn/providers/list'; type='html' }
)

function Probe-Vendor($v) {
  $stamp = (Get-Date).ToString('o')
  $out = @{ vendor=$($v.id); checked_at_utc=$stamp; detected_free_models= @(); notes = ''; status = 'no-data' }
  try {
    $resp = Invoke-RestMethod -Uri $v.url -Method Get -ErrorAction Stop -TimeoutSec 15
    if ($null -ne $resp) {
      # Try structured JSON detection first
      $models = @()
      if ($resp -is [System.Collections.IEnumerable]) { $models = $resp }
      elseif ($resp.data) { $models = $resp.data }
      foreach ($m in $models) {
        # defensive parsing: check common fields
        $id = $null
        if ($m.id) { $id = [string]$m.id }
        if ($m.model) { $id = [string]$m.model }
        if (-not $id) { continue }
        $pricePrompt = $null
        $priceCompletion = $null
        if ($m.pricing -and $m.pricing.prompt) { $pricePrompt = [string]$m.pricing.prompt }
        if ($m.pricing -and $m.pricing.completion) { $priceCompletion = [string]$m.pricing.completion }
        if ($pricePrompt -eq '0' -or $pricePrompt -eq '0.0' -or $pricePrompt -eq '0.00' -or $pricePrompt -eq 'free') {
          $out.detected_free_models += $id
        } elseif ($priceCompletion -eq '0' -or $priceCompletion -eq 'free') {
          $out.detected_free_models += $id
        }
      }
      if ($out.detected_free_models.Count -gt 0) { $out.status = 'ok' }
      else { $out.status = 'ok' ; $out.notes = 'no-obvious-zero-pricing-found' }
    }
  } catch {
    # fallback HTML fetch and keyword scan
    try {
      $html = Invoke-RestMethod -Uri $v.url -Method Get -ErrorAction Stop -TimeoutSec 15
      if ($html -match 'free|trial|credit|no-cost|0\s*(usd|dollars|€)') {
        $out.status = 'ok'
        $out.notes = 'keywords-found-in-html'
      } else { $out.status = 'error'; $out.notes = $_.Exception.Message }
    } catch {
      $out.status = 'error'; $out.notes = $_.Exception.Message
    }
  }
  return $out
}

$results = @()
foreach ($v in $vendors) { $results += Probe-Vendor $v }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$path = Join-Path $Out "vendor-free-snapshot-$stamp.json"
$results | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $path
Write-Host "Wrote vendor probe snapshot to $path"
if ($results | Where-Object { $_.detected_free_models.Count -gt 0 }) { exit 2 } else { exit 0 }
