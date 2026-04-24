#!/usr/bin/env bash
# FREEAI.md §34.2 — delegates to §34.1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoProfile -File "$ROOT/sync-openrouter-free.ps1"
fi
echo "Install pwsh (PowerShell 7+) and re-run, or run: pwsh -File $ROOT/sync-openrouter-free.ps1"
exit 1
