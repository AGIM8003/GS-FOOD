# Persona packs (vertical depth, optional — data only)

A **pack** is a small JSON manifest that **lists** persona ids (and optional hints) for one industry or workflow. In this repository scope, packs are **data-only scaffolding**: they do not change engine code paths unless a host integration explicitly reads them.

- **Template:** [`_template/manifest.json`](_template/manifest.json) — required keys: `pack_id`, `version`, `title`, `description`, `persona_ids`, `skill_ids` (arrays may be empty). Optional: `eval_hints`.
- **Example:** [`design-interiors/manifest.json`](design-interiors/manifest.json) — references the existing persona id `neo_design_expert` (see `personas/neo_design_expert.json`).
- **Layout:** one directory per pack under `personas/packs/<pack-id>/` with a `manifest.json`. Directories whose names start with `_` are skipped by discovery helpers in `src/packs/packLoader.js`.

Packs do **not** auto-mount into `payload.persona` today; hosts may copy patterns from `GET /admin/packs` output if desired.
