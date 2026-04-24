# Release evidence checklist (copy per release)

**Release version / tag:**  
**Engine root (vendored path):**  
**Date:**  

## Automated artifacts

- [ ] `node scripts/quality_gate.js` (or `--fast` only if policy allows) — attach `quality_gate.json`
- [ ] `node scripts/run_all_tests.js` (if not already inside full quality gate)
- [ ] `node scripts/generate_sbom.js` — attach `dist/sbom.json` or copy from evidence pack
- [ ] `node scripts/collect_release_evidence.js` — attach output folder from `dist/release-evidence-*` or `EVIDENCE_OUT`

## Human / org

- [ ] [ENTERPRISE_CONTROL_MATRIX.md](../ENTERPRISE_CONTROL_MATRIX.md) reviewed for this release’s control changes
- [ ] [ENTERPRISE_DATA_GOVERNANCE_CHECKLIST.md](../ENTERPRISE_DATA_GOVERNANCE_CHECKLIST.md) updated if data classes / retention changed
- [ ] Proxy / TLS / auth configuration snapshot (link to internal wiki or GitOps commit)

## Drills (rolling)

- [ ] Tabletop or key rotation exercise this quarter — [TABLETOP_DRILL_RECORD.md](TABLETOP_DRILL_RECORD.md)

## Notes

_Add links to tickets, pen-test scope updates, or vendor questionnaires._
