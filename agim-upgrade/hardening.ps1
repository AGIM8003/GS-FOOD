<#
AGIM/Antigravity hardening helper.
This script audits service configuration and offers safe remediation options.
Run with `-Apply` to make changes; otherwise it only prints recommended actions.
#>

param(
    [switch]$Apply
)

function Get-ServiceInfo($name) {
    $svc = Get-Service -Name $name -ErrorAction SilentlyContinue
    if (-not $svc) { Write-Warning "Service $name not found"; return $null }
    $path = (Get-WmiObject -Class Win32_Service -Filter "Name='$name'").PathName
    return @{ Name=$svc.Name; Status=$svc.Status; Path=$path }
}

$svcName = 'McpManagementService'
$info = Get-ServiceInfo $svcName
if ($info) { Write-Host "Found service $($info.Name) Status:$($info.Status) Path:$($info.Path)" }

Write-Host 'Recommendation: run service under a least-privileged built-in account (LocalService) or a dedicated managed service account.'
if ($Apply) {
    Write-Host 'Applying recommended service account: NT AUTHORITY\LocalService'
    try {
        sc.exe config $svcName obj= "NT AUTHORITY\LocalService" password= "" | Write-Host
        Write-Host 'Service config updated. Restarting service...'
        Restart-Service -Name $svcName -Force -ErrorAction SilentlyContinue
    } catch { Write-Warning "Failed to change service account: $($_.Exception.Message)" }
}

# Lock down installation directory ACLs (read-only for Users). Requires admin when -Apply used.
$installDir = Join-Path $env:LOCALAPPDATA 'Programs\Antigravity'
if (Test-Path $installDir) {
    Write-Host "Install dir: $installDir"
    Write-Host 'Recommendation: ensure only Administrators and service account have write permission.'
    if ($Apply) {
        try {
            $acl = Get-Acl -Path $installDir
            $acl.Access | ForEach-Object { Write-Host "Existing ACL: $($_)" }
            # Remove 'Users' write permissions (dry-run: show command)
            icacls "$installDir" /remove:g Users | Write-Host
            Write-Host 'Applied ACL changes (icacls) to remove Users write permissions.'
        } catch { Write-Warning "ACL change failed: $($_.Exception.Message)" }
    }
} else { Write-Warning "Install directory not found: $installDir" }

Write-Host 'Hardening script finished. Review the actions above.'
