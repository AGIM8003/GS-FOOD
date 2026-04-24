# FREE AI — model selection policy

**Status:** Human-facing contract. Not loaded by the engine at runtime.

## Policy modes

1. **PINNED_ONLY** — only explicit pins (from `providers.json` or `data/model_control_plane/pinned_models_by_lane.json` when present).
2. **LATEST_ALIAS_ALLOWED** — vendor `latest`-style IDs may be chosen only for explicitly marked sandbox-style lanes (see `src/routing/modelSelectionPolicy.js`).
3. **AUTO_PROMOTE_GOVERNED** — a catalog row must have `promotion_status: promoted` **and** `status: stable` before it can become the automatic choice; otherwise the pin wins.

There is **no** blind “always latest” swap: governed mode still requires promotion evidence in the catalog store.

## Runtime wiring

`ProviderRegistry` applies `orderModelsForProvider` after `selectModelCandidate` on each inference. Default `PINNED_ONLY` preserves existing `pinnedModel` + `candidates` try order.

## Governance (enterprise)

Changing `FREEAI_MODEL_SELECTION_MODE` away from `PINNED_ONLY`, or promoting catalog rows to `promoted`, should be **change-controlled**: named approver (e.g. ML platform owner), linked evidence (benchmarks, canary metrics), and rollback plan recorded outside the engine (ticket / CAB).
