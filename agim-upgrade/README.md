AGIM Command-Server Upgrade & Hardening

This folder contains scripts and guidance to perform a staged, auditable upgrade
and hardening of the AGIM / Antigravity command-server on Windows.

Primary files:
- `upgrade-agim.ps1` — orchestrates a safe upgrade (backup -> download -> verify -> install -> smoke tests).
- `verify-checksum.ps1` — helper to compute and compare SHA256 checksums.
- `smoke_tests.ps1` — lightweight HTTP/service/process checks to validate basic functionality.
- `db_maintenance.sql` — suggested SQL commands for Postgres; Redis tuning notes included.

Usage notes:
- Inspect and edit `upgrade-agim.ps1` to set the `InstallerUrl` and `ExpectedSHA256`.
- Run the scripts from an elevated PowerShell prompt when prompted. The scripts will not perform destructive actions without confirmation.
- Keep backups created by `upgrade-agim.ps1` until you validate the upgrade.

Security:
- The scripts verify file checksums before attempting installs. Always verify signatures if available and prefer signed installers.

If you want, I can now run the audit-derived automated upgrade dry-run (no install) and show the prepared backup and verification results.
