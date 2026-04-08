param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(Mandatory=$true)][string]$ExpectedSHA256
)

if (-not (Test-Path $FilePath)) {
    Write-Error "File not found: $FilePath"; exit 2
}

$sha256 = Get-FileHash -Path $FilePath -Algorithm SHA256 | Select-Object -ExpandProperty Hash
Write-Host "Computed SHA256: $sha256"
if ($sha256 -ieq $ExpectedSHA256) {
    Write-Host "Checksum OK"; exit 0
} else {
    Write-Error "Checksum MISMATCH"; exit 3
}
