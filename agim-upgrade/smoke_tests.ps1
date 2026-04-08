param(
    [int[]]$Ports = @(8080,3000,80),
    [string]$HealthPath = '/health'
)

Write-Host "Running smoke tests for AGIM/Antigravity (ports: $($Ports -join ', '))"

foreach ($port in $Ports) {
    $url = "http://127.0.0.1:$port$HealthPath"
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 6 -ErrorAction Stop
        Write-Host "[$port] HTTP $($resp.StatusCode): $url"
    } catch {
        Write-Warning "[$port] no response at $url: $($_.Exception.Message)"
    }
}

# Check expected services and processes
$svcNames = @('McpManagementService')
foreach ($s in $svcNames) {
    $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
    if ($svc) { Write-Host "Service $s: $($svc.Status)" } else { Write-Warning "Service $s not found" }
}

# Top CPU processes snapshot
Get-Process | Sort-Object CPU -Descending | Select-Object -First 8 Id,ProcessName,CPU,WorkingSet | Format-Table -AutoSize
