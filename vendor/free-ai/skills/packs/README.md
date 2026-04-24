# Skill packs (vertical depth, optional — data only)

Same idea as [`personas/packs/`](../personas/packs/README.md): a **manifest** that **lists** skill ids for an industry or program. Skills themselves stay under `skills/`; **`skills/active_catalog.json`** remains authoritative for what the engine may load.

- **Template:** mirror persona pack shape (`pack_id`, `version`, `title`, `description`, plus arrays your host agrees on). See persona `_template/manifest.json` for minimal key set.
- **Scope:** data-only unless the host reads manifests and maps ids into requests.

Host projects may add `skills/packs/<vertical>/manifest.json` and prefer those ids when `tenant` or `vertical` matches—outside the core engine unless wired by the host.
