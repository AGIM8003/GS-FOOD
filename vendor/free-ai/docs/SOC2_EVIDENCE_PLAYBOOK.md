# FREE AI — SOC2-style evidence playbook (not a certification)

**Status:** Human-facing. This repository does **not** grant SOC2 Type II; it helps you **collect evidence** for a program your organization runs.

## Evidence types

1. **Automated:** CI workflow runs (`quality_gate --fast`, `run_all_tests`), artifact URLs or logs.
2. **Configuration:** Redacted screenshots or exported IaC showing `127.0.0.1` bind, proxy auth, env var names (not values).
3. **Process:** PR templates, code review policy, access reviews for Git org.
4. **Operational:** Runbook execution logs (incident, key rotation).

## Mapping

Use [ENTERPRISE_CONTROL_MATRIX.md](ENTERPRISE_CONTROL_MATRIX.md) as the index; attach SBOM (`dist/sbom.json`) per release from `node scripts/generate_sbom.js`.

## Cadence

- **Weekly:** dependency audit (`npm audit`), metrics spot-check.
- **Per release:** full test suite, integration kit rebuild, control matrix row updates.
