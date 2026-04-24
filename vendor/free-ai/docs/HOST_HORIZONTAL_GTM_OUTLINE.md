# Host horizontal GTM outline (Phase 4 — not engine runtime)

This file lives in the FREE AI tree **only as a portable checklist** for the **host organization** after they copy the engine.

**Hard boundary:** The Node engine under `src/` and maintenance scripts under `scripts/` **never** read, parse, or `import` this path. It is **not** configuration, not a feature flag, and not part of request handling. A regression test (`tests/gtm_separation.test.js`) asserts that no `src/**/*.js` or `scripts/**/*.js` file embeds the contiguous filename token `HOST_HORIZONTAL_GTM_OUTLINE` (generated kit text is out of scope for that scan).

Marketing, partnerships, and public docs belong in the **host repo** or separate GTM properties—not inside the vendored engine’s runtime path.

## After full engine copy

1. **Positioning:** One sentence: what the host product does + that AI is local/governed (cite `FREEAI.md` internally, not in public legal unless counsel approves).
2. **Segments (horizontal):** List 3–5 ICPs (role × industry) that share the same HTTP contract (`/v1/infer`, `/v1/stream`).
3. **Proof:** One anonymized latency or quality screenshot; link to admin routes only on private demos (`/admin/health-composite`, `/admin/metrics-summary`).
4. **PLG / sales:** Self-serve API key flow in the **host** app; FREE AI stays bind-local unless the host exposes it through their gateway.
5. **Partners:** API marketplaces or OEM wording in **host** legal templates—do not fork `FREEAI.md` into partner contracts without review.

## Forbidden

- Pointing customer traffic at a **shared** checkout of this source repo (violates copy-only policy in `AGENTS.md`).
- Embedding tracking pixels or third-party analytics **inside** the copied `src/` tree without host security review.

## Optional vertical slice for GTM

Reuse `personas/packs/` and `skills/packs/` manifests to name industry packs in sales decks; ship domain data only through host-approved channels.
