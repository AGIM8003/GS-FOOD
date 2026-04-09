$path = 'd:\GITHUB RESPIRATORY\FREE AI\FREEAI.md'
$text = Get-Content $path -Raw
$matches = [regex]::Matches($text, '```json\s*(.*?)\s*```', 'Singleline')
if ($matches.Count -eq 0) { Write-Host 'No JSON fences found'; exit 0 }
$i = 0
foreach ($m in $matches) {
  $i++
  $block = $m.Groups[1].Value.Trim()
  Write-Host ('--- JSON block #' + $i + ' ---')
  try {
    $null = $block | ConvertFrom-Json -ErrorAction Stop
    Write-Host ('JSON_BLOCK_OK #' + $i)
  } catch {
    Write-Host ('JSON_BLOCK_ERROR #' + $i + ': ' + $_.Exception.Message)
    # write first 20 lines of block for debugging
    $block -split '\r?\n' | Select-Object -First 20 | ForEach-Object { Write-Host $_ }
  }
}
exit 0
