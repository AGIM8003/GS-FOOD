/**
 * Canonical forbidden-token rules for SSOT boundary scans.
 * This file lives under tests/ (not scanned by ssot_boundary) so it may name tokens explicitly.
 *
 * Scanned directories: only `src/` and `scripts/` — see tests/ssot_boundary.test.js and AGENTS.md.
 */
const X = 'X-NEW-VERINOX-AI';
const V = 'VERINOX';

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @type {{ id: string, pattern: RegExp, label: string }[]} */
export const FORBIDDEN_RULES = [
  { id: 'sibling_repo_path', pattern: new RegExp(escapeRe(X), 'i'), label: X },
  { id: 'legacy_product_name', pattern: new RegExp(`\\b${escapeRe(V)}\\b`, 'i'), label: V },
];
