param([string]$Path)
$errors=$null
[System.Management.Automation.Language.Parser]::ParseFile($Path,[ref]$null,[ref]$errors)
if ($errors -and $errors.Count -gt 0) { $errors | ForEach-Object { Write-Host $_.Message }; exit 1 } else { Write-Host "PARSE_OK $Path"; exit 0 }