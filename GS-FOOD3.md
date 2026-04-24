FOOD GUIDE APP — MASTER BLUEPRINT (GS-FOOD3)

====================================================================
DOCUMENT CONTROL (ENTERPRISE)
====================================================================

| Field | Value |
|-------|--------|
| Document ID | FG-BLUEPRINT-GS-FOOD3 |
| Document title | Food Guide App — Master Blueprint |
| Version | 6.0.0 ENTERPRISE (PROGRAM HANDOFF BASELINE) |
| Status | AUTHORITATIVE — approved baseline for program kickoff; implement **§1–35**; Appendices C–D audit-only per §31.2 |
| Language of record | English (US) |
| Classification | INTERNAL — distribution per organizational information-security policy |
| Repository policy | **This file is the sole blueprint artifact in scope.** Source code, JSON Schema files, OpenAPI definitions, CI/CD pipelines, and binaries SHALL be governed under the organization’s configuration-management (CM) system and are **not** embedded herein. |

**Stakeholder RACI (summary)**  
- **Accountable (A):** Product Steering Committee — scope, prioritization, major capability changes.  
- **Responsible (R):** Engineering Lead — implementation conformance; Safety & Curation Lead — Tier-1 knowledge accuracy; Security Lead — controls alignment.  
- **Consulted (C):** Legal, Privacy Office, Enterprise Architecture, SRE / Platform.  
- **Informed (I):** Support, GTM, strategic partners.

**Conformance keywords**  
The keywords **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are interpreted per IETF BCP 14 ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) / [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when shown in UPPERCASE in normative sections.

**Planned review cadence**  
Minor review: quarterly alignment with roadmap and regulatory watchlist. Major revision: at each major product release, material regulatory change, or post-incident corrective action.

**Revision history (abridged)**  
| Ver | Summary |
|-----|---------|
| 6.0.0 | **Final blueprint handoff:** **HANDOFF** section (how to use doc); **§17.5** `UX-AC-01`–`UX-AC-11` traceability to §17.1 for QA; v6 baseline — ready for program execution. |
| 5.0.5 | **§17.1** user-centered experience commitments; cross-section alignment (§3, §5, §8–9, §12, §19, §26, §33); SUMMARY/COPY/changelog/footer. |
| 5.0.4 | Program-wide alignment to **§5**: §14 acceptance; §23 roadmap table; §13 MVP vs Phase 1.5+ paths; §15–§19 cross-links; §1, PURPOSE, SUMMARY, §31.1, §36, COPY, changelog/footer. |
| 5.0.3 | **§5** expanded: capability tiers (MVP → Phase 3), architectural layers, primary & cross-cutting flows; SUMMARY + reading guide point to capability model. |
| 5.0.2 | Archival **NOTICE** blocks at Appendices C–D: verbatim GS-FOOD1/2 are audit-only; implementation **SHALL** follow **§1–35** (§31.2). |
| 5.0.1 | Editorial pass: cross-reference fixes (§25/§10); RFC 2119 in §6.1; **ApiErrorEnvelope** label in §13/§32.1; CM-neutral backend (§22); **OfflineModelBundleManifest** in §34.4; §31.2 wording; governance (blueprint vs packs); SUMMARY appendix bullet. |
| 5.0 | Enterprise document control; repository limited to this blueprint; artifact register without repo paths; enterprise NFR & governance §35; Full Source Merge §36. |
| 4.0 | Cook mode §33; three-tier AI §34; API extensions. |
| ≤3.x | Prior compliance layers, API error registry evolution, appendices C–D. |

====================================================================
PURPOSE & SCOPE
====================================================================

This document is the **canonical enterprise blueprint** for the Food Guide App: product intent, system architecture, data and AI governance, regulatory positioning, API responsibilities, security and privacy expectations, operational runbooks at the policy level, and quality gates. **Release-tier capabilities, architectural layers, and end-to-end flows** are specified in **§5** and referenced throughout. **How to start the program** (roles, gates, traceability) is in the **HANDOFF** section following the Reading Guide. It merges and preserves the historical content of GS-FOOD1.md and GS-FOOD2.md as Appendices C–D for audit traceability.

**Out of scope for this file:** implementation source trees, infrastructure-as-code, signing keys, runtime secrets, and machine-readable schema **files** (which SHALL exist under CM with names aligned to §31.3).

====================================================================
READING GUIDE
====================================================================

- **Executives / PM:** **HANDOFF** (program start), §1–3, **§5** (what ships when), **§17.1** (how the product should *feel* to users), §14, §23–24, §28–29, §35 (enterprise NFR), §36 (appendix note).  
- **Engineering:** §5 (capability model & flows), §6–7, §11–13, §27–29, §31–34; API contract ownership per §13.  
- **AI / ML:** §11, §33–34; model governance §30.3, §34.4, §35.  
- **Safety / legal / curation:** §4, §16, §26–27, §30, §33.6, §35.2; Appendices C–D (historical).  
- **Security / GRC:** §26–27, §29–30, §35.  
- **QA / test:** §15 (golden + tags); **§17.5** acceptance IDs (`UX-AC-01`–`UX-AC-11`) ↔ §17.1; §28.2 accessibility protocol.

====================================================================
HANDOFF: USING THIS BLUEPRINT (PROGRAM START)
====================================================================

This file is **ready to drive** product, engineering, legal review, and QA **without further structural additions** unless scope or regulation changes.

1. **What to implement** — Treat **§1–35** as the **only** normative specification. **Appendix C** and **Appendix D** are **verbatim archives** for lineage; on any conflict, **§1–35 wins** (§31.2).  
2. **What lives outside this file** — Source code, OpenAPI, JSON Schemas, keys, and binaries sit under **configuration management (CM)** per **§31.3** and repository policy in Document Control.  
3. **Sequencing** — Use **§23** (roadmap) with **§5.1** tiers and **§14** release acceptance. Phase 0 → 1 → 1.5 → 2 → 3 **SHALL** not skip safety or golden-set gates in **§15**.  
4. **Quality gates** — **MVP:** satisfy **§5.1 MVP**, **§14**, **§15** (including adversarial subset), and **§17.1** proven by **§17.5** IDs with **MUST** in the MVP column (plus **SHOULD** items as team policy). **Legal:** **§26–27** and Compliance Appendix Summary; final copy **SHALL** be lawyer-reviewed. **Enterprise ops:** **§30**, **§35** as applicable.  
5. **Traceability** — Map backlog items and tests to **§5** flow tags (§15), **`rule_id`** (§6.1), and **`UX-AC-*`** (§17.5).  
6. **Change control** — Blueprint edits follow Document Control; pack/rule content follows the pack pipeline (changelog governance block). Baseline identity: **Document ID** `FG-BLUEPRINT-GS-FOOD3`, **Version** in the control table above.

====================================================================
SUMMARY
====================================================================
This document consolidates two working specifications into one authoritative blueprint. **Program handoff** instructions (how to use this file) are in the **HANDOFF** section after the Reading Guide. It contains:
- Product thesis, identity, and non-goals
- Evidence hierarchy and authoritative sources
- **Capability model:** release-tier inventory, architectural layers, primary and cross-cutting flows (§5)
- Knowledge model and JSON schema summary
- Rule engine specification and examples
- Region & culture adaptation engine
- Pack and update management
- On-device AI implementation details
- Cloud enhancement principles and privacy rules
- API surface and pack manifest examples
- MVP & release acceptance (§14) tied to **§5** tiers; roadmap (§23); evaluation & golden-set (§15)
- **User-centered experience commitments** — how the app *feels* in a real kitchen (§17.1); **QA traceability** via acceptance test IDs **§17.5** (`UX-AC-01`–`UX-AC-11`)
- Safety, legal, and privacy commitments
- Team workstreams, release, and operational guidance
- Regulatory positioning, privacy law map, allergen policy (§26)
- Multi-jurisdiction authorities, dataset licensing, date-label rules (§27)
- Competitive matrix, WCAG 2.2 AA, edge-scenario packs (§28)
- Local encryption, sync policy, adversarial evaluation, answer transparency (§29)
- Incident runbooks, correction SLA, model/pack governance (§30)
- Reading guide & enterprise artifact register (§31); API reliability & platform excellence (§32)
- Canonical `rule_id` naming (§6.1); HTTP API contract **SHALL** be maintained as OpenAPI 3.1 under CM (§13)
- Cook / recipe mode, Stories-style capture, meal-time & cuisine context (§33)
- Three-tier AI (local light + device-integrated + cloud), downloadable offline models, auto-upgrade (§34)
- **Enterprise** non-functional requirements, resilience, IAM, audit, data residency (§35)
- Verbatim historical specifications for audit only: **Appendix C–D** (§36); each opens with an **ARCHIVAL NOTICE** — **§1–35** remains authoritative

This file is the **authoritative enterprise blueprint**; it SHALL be version-controlled, reviewed per Document Control, and not forked for delivery without a controlled baseline.

====================================================================
1. EXECUTIVE DECISION
====================================================================

Build:
- a free mobile app
- no mandatory authentication
- offline-first
- local-first AI
- optional cloud enhancement
- region-aware and culture-aware
- camera-first
- short-answer-first

Do not build:
- a recipe-library / meal-planner ERP as the primary product (no mandatory shopping-list–first or thousand-recipe CMS)
- a pantry spreadsheet clone
- a heavy household ERP
- a medical or scientific claim engine

Also build (Cook mode — integrated, optional):
- Recipe and meal ideas from what the user has (photo “Stories” flow, pantry/shelf context, text ask)
- Meal-time awareness (breakfast / lunch / dinner / snack) from local clock + locale conventions
- Cuisine and “kitchen tradition” filters (user: “something Turkish / Oaxacan / Punjabi home-style”) layered on region packs
- All recipe output still subject to safety hierarchy: allergens from third-party data only with §26.4 disclaimers; storage/use-first core remains authoritative

Core product promise:
Take a picture or ask a question. Get a direct answer:
- where to store food
- what should stay together
- what should stay apart
- what to use first
- how to use it in your local food culture
- (Cook) what to cook next from what you see or have, in short steps, localized

**Capability program:** normative breakdown of MVP → Phase 3 features, runtime layers, and cross-cutting obligations is in **§5** (use with §14 for scope decisions).

====================================================================
2. DEEP EVALUATION OF EXISTING OPEN-SOURCE / OPEN DATA OPTIONS
====================================================================

2.1 What already exists

A. Food storage reference
- USDA FoodKeeper — storage categories, freshness windows, quality guidance; strong seed source for structured storage rules.

B. Open product / barcode data
- Open Food Facts — barcode lookups, product naming, ingredients, packaging, categories; good as enrichment.

C. Open-source pantry / kitchen systems (benchmarks)
- Grocy, KitchenOwl, Mealie, RecipeSage, Norish, Pantry, and smaller GitHub projects.

2.2 What those products do well

Grocy: inventory, shopping, stock tracking, household management, barcode workflows.
KitchenOwl: grocery list, recipes, meal planning, Flutter frontend.
Mealie: recipe mgmt, meal planning, import recipes, self-hosting pattern.
RecipeSage, Norish, Pantry: collaborative recipes, modern household workflows.
FoodKeeper: authoritative storage guidance baseline.
Open Food Facts: barcode/product enrichment and localization.

2.3 Market gap

Existing tools do not center on: "What should I do with this food right now?"
Opportunity: camera-first guidance, local cultural adaptation, keep-with/keep-apart advice, offline-first UX, region-aware answers without login, short direct actions.

2.4 Reuse vs copy

Reuse: barcode flows, pantry patterns, localization patterns, self-hosted pack ideas.
Do not copy: heavy ERP features, recipe-first UX, account-first onboarding.

====================================================================
3. PRODUCT IDENTITY & DIFFERENTIATION
====================================================================

Product name: FOOD GUIDE APP

Mission: Help people decide what to do with food right now with the least friction.
Primary promise: Take a picture, scan a barcode, or ask a short question → short action answer: where to store, what to keep together/apart, what to use first, what to do next, with local examples.

Differentiators:
- Camera-first, action-first, local-first, privacy-first, short structured answers, region & climate-aware, no mandatory login.

**Experience pillars (ties to §17.1):** the product **SHALL** favor **real-kitchen conditions** (poor signal, no login wall, bounded loading) over demo polish; **honesty** over false certainty; **safety signals** (recall, label, allergens) visible and plain; **Cook** as optional depth; **copy and examples** that feel locally native; and **privacy behavior** that matches marketing claims.

Canonical response slots (structured): do_now, store_here, keep_with, keep_apart, use_first, use_like_this, why, confidence, next_step_optional.

Example response (single-item):
DO NOW: Move the cut cucumber into a sealed container.
STORE HERE: Fridge crisper.
KEEP WITH: Other sealed ready-to-eat vegetables.
KEEP APART: Leaking raw meat.
USE FIRST: Cut cucumber.
USE LIKE THIS: Salad or quick pickle.
WHY: Cut pieces deteriorate faster at room temperature.
CONFIDENCE: HIGH
OPTIONAL NEXT STEP: Set a 2-day reminder.

====================================================================
4. SOURCE-OF-TRUTH HIERARCHY
====================================================================

Evidence priority (earlier wins over later):
1. Safety & storage authorities (region-default authorities and recalls — see §27 table; includes FoodKeeper where licensed, UK FSA / Health Canada / FSANZ-backed packs as applicable, plus openFDA / RASFF where relevant)
2. Canonical identity & product enrichment (FoodData Central, Open Food Facts, barcode metadata)
3. Local adaptation packs (country/culture/language/climate packs curated)
4. ML perception (barcode/OCR/image evidence feeding rules)
5. Generative formatting (short natural-language rendering; never authoritative alone)

Decision priority: safety → explicit label instructions → authoritative storage rules → item state → climate → region → culture → user preference → stylistic generation.

====================================================================
5. CAPABILITY MODEL, STACK & RUNTIME FLOWS
====================================================================

This section is the **single vocabulary** for product, engineering, QA, and GTM: *what the system does*, *when it ships*, *how layers compose*, and *how flows run*. Detailed rules live in §6; platforms in §11; Cook in §33; AI tiers in §34; HTTP in §13.

5.1 Capability inventory by release tier

**MVP (SHALL ship for “Food Guide App” v1 consumer launch)**  
- **Capture & intake:** single-item camera path, barcode scan, free-text Ask, manual food picker; basic shelf audit (multi-item photo → grouped guidance). Voice **MAY** be stubbed or deferred if platform cost is high; if present, it **SHALL** route through the same normalization and rules as text Ask.  
- **Core guidance:** storage placement, separation (keep with / keep apart), use-first ranking, freeze/thaw and leftovers hints where rules exist in packs; conservative fallbacks when confidence is low (§8).  
- **Knowledge & locale:** offline-first answers using signed **packs** (§10); region / language / culture adaptation (§9); optional **recall check** when online, with offline cache / staleness disclaimers (§4, §27).  
- **Trust & safety UX:** recall banner precedence over casual tips; allergen and third-party data disclaimers (§26.4); one-step clarification max (§8).  
- **Persistence:** local item history / “saved” answers, encrypted store (§29.1), reminders (§19).  
- **Identity:** no mandatory account; optional anonymous-friendly correction submit when online (§13, §30.2).  
- **Pack lifecycle:** download, verify, stage, activate, rollback; show pack age; do not block core flows when offline (§10).  
- **Real-world connectivity:** poor or intermittent signal (e.g. basement kitchen, travel, airplane mode with cached packs) **SHALL NOT** block core guidance behind sign-in or unbounded spinners; the UI **SHALL** resolve within bounded time to cached packs + rules, explicit offline/stale recall state, or conservative advice (§17.1).

**Phase 1.5 (SHOULD follow MVP closely — depth, not a new product)**  
- **Cook mode:** tab/surface for recipe-style suggestions from ingredients + meal slot + cuisine hint; Stories-style multi-photo capture (§33); `POST /v1/cook/suggest` wired per §13.  
- **AI depth:** Tier **T1** templates + optional user-downloaded **offline SLM** bundle (§34.4); Tier **T2** where device supports; Tier **T3** for Cook/storage assist **off by default**, consent-gated (§12, §34).  
- **Richer audits:** improved shelf clustering and conflict explanations while keeping the same audit vocabulary (§18).

**Phase 2 (expansion)**  
- **Cloud escalation** for ambiguous shelf/single-item cases (consent + minimization unchanged) (§12).  
- **Stronger recall and enrichment:** tighter regional feeds, better barcode→canonical mapping coverage.  
- **Evaluation at scale:** broader golden set, canary pack/model pipeline hardened (§15, §21, §30).  
- **Optional** encrypted diagnostics export for support (privacy policy gated) (§32.2).

**Phase 3 (scale & partnerships)**  
- Optional **household / shared state** with documented conflict policy (§29.2).  
- More **packs** (retailers, appliances, white-label) without changing core evidence hierarchy (§4).  
- **Partnership surfaces** (e.g. deep links, widgets) per §32.6.

**Explicit non-goals (SHALL NOT be required for any tier)**  
- Mandatory social feed, recipe CMS as primary product, full pantry ERP, medical or disease-management claims, smart-fridge as hard dependency (§1, §14).

5.2 Architectural layers (composition)

Each user-facing flow **SHALL** traverse the following **logical layers**. Implementations **MAY** parallelize within a layer (e.g. barcode + OCR) but **SHALL** merge before **Decision**.

| Layer | Responsibility | Typical inputs | Typical outputs |
|-------|----------------|----------------|-----------------|
| **Intake** | Channel selection, consent gates, raw media/text | Camera frames, barcode, text, voice transcript, picker | Normalized “capture session” |
| **Perception** | Machine perception & decoding | Frames, crops | Barcode value, text spans, detections, packaging cues, cut/open hints |
| **Normalization** | Ontology & locale | Perception + user hints | `FoodEntity` / `ProductEntity` linkage, state flags, region profile |
| **Decision** | Rules engine + recall overlays | Normalized entities + active packs + recall feed | Structured slots, severities, `rule_id`s (§6.1) |
| **Response** | Verifier + templates + optional generation | Decision trace | Answer card, audit groups, Cook cards (§33) |
| **Optional cloud merge** | Escalation / enrichment | Minimized payload + local hypothesis | Reconciled hypothesis (never bypasses safety ordering §4) |

**Degradation rule:** If a lower layer fails, upper layers **SHALL** degrade per §8 and §11 (e.g. Ask without camera, rules-only tier, omit optional Cook wording).

5.3 Primary runtime flows

**Single-item flow:**  
capture → extract evidence → map to canonical food → resolve item state → apply storage / separation / use-first rules → region & culture adjust → verify → return structured answer (+ optional recall overlay if online).

**Shelf audit flow:**  
capture → multi-object detection → risk / moisture / ethylene cluster hints → map items → group conflicts → output **GOOD / MOVE / SEPARATE / USE FIRST** (+ optional ideas) (§18).

**Barcode-first flow:**  
decode → product lookup (cache then network) → OCR / packaging storage text if present → **label instruction** precedence when authoritative → post-open rules → merge with recall if applicable.

**Cook flow (Phase 1.5+):**  
ingredient hypothesis (text, barcode list, or Stories merge) → meal slot & cuisine context → **Cook** slot-filling / optional T1–T3 wording (§33–34) → safety strings from rules packs → verify → 1–3 recipe cards.

**Cloud escalation flow (optional, consent-gated):**  
low confidence or user opt-in → crop & minimize payload → remove EXIF → send → merge cloud interpretation with local rules → **verify** → respond. **SHALL NOT** persist images by default (§12).

**Correction & learning loop (online):**  
user correction → `POST /v1/feedback/correction` (idempotent) → moderation → pack / mapping update → golden-set re-run before publish (§15, §30).

5.4 Cross-cutting capabilities (every tier)

These **SHALL** be designed in from MVP onward; maturity increases by phase but the **obligation** does not disappear:

- **Accessibility & i18n:** WCAG 2.2 AA target for primary journeys; UI vs pack-driven strings (§28.2, §32.3).  
- **Privacy & security:** local-first defaults, encryption at rest, minimal cloud payloads, kill switches (§26–27, §29.1, §32.7).  
- **Observability:** privacy-safe client telemetry taxonomy; server SLOs for pack/recall paths (§32.2, §35.1).  
- **Governance:** signed artifacts, SBOM, incident and rollback playbooks (§30, §35).  
- **Answer traceability:** `rule_id`, pack semver, and recall source keys exposed where “why this answer” is enabled (§29.3, §32.8).  
- **End-user experience bar:** qualitative commitments in **§17.1** (trust, tone, recall/allergen presentation, notification discipline) **SHALL** be treated as product requirements, not polish-only.

====================================================================
6. RULE ENGINE (CORE PRODUCT LOGIC)
====================================================================

Rule families: storage placement, container/ventilation, humidity sensitivity, odor/ethylene interactions, post-cut/open rules, leftovers handling, freeze/thaw rules, climate & region adjustments.

Rule types:
- Hard safety rule (must not be overridden)
- Hard storage rule
- Soft quality rule
- Soft practicality rule
- Local custom rule

Execution order: explicit label instruction → safety/contamination rules → authoritative baseline → state-based mods → packaging-based mods → climate → region → user preference → language template.

Example hard rule:
If item_state == raw_animal_product AND nearby_item_state == ready_to_eat_uncovered → enforce separation (HIGH confidence) and require explanation.

Example soft rule:
If whole_tomato AND climate == hot → prefer using sooner; do not recommend refrigeration unless quality preservation required.

6.1 Canonical rule_id naming (for traces, golden tests, and “why this answer”)

Purpose: every rule that can influence user-facing output must carry a stable `rule_id` logged in answer traces (§29.3, §32.8) and referenced in pack JSON.

Uniqueness: `rule_id` is unique within the tuple (`pack_id`, `rule_set_version`). The same logical rule in a new pack revision may keep the same id if behavior is unchanged; bump `rule_set_version` when behavior changes.

Format (**SHALL**):
- Single segment of lowercase ASCII: letters, digits, underscores only — `[a-z][a-z0-9_]{2,64}`.
- Prefix by family (choose one): `safety_`, `storage_`, `separation_`, `usefirst_`, `freeze_`, `thaw_`, `label_`, `culture_`, `climate_`, `recall_`, `verify_`, `inventory_`.
- Body: short snake_case descriptor, e.g. `safety_raw_adjacent_rte_uncovered`, `storage_tomato_whole_counter_default`, `separation_ethylene_sensitive_pairing`.

Anti-patterns: do not embed PII, locale-specific words, or version numbers inside `rule_id` (version lives in `rule_set_version`). Do not reuse one id for unrelated predicates.

Pack JSON: each rule object SHOULD include `rule_id`, `family`, `severity` (hard_safety | hard_storage | soft | template), and `authority_ref` (optional key into pack citations).

====================================================================
7. KNOWLEDGE MODEL & SCHEMAS (SUMMARY)
====================================================================

Canonical food entity (minimal fields):
food_id, canonical_name, aliases, regional_names, generic_family, categories, common_packaging_types, typical_storage_options, recommended_storage, disallowed_storage, container_guidance, ventilation_guidance, humidity_guidance, temperature_range_hint, keep_together_rules, keep_apart_rules, after_cut_rules, after_open_rules, leftovers_rules, freeze_rules, thaw_rules, use_first_priority_logic, shelf_audit_tags, local_use_patterns, mistakes_common, safety_notes, region_adjustments, climate_adjustments, language_templates, authority_sources, evidence_confidence, pack_version, last_reviewed_at.

Product entity (barcode enrichment) fields: barcode, product_name, brand, ingredients_text, packaging_text, storage_text_detected, linked_canonical_food_id, country_markets_optional, confidence, source_system.

Shelf observation entity: observation_id, captured_at, image_ref, zone_type, detected_items[], container_presence[], risk_markers[], moisture_markers[], raw_ready_eat_conflict, use_first_rankings[], audit_output, confidence.

The program **SHALL** maintain JSON Schema (Draft 2020-12 recommended) artifacts under configuration management for: **FoodEntity**, **ProductEntity**, **ShelfObservation**, **RegionProfile**, **PackManifest**, **ApiErrorEnvelope**, **OfflineModelBundleManifest** (for Tier-T1 downloads), and **CookSuggest** request/response types. Packs **SHALL** validate against **PackManifest** and **min_schema_version** on install; field extensions **SHALL** be backward-compatible or gated by schema version bumps.

====================================================================
8. CONFIDENCE MODEL & CLARIFICATION FLOW
====================================================================

Confidence levels: HIGH / MEDIUM / LOW / UNKNOWN.

Inputs: barcode certainty, OCR clarity, image classifier score, state detection confidence, canonical mapping confidence, rule coverage.

Thresholds:
- HIGH: direct answer
- MEDIUM: direct answer + concise reason
- LOW: ask one clarifying question (single focused)
- UNKNOWN: conservative fallback

Clarifying questions must be single-question and limited to one follow-up (e.g., "Is this cut or whole?"). If still uncertain, provide conservative guidance and suggest manual selection.

**User-visible honesty (normative):** the product **SHALL NOT** present MEDIUM/LOW/UNKNOWN states as breezy HIGH-confidence tips. Copy and visual treatment **SHALL** make uncertainty legible (e.g. calmer emphasis, “best guess,” or explicit “check the label”) rather than mimicking authoritative certainty—users **SHALL** prefer a humble correct-safe answer over a wrong confident one (§17.1).

====================================================================
9. REGION, LANGUAGE & CULTURE ADAPTATION
====================================================================

Inputs: device language, locale, timezone, coarse GPS if allowed, manual country/culture selection, climate pack.

Outputs: localized naming, climate-adjusted durations, culturally familiar use examples, reminder timing.

Priority: safety → spoilage prevention → practicality → local familiarity → user preference.

Examples: bread box vs bread bin wording; scallion vs spring onion.

**Defaults without scavenger hunts:** locale, language, and regional examples **SHALL** follow device settings and active packs by default so the app “sounds local” rather than US-centric strings lightly translated; deep settings **MAY** refine but **SHALL NOT** be required for sensible first-run copy (§17.1).

====================================================================
10. PACKS & UPDATE MANAGEMENT
====================================================================

Pack types: base_global_food_pack, country_pack, culture_pack, language_pack, climate_pack, climate_emergency (optional FSA-style heatwave/power-outage pointers per §28.3), barcode_mapping_pack, packaging_cue_pack, shelf_audit_pattern_pack, use_pattern_pack, correction_override_pack.

Pack manifest minimal fields: pack_id, pack_type, semantic_version, compatible_app_versions, region_scope, language_scope, authority_sources[], checksum, created_at, expires_at_optional, rollback_version, signing_key_id, min_schema_version.

Install policy: verify signature, validate schema, stage install, compatibility check, activate, retain previous version for rollback.

Offline behavior: use last valid pack, show pack age, do not block core functionality.

Update system: background downloads if allowed, checksum verification, staged install, rollback on failure.

====================================================================
11. ON-DEVICE IMPLEMENTATION (PLATFORMS)
====================================================================

Flutter is the cross-platform shell; native bridges supply camera, barcode, OCR, and ML runtimes. Use pluggable adapters (barcode, OCR, detector, local language, cloud escalation). No single vendor runtime may be a hard requirement for core storage guidance.

Shared local stack:
- SQLite (encryption at rest — see §29.1), secure preferences, local pack and model caches, deterministic rule engine, template-based short answers.

Android — capability matrix (tier × runtime):

| Tier | Barcode / text | Object / scene | On-device compression / NL | Custom model path |
|------|----------------|----------------|----------------------------|-------------------|
| A | ML Kit barcode; on-device text path | Rules-first; optional minimal detector | Fixed templates only | — |
| B | ML Kit | MediaPipe Tasks (or equivalent) lightweight detector | Templates; optional Gemini Nano on supported devices | ONNX Runtime Mobile for ONNX-exported small models |
| C | ML Kit | MediaPipe + richer multi-object paths | Gemini Nano via Google AI Edge where available | LiteRT for TFLite-compatible models; ONNX Runtime Mobile when toolchain favors ONNX |

Android rules: Gemini Nano and LiteRT are optional. Tier A must still deliver barcode + OCR + rules + safe defaults.

iOS — capability matrix:

| Tier | Barcode / OCR | Vision / Core ML | On-device language | Fallback |
|------|---------------|-------------------|--------------------|----------|
| A | Vision | Rules + templates | Template strings | — |
| B | Vision; VisionKit where appropriate | Core ML small vision models | Templates | — |
| C | Vision / VisionKit | Core ML | Apple Foundation Models on supported Apple Intelligence devices | ONNX Runtime Mobile or ExecuTorch only if Core ML cannot host the model |

iOS rules: Foundation Models opportunistic only; older supported iPhones must pass core flows.

Tier summary (cross-platform): Tier 1 = Android A / iOS A; Tier 2 = B; Tier 3 = C.

====================================================================
12. CLOUD ENHANCEMENT PRINCIPLES
====================================================================

Cloud responsibilities: advanced scene reasoning, ambiguous recognition, recall checks, pack publishing, evaluation, model benchmarking, canary rollouts.

Privacy & minimization: cloud only with explicit user consent and low-confidence triggers; crop images; remove EXIF; minimize payloads; default: do not store images.

Cloud must not be required for core answers or startup.

**Use of user imagery (trust):** images or crops sent for optional cloud assist **SHALL NOT** be sold, used for ad profiling, or repurposed for unrelated ML products without **specific, informed consent** beyond generic ToS; default posture remains minimization and no long-term image retention (§26.3, §17.1).

====================================================================
13. API SURFACE (PHASE 1)
====================================================================

Which paths are **mandatory for MVP** vs **Phase 1.5+** **SHALL** match **§5.1** and **§14** (e.g. cook and model manifest when Cook / offline SLM ship). All paths below **SHALL** appear in the OpenAPI artifact under CM.

POST /v1/resolve/item — input: normalized evidence → output: structured slots + confidence + evidence summary
POST /v1/resolve/shelf — input: normalized shelf observation → output: grouped audit plan
POST /v1/barcode/lookup — input: barcode → output: product enrichment + canonical mapping
GET /v1/packs/manifest
GET /v1/packs/download/{pack_id}
GET /v1/recalls/check — input: region + barcode/canonical ids → output: recall notices
POST /v1/eval/report — opt-in anonymized trace
POST /v1/feedback/correction — user correction submission
POST /v1/cook/suggest — ingredients + meal_slot + cuisine_hint → recipe candidates (§33)
POST /v1/cook/from_evidence — optional cloud multimodal cook path (consent-gated; §33–34)
GET /v1/models/manifest — downloadable Tier-T1 SLM bundle list (platform, app_version; §34.4)

All outputs must be structured JSON first; human-readable text is produced via templates.

API reliability (normative detail): §32.1 — use a stable error envelope, idempotency for correction/eval POSTs, and documented rate limits.

The public HTTP surface **SHALL** be specified in **OpenAPI 3.1** (or successor approved by Enterprise Architecture), stored under CM, linked from the release record. It **SHALL** include paths for §13 endpoints, shared **ApiErrorEnvelope** schema, standard error responses, and `Retry-After` behavior for rate limits (§32.1).

====================================================================
14. MVP SCOPE & RELEASE ACCEPTANCE
====================================================================

**Normative scope tiers:** **§5.1** defines MVP, Phase 1.5, Phase 2, Phase 3, and explicit non-goals. This section **§14** states **acceptance-oriented** scope for the first consumer releases; if §5 and §14 ever diverge, **§5 prevails**.

**MVP — minimum lovable product (consumer v1)**  
- **Capabilities:** all bullets under **§5.1 MVP** **SHALL** be satisfied, including offline-first core guidance, pack lifecycle, encrypted local persistence, optional recall when online, and no mandatory account.  
- **Food coverage (initial list):** tomatoes, bread, milk, yogurt, cheese, eggs, chicken, fish, beef, leafy greens, cucumbers, onions, potatoes, garlic, apples, bananas, citrus, berries, herbs, leftovers, cooked rice, cooked pasta — rules/packs **SHALL** cover these with golden-set scenarios (§15) before launch.  
- **Quality bar:** primary flows (Scan, Ask, answer, basic Audits, Settings) meet the accessibility target in §17 / §28.2 where platform allows; **§17.1** user-centered commitments **SHALL** be satisfied at UX review gates; adversarial subset in §15 **SHALL** pass for storage/safety classes; UX/trust scenarios in §15 **SHOULD** pass before launch.

**Phase 1.5 (SHOULD ship soon after MVP)**  
- **Cook** surface and `POST /v1/cook/suggest` per §13; Stories-style capture per §33; AI policy: T1 templates + optional offline SLM; T2 opportunistic; T3 **off by default** (§34).  
- **Shelf audit** improvements **SHALL** remain within the §18 vocabulary (GOOD / MOVE / SEPARATE / USE FIRST).

**Phase 2 & 3 (expansion)**  
- Follow **§5.1** Phase 2 and Phase 3; no new capability **SHALL** violate evidence hierarchy §4 or privacy posture §12 / §26.

**Explicit exclusions (unchanged)**  
- Mandatory family-sharing, full inventory ERP, smart-fridge integrations as hard dependency, recipe-social-network scope. **Cook** is optional depth, not a content farm.

====================================================================
15. EVALUATION, QUALITY & GOLDEN SET
====================================================================

Golden scenarios: target 500+ initial scenarios covering whole vs cut, sealed vs opened, raw vs cooked, mixed shelf, ambiguous lookalikes, low-light, blurry barcode, conflicting OCR, climate adjustments.

**Capability coverage:** scenarios **SHALL** be tagged (in harness metadata) to the flows in **§5.3** and tiers in **§5.1** (e.g. `single_item`, `shelf_audit`, `barcode`, `cook`, `recall_overlay`, `cloud_escalation`, `correction`) so regressions map to product commitments and release gates stay traceable.

**UX / trust scenarios:** the golden set **SHOULD** include cases for **§17.1**, mapped to **`UX-AC-01`–`UX-AC-11`** in **§17.5** (see table for exact acceptance text). **MUST**-row IDs are release-blocking for MVP where the capability is in scope; **UX-AC-10** is **SHOULD**; **UX-AC-11** applies when “why this answer” ships.

Safety-critical and adversarial scenarios (mandatory categories in the golden set; block release if regressions):
- Raw animal products adjacent to uncovered ready-to-eat foods (fridge and counter).
- Suspected recall match + storage advice ordering (recall banner must lead).
- Infant formula, baby food, high-risk populations: stricter wording; authority-first; no casual substitutions.
- Cut produce / cooked rice / leftovers “use soon” vs room-temperature conflict.
- Deliberately misleading OCR (fake “refrigerate” on wrong product class) — label tier must not override safety without high confidence.
- User prompt injection in free text (“ignore previous rules”) — decision layer must remain rule-bound.
- Ethylene / odor / moisture pairing edge cases on crowded shelves.

Metrics: canonical mapping accuracy, storage answer accuracy, keep-apart accuracy, shelf-audit ranking quality, clarification effectiveness, hallucination/contradiction rate, latency, battery impact, recall-overlay precision, adversarial pass rate.

Regression gates: any change to rules, packs, or on-device/cloud models must pass golden set + adversarial subset before promotion; UX releases **SHOULD** re-verify **§17.5** `UX-AC-*` IDs affected by the change; automatic rollback on failure (see §21, §30).

Evaluation pipeline: nightly offline tests, canary rollouts for packs/models, automatic rollback on regression.

User correction loop: in-app corrections → moderation → candidate mapping adjustment → test against golden set → publish after review.

====================================================================
16. SAFETY, TRUST & LEGAL
====================================================================

Safety rules:
- Prioritize safety: raw animal products separation; recall matches surface prominently; when evidence insufficient, give conservative guidance.
- Never claim safety from appearance alone; label instructions and recalls override generic guidance.

Legal/Trust:
- Clear disclaimers: practical household guidance, not medical advice, recalls depend on connectivity.
- Full regulatory positioning, privacy processing map, allergen policy, and Terms outline: §26. Multi-jurisdiction sources and attribution: §27.

Privacy:
- No mandatory account; local-first; cloud only with consent; opt-in analytics only; signed packs; minimize payloads.

Security:
- TLS for network, signed pack downloads, checksum verification, encrypted local prefs, encryption at rest for local DB (§29.1), RBAC on server.

====================================================================
17. UX PRINCIPLES
====================================================================

17.1 User-centered experience commitments (end-user intent)

Design for a **busy home cook in a real kitchen**, not a keynote demo. The following **SHALL** guide UX, microcopy, and engineering tradeoffs (see also §3 experience pillars, §5.1, §8, §9, §12, §19, §26–27, §29.3, §33):

- **Offline and poor-signal trust:** Core storage, separation, and use-first guidance **SHALL** remain usable with no or weak connectivity (cached packs + rules). **SHALL NOT** require sign-in for those flows. Loading **SHALL** be bounded: resolve to local answer, explicit offline state, or conservative fallback—not infinite spinners (§10, §11).  
- **Honesty over swagger:** Prefer visible uncertainty and safe defaults over a falsely authoritative tone when confidence is low (§8); one clarifying question when appropriate, then conservative advice—not endless interrogation.  
- **Recall and labels first class:** Suspected recalls **SHALL** surface prominently in **plain language** above casual storage tips (§26.2). The recall UI **SHALL** show **when recall data was last successfully checked** (timestamp) or an explicit **offline / may be stale** state; absence of a recent check **SHALL NOT** read as “all clear” (§27.2 data-source + last updated).  
- **Allergens on the same surface:** Wherever third-party allergen or ingredient hints appear, **SHALL** pair them with a clear **“check the product label”** (or equivalent) on that same screen—not only in distant legal text (§26.4).  
- **Camera as hero, others as backup:** The default happy path **SHALL** be open → capture → **one-screen** structured answer (§3 canonical slots). Barcode and Ask **SHALL** remain first-class when camera is awkward or unavailable.  
- **Cook as optional depth:** The product **SHALL** feel complete if the user never opens **Cook** (core promise §1). When Cook is used, default **1–3** concise suggestions with prep/cook time and difficulty visible; **SHALL NOT** rely on infinite scroll, social feeds, or recipe-CMS churn as core retention (§33).  
- **Sounds local:** Wording and examples **SHALL** follow locale and packs by default so copy feels native, not “US strings translated” (§9).  
- **Privacy matches the pitch:** No mandatory account; cloud assist and analytics **SHALL** stay opt-in where law or platform policy requires; kitchen imagery **SHALL NOT** be repurposed for ads or unrelated profiling without specific consent (§12, §26.3).  
- **Calm audit:** Shelf audit **SHALL** read as practical coaching, not judgment of the user’s fridge (§18 tone).  
- **Gentle reminders:** Notifications **SHOULD** default to low-burden cadence; users **SHALL** get category toggles and, where the OS allows, quiet hours—avoid spammy repeats for the same nudge (§19).  
- **Transparent “why”:** Optional “why this answer” **SHALL** show **structured** trace only (`rule_id`, pack semver, authority keys)—**SHALL NOT** expose chain-of-thought, hidden prompts, or raw vendor reasoning streams (§29.3).

17.2 Core UX laws

Camera is fastest entry; answers fit on one screen; value before settings; one-tap actions; at most one clarification; confidence shown **quietly but legibly** where §8 demands honesty; easy correction.

17.3 Primary tabs

Scan, Ask, **Cook** (§33), Use First, Audits, Saved, Settings — each tab **SHALL** map to at least one **§5.1** capability (e.g. Scan → capture + single-item; Audits → shelf audit flow §5.3; Cook → Phase 1.5+ §5.1).

17.4 Accessibility (summary)

Meet WCAG 2.2 Level AA for primary flows (Scan, Ask, answer card, Audits, Settings) where platform allows; document any scoped exceptions. Support Dynamic Type / font scaling, VoiceOver and TalkBack for capture and results, sufficient contrast, focus order, reduced motion option, optional haptics (never sole signal). RTL layouts and mirrored icons where the app ships in RTL languages. Detail: §28.2.

17.5 Traceability — §17.1 acceptance test IDs (QA)

The following IDs **SHALL** be used in test management tools (and **MAY** appear in issue trackers) to prove **§17.1** for release gates. Each ID is **MUST** for **MVP** unless marked **SHOULD** (aligns with RFC 2119 in §17.1).

| ID | §17.1 theme | Verify (acceptance) | MVP |
|----|-------------|----------------------|-----|
| **UX-AC-01** | Offline / poor-signal trust | With network disabled (or throttled to failure), user can complete core **single-item** storage/separation/use-first path without sign-in; no unbounded spinner—result, explicit offline, or conservative fallback within defined timeout. | MUST |
| **UX-AC-02** | Honesty over swagger | For injected LOW/UNKNOWN confidence, UI does not read as casual HIGH certainty; at most one clarifying question then conservative advice (§8). | MUST |
| **UX-AC-03** | Recall first class + freshness | When recall UI is shown: plain language, prominent vs casual tips; **last successful fetch time** or explicit offline/stale state; scenario where no recent check does **not** imply “no recall.” | MUST |
| **UX-AC-04** | Allergens same surface | Screen showing third-party allergen/ingredient hint **also** shows “check the product label” (or equivalent) without extra navigation. | MUST |
| **UX-AC-05** | Camera hero, backups first-class | Scan → one-screen structured answer; barcode path and Ask path both reach equivalent rule pipeline for a reference item set. | MUST |
| **UX-AC-06** | Cook optional depth | Fresh install: core tabs/flows usable with Cook never opened; with Cook: default ≤3 suggestions, prep/cook time + difficulty visible; no mandatory social/infinite-scroll dependency for value. | MUST (Cook-off); SHOULD (Cook-on) for Phase 1.5 |
| **UX-AC-07** | Sounds local | With non–en-US locale selected, at least one user-visible string or example reflects pack/locale (not generic US-only wording) on primary answer path. | MUST |
| **UX-AC-08** | Privacy matches pitch | No forced account; cloud assist off until consented where required; no use of captured imagery for ad profiling in default configuration (§12). | MUST |
| **UX-AC-09** | Calm audit | Audit results use §18 vocabulary and tone; no shaming/judgmental copy in reference scenarios. | MUST |
| **UX-AC-10** | Gentle reminders | User can disable categories / set quiet hours where OS supports; duplicate nudges for same condition are rate-limited or collapsed (§19). | SHOULD |
| **UX-AC-11** | Transparent “why” | “Why this answer” shows only structured fields (`rule_id`, pack version, authority keys); no raw model CoT or hidden system prompts (§29.3). | MUST (if feature shipped) |

**Harness tagging:** automated or manual suites **SHOULD** include `ux_ac_id: UX-AC-NN` in metadata alongside §15 flow tags (`single_item`, `recall_overlay`, etc.).

====================================================================
18. KITCHEN AUDIT SYSTEM
====================================================================

**Runtime reference:** shelf audit **SHALL** follow the **Shelf audit flow** in **§5.3** (multi-object perception → conflict grouping → user-facing buckets). MVP delivers “basic” audit per §5.1; Phase 1.5 **MAY** deepen explanations without changing bucket names.

Audit outputs: GOOD, MOVE, SEPARATE, USE FIRST, OPTIONAL IDEAS. Tone: calm, practical, non-judgmental.  
Scoring: great / okay / needs attention (no technical scores shown to users).

====================================================================
19. REMINDERS & HEALTHY-LIVING
====================================================================

Initial reminders: use produce first, leftovers rotation, weekly fridge reset, pantry quick check, freeze-now suggestion, optional drink-water reminders — these **SHALL** complement **use-first** and **core guidance** capabilities in **§5.1** without becoming a medical or diet program.

Exclude: disease advice, strict diet plans, medical recommendations.

**Notification discipline:** reminder UX **SHALL** follow §17.1—supportive nudges, not alarm fatigue; duplicate pings for the same condition **SHOULD** be collapsed or rate-limited unless the user explicitly requests more frequent reminders.

====================================================================
20. DATA SOURCES & REFERENCES
====================================================================

Authority & data sources:
- FoodKeeper (FoodSafety)
- FoodData Central (USDA)
- Open Food Facts
- openFDA food enforcement
- EU RASFF consumer portal

Open-source benchmarks and technical refs: Grocy, KitchenOwl, Mealie, RecipeSage, ONNX Runtime, MediaPipe, ML Kit, Core ML, ExecuTorch.

Links (examples):
- https://www.foodsafety.gov/keep-food-safe/foodkeeper-app
- https://fdc.nal.usda.gov/api-guide
- https://openfoodfacts.github.io/openfoodfacts-server/api/
- https://open.fda.gov/apis/food/enforcement/
- https://food.ec.europa.eu/food-safety/rasff_en

====================================================================
21. RELEASE, PACK ROLLOUT & OPERATIONAL GUIDANCE
====================================================================

Release channels: dev → dogfood → beta → stable. Pack channels: canary → stable.

Pack install policy: verify signature, validate schema, stage activation, rollback support.

Model rollouts: benchmark candidate vs current, canary small cohort, monitor metrics (latency, battery, quality), rollback on degradation.

Observability: local diagnostics (pack/model versions, capability tier), server diagnostics (pack freshness, recall ingestion), user-visible diagnostics page (privacy-safe).

====================================================================
22. TEAM & WORKSTREAMS
====================================================================

Workstreams summary:
- Product & UX: IA, answer card design, audit UX, **§17.1** acceptance criteria in reviews
- Mobile: Flutter shell, native bridges, packs
- Android: barcode/OCR/detectors
- iOS: Vision/Core ML/Foundation Models adapters
- Rules & taxonomy: ontology, rule library
- Backend & curation: HTTP services per §13 (implementation stack under CM), pack publishing pipeline
- Safety & compliance: copy review, recall logic
- Evaluation: golden sets, regression harness, scenario tags vs **§5** flows (§15)

====================================================================
23. ROADMAP (PHASED)
====================================================================

Roadmap labels **SHALL** map to **§5.1** capability tiers as follows (§14 for acceptance detail):

| Roadmap phase | Primary intent | §5.1 alignment (summary) |
|---------------|----------------|---------------------------|
| **Phase 0 — Foundation** | Buildability | Taxonomy, CM schemas (§7, §31.3), pack format & signing, local rule engine prototype, initial golden set (§15). |
| **Phase 1 — MVP** | Consumer v1 | Entire **MVP** capability block in §5.1 (Flutter shell, perception minima §11, offline answers, packs, reminders, optional recall). |
| **Phase 1.5** | Depth | **Phase 1.5** in §5.1 (Cook, Stories, offline SLM optional, richer audit wording). |
| **Phase 2 — Hybrid intelligence** | Connectivity | **Phase 2** in §5.1 (cloud escalation, recall/enrichment hardening, eval at scale). |
| **Phase 3 — Scale** | Ecosystem | **Phase 3** in §5.1 (optional household sync, more packs/partners, white-label). |

====================================================================
24. PRICING & DISTRIBUTION
====================================================================

Launch free with no account. Sustainability: municipality sponsorships, retailer/appliance partnerships, white-label. Avoid forced ads and data brokerage.

====================================================================
25. EXAMPLES & TEMPLATES
====================================================================

Editorial template (example):

FOOD: Tomato
WHOLE_STORAGE: Counter until ripe, then short counter hold or fridge if needed.
CUT_STORAGE: Fridge in covered container.
KEEP_WITH: Dry intact produce.
KEEP_APART: Leaking raw foods and wet open containers.
USE_SOON: Cut pieces first.
USE_IDEA: Salad, sauce, sandwich, roast, quick saute.
COMMON_MISTAKES: Refrigerating all tomatoes too early; leaving cut tomato uncovered.

Pack manifest **field inventory** is normative in §10. **Illustrative** JSON (non-normative; shape **SHALL** validate against the **PackManifest** artifact in CM per §31.3):

```json
{
  "pack_id": "example_us_seed",
  "pack_type": "country_pack",
  "semantic_version": "1.4.0",
  "compatible_app_versions": ">=1.0.0",
  "region_scope": ["US"],
  "language_scope": ["en-US"],
  "authority_sources": ["foodkeeper", "openfda_enforcement"],
  "checksum": "sha256:…",
  "created_at": "2026-01-15T12:00:00Z",
  "signing_key_id": "pack-signing-2026-01",
  "min_schema_version": 3
}
```

====================================================================
26. REGULATORY POSITIONING, TRUST & COMPLIANCE
====================================================================

26.1 Intended use (not legal advice; product positioning)

The app provides practical, educational household guidance on storage, separation, use-first, and related kitchen organization. It is not a medical device, does not diagnose or treat disease, and does not provide clinical nutrition therapy. Marketing, store listings, and in-app copy must avoid disease claims, cure/implied cure language, and “safe to eat” determinations from photos alone. U.S. framing: align with FDA enforcement discretion for general wellness / consumer education when scope stays within these bounds; confirm final classification with counsel. Claims must be truthful and substantiated (FTC truth-in-advertising).

26.2 Label and recall supremacy (US / EU / UK)

- Explicit on-package storage, “use-by” / “best before,” and manufacturer instructions outrank generic pack content when authoritative.
- Live recall matches (e.g. openFDA, RASFF consumer channels, UK FSA recalls as wired in region packs) must surface prominently and must not be minimized.
- **Recall UI freshness (consumer clarity):** when presenting recall results, the app **SHALL** display **when data was last successfully fetched** (or an explicit offline / stale state). Users **SHALL NOT** interpret “no banner” after an offline session as proof that no recall exists—copy **SHALL** disambiguate unknown vs checked-clear where feasible (§17.1, §27.2).
- When jurisdiction-specific official guidance conflicts with generic global rules, the active region pack’s Tier-1 authority set wins after safety ordering (§4).

26.3 Privacy processing map (GDPR / UK GDPR / U.S. state laws — implement with counsel)

Categories (examples): device identifiers and telemetry if opted in; optional account or household sync (future); cloud-assist payloads; user-submitted corrections; diagnostics export.

Lawful bases (EU/UK examples — finalize with DPA): consent for cloud assist, optional analytics, and optional diagnostics; legitimate interests for security/abuse prevention where applicable; contract if paid/enterprise features exist later.

Data subject rights: provide export/delete flows for any personal data stored server-side; document what stays only on device (default: no account, minimal retention).

Retention: define max retention per category (e.g. correction tickets, server logs); default no long-term image retention.

DPIA / PIA triggers: biometric or systematic processing of camera images on server; large-scale optional analytics; children’s data (see below).

Children: no intentional collection from under-13 (or under-16 where required). If age gate or parental controls are added, document COPPA/GDPR children provisions. Default no-account flow reduces but does not eliminate obligation to avoid targeting minors with data collection.

26.4 Allergen handling policy (Open Food Facts, OCR, third-party data)

- Allergen and ingredient lines from databases or OCR are third-party, potentially incomplete, stale, or wrong. Never present as “allergy-safe,” certified allergen-free, or a substitute for reading the physical label.
- Always show: “Check the product label” for packaged goods; prefer barcode + region pack that surfaces official caution strings without overclaiming. That reminder **SHALL** appear **on the same UI surface** as any allergen/ingredient hint from third-party data, not buried behind extra taps (§17.1).
- EU context: Regulation (EU) No 1169/2011 (FIC) binds food businesses, not this consumer app; the app must not mimic a legal allergen statement for a manufacturer.
- Optional user-stated allergens: use only as UI filtering / highlighting hints (e.g. “contains milk per OFF”) — not medical advice and not a guarantee.

26.5 Terms of service, liability, and operational SLAs (lawyer-reviewed drafts required)

Terms should cover: permitted use, disclaimers of warranties, limitation of liability (to extent enforceable), user indemnity where appropriate, governing law, mandatory arbitration only if counsel approves.

Curated content SLA (internal): define target review cadence for safety-critical food categories; track `last_reviewed_at` on entities; escalation path for disputes.

Recall feeds: disclaim freshness and completeness; offline mode cannot guarantee current recalls.

26.6 Compliance checklist (pre-release)

- Store listings and screenshots match actual behavior; no unsubstantiated superiority claims.
- Privacy policy and, where required, data processing agreement / SCCs for transfers.
- In-app “not medical advice” and allergen disclaimers where product data is shown.
- Age-appropriate defaults; analytics off by default or opt-in per platform policy.
- Accessibility statement (WCAG target in §28.2) and contact for accessibility issues.

====================================================================
COMPLIANCE APPENDIX SUMMARY (one page)
====================================================================

Product: household food storage / use-first assistant, not a medical device. Data: local-first; optional cloud with consent; minimize images; no repurposing of user imagery for ads/profiling without specific consent (§12, §17.1). Allergens: third-party only; label always wins; same-surface label reminder (§26.4, §17.1). Recalls: prominent + last-checked / stale clarity (§26.2, §17.1). Law: GDPR/UK GDPR/state privacy as applicable; COPPA-aware defaults. Legal artifacts: Terms, Privacy Policy, DPIA when triggered, internal content-SLA and recall disclaimers. All final texts require qualified legal review.

====================================================================
27. MULTI-JURISDICTION AUTHORITIES, DATASET RIGHTS & DATE LABELS
====================================================================

27.1 Default authority and recall matrix (packs set `authority_sources[]` per region)

| Region / market | Primary consumer storage guidance (seed / pack) | Recall / alert overlays (examples) |
|-----------------|-----------------------------------------------|-----------------------------------|
| United States | USDA FoodKeeper + foodsafety.gov alignment (where licensed in pack) | openFDA food enforcement |
| United Kingdom | UK FSA consumer guidance (curated pack; web: food.gov.uk storage topics) | UK FSA / FSA alerts as integrated when available |
| European Union | EFSA/MS consumer-facing materials via curated country packs; FoodKeeper only where appropriate for product | RASFF consumer portal / national channels per pack |
| Canada | Health Canada consumer food safety guidance via curated pack | CFIA recalls (API/feed as legally usable) |
| Australia / New Zealand | FSANZ + Food Standards Australia NZ consumer info via curated pack | FSANZ / trans-Tasman recall sources per integration policy |

Rules: ship a default pack for the user’s selected or inferred region; never silently apply US-only rules to UK/EU users without region pack activation.

27.2 Dataset rights and attribution (verify before commercial redistribution)

- FoodKeeper / FSIS data: confirm current USDA/FSIS and Cornell/FMI terms for the dataset snapshot used; retain attribution strings required by the license; do not exceed permitted use (derivative packs, commercial use, redistribution).
- FoodData Central: comply with USDA API terms of service; attribute USDA; respect rate limits and attribution in About screen / pack metadata.
- Open Food Facts: ODbL for database contents — share-alike and attribution obligations apply to derived databases; follow https://world.openfoodfacts.org/terms-of-use and API guidelines; credit OFF in app and docs.
- openFDA, RASFF, government recall APIs: comply with each portal’s terms; display “data source + last updated” for recall UI.
- Maintain `authority_sources` and `license_spine` metadata on each published pack (fields may be added in pack manifest extensions).

27.3 Date labels: best-before vs use-by (EU/UK emphasis; analogous US “quality vs safety”)

- Teach users in short copy: “use-by” / “expiration” tied to safety where applicable; “best before” / “best if used by” often quality-only — jurisdiction wording differs; never invent a date from a photo.
- If OCR reads a date, show as read-only hint with low confidence unless format and context validated; do not assert spoilage from a single image.
- Pack content: include region-specific micro-copy templates for date education without overriding label text.

====================================================================
28. COMPETITIVE POSITIONING, ACCESSIBILITY & EDGE SCENARIOS
====================================================================

28.1 Competitive matrix (positioning only; names illustrative)

| Category | Examples | Primary job | Contrast with Food Guide App |
|----------|----------|-------------|-------------------------------|
| Government storage reference | USDA FoodKeeper app | Authoritative timelines, browse | We add camera-first scene advice, keep-apart/use-first, culture packs, offline rule engine |
| Pantry / OSS | Grocy, KitchenOwl, Mealie | Inventory, recipes, lists | We avoid ERP/recipe-first; optimize immediate “what do I do now?” |
| Inventory / expiry trackers | NoWaste, Kitche-class | Dates, stock, waste stats | We minimize ledger UX; optional reminders without full inventory |
| Surplus / sharing | Too Good To Go, OLIO | Rescue or share surplus food | Different lane; optional future link-outs only |
| AI recipe-from-fridge | Samsung Food (ex-Whisk), Oh A Potato–class, Supercook, Yummly | Fridge photo → ideas, ingredient search, social recipes | We pair **storage/safety/use-first** (core) with optional **Cook** mode; no forced social feed; offline-capable tiers; stronger privacy path |

28.2 Accessibility target (WCAG 2.2 Level AA)

Scope: first-run, Scan, Ask, answer result, Use First list, Audits entry, Settings, critical dialogs. Criteria: perceivable text alternatives for meaningful icons, operable focus and touch targets, understandable error and confidence messaging, robust with screen readers. RTL: mirror layout; test Arabic/Hebrew if shipped. Document exceptions (e.g. third-party camera chrome) in accessibility statement.

Testing protocol:
- Automated: run platform accessibility scanners on each release candidate for primary screens; fix regressions before ship.
- Manual: quarterly (or every major) pass with VoiceOver and TalkBack through Scan → result → reminder action; verify focus order, headings where used, and live region updates for confidence changes.
- Pseudolocale / long-string build to catch truncation in answer cards and settings.
- Track known gaps in a public or internal accessibility statement with remediation target dates.

28.3 Edge scenario pack (optional `climate_emergency` or `household_emergency` pack)

Content examples (FSA-style): prolonged power outage (fridge/freezer thresholds), heatwave room-temperature limits, flood discard guidance pointers — always sourced to regional authority snippets in pack, not free-generated. Tie to §27 authorities. Ship as optional downloadable pack to avoid bloating core MVP.

====================================================================
29. LOCAL DATA SECURITY, SYNC POLICY & ANSWER TRANSPARENCY
====================================================================

29.1 Encryption at rest and threat model

- Encrypt SQLite (or equivalent) at rest using a vetted library (e.g. SQLCipher or platform-backed encrypted stores); derive keys via hardware-backed keystore (Android Keystore, iOS Keychain); never embed keys in binaries.
- Threat model: lost/stolen device — attacker must not read reminders, recent items, or saved scans without device passcode; document that rooted/jailbroken devices are out of scope for strong guarantees.
- Encrypted backups: follow platform guidance; warn if user exports diagnostics.

29.2 Future household sync — conflict resolution (decide before building)

- Default recommendation: last-write-wins (LWW) with server timestamp + `updated_by` for simple shared lists (use-first, reminders); acceptable for non-safety-critical state.
- For collaborative edits to custom notes: optional CRDT (e.g. Automerge) only if product complexity justifies; safety answers must always recompute from authoritative packs + rules server-side or on each device, not merge arbitrary text into rules.
- Document conflict UX: show “updated elsewhere” and single-resolution actions.

29.3 Optional “why this answer” expander (privacy-safe)

Expose: applied `rule_id`s, pack `semantic_version`, short authority citation key (no PII). **SHALL NOT** leak chain-of-thought, hidden system prompts, or raw reasoning streams from on-device or cloud models—**structured trace only** (§17.1). Vendor debug or support modes **SHALL** remain gated and non-user-facing unless explicitly a diagnostics export with consent (§32.2).

====================================================================
30. OPERATIONS: INCIDENTS, CORRECTIONS, MODEL & PACK GOVERNANCE
====================================================================

30.1 Safety/content incident playbook

Severity levels (example): S0 wrong storage causing plausible harm; S1 widespread wrong text; S2 isolated copy bug; S3 cosmetic.

Actions: S0/S1 — halt pack promotion; roll back to last known-good signed pack; in-app banner if backend flag enabled; post-mortem (timeline, root cause, golden-set gap); file regulatory report only if counsel advises.

30.2 User correction queue — SLA and abuse

- SLA targets (tune to team size): first triage within 2 business days; safety-tagged within 24h; resolution tracked in ticketing.
- Abuse resistance: rate limits, spam detection, ignore list; no auto-publish of user text into packs without human review.
- Legal hold: preserve submission metadata when counsel or regulator requests; define retention in policy.

30.3 Model cards and pack changelog

- Each on-device model: card with intended use, limits, training data summary, known failure modes, version, benchmark vs prior.
- Each pack release: changelog, safety sign-off name/role, diff summary; semver for `semantic_version`.

30.4 Third-party and supply-chain hygiene

- Maintain a dependency inventory (SBOM) for mobile and server; scan for known CVEs in CI.
- Pin and review native ML SDKs (ML Kit, MediaPipe, etc.) on a regular cadence; document upgrade risk in model/pack release notes when inference behavior may shift.

====================================================================
31. READING GUIDE & NORMATIVE ARTIFACT REGISTER (CM)
====================================================================

31.1 Who reads what

- Leadership / investors: §1–3, **§5** (capability tiers), §14, §24, §28.1, Compliance Appendix Summary under §26, §35.
- Product / design: **HANDOFF**, §5–6, §14, **§17** (**§17.1** commitments, **§17.5** `UX-AC-*` for acceptance), §18–19, §28.
- Mobile / ML: §5, §8, §11, §29, §32–34.
- Backend / data: §5 (flows touching network), §10, §12–13, §27, §30, §32, §35.
- Legal / compliance: §26–27, §16, §32.4, §35.2, Compliance Appendix Summary.
- QA / safety: §8, §15, **§17.5** (`UX-AC-*`), §28.2, §29–30, golden + adversarial sets.

31.2 Verbatim archives

Appendix C = GS-FOOD1.md; Appendix D = GS-FOOD2.md. If the synthesized body (**§1–35**) conflicts with an appendix, treat **§1–35** as canonical for implementation; use appendices for historical audit only.

31.3 Normative artifact register (names under configuration management)

The following **SHALL** exist as versioned artifacts in the program CM system (filenames are illustrative; equivalence by logical name):

| Logical artifact | Description |
|------------------|-------------|
| FoodEntity | Canonical food record schema for packs |
| ProductEntity | Barcode / enrichment row |
| ShelfObservation | Shelf audit normalized observation |
| RegionProfile | Locale / region / active packs |
| PackManifest | Signed pack metadata + `min_schema_version`, optional `rule_set_version` |
| ApiErrorEnvelope | Standard API error JSON (§32.1) |
| OfflineModelBundleManifest | Tier-T1 downloadable model listing (§34.4) |
| OpenAPI | OpenAPI 3.1 API description for §13 |
| CookSuggest | Request/response schemas for cook endpoints |

Validation: client and server builds **SHALL** validate packs and API payloads against approved schema baselines before release promotion.

====================================================================
32. API RELIABILITY, OBSERVABILITY, I18N & PLATFORM EXCELLENCE
====================================================================

32.1 API error model and client behavior

- **ApiErrorEnvelope** (JSON): at minimum `code` (stable machine string), `message` (safe for user or localized key), `retryable` (boolean), `request_id` (correlation id for support). Avoid leaking stack traces to clients.
- HTTP: use appropriate 4xx/5xx; document rate limits (`Retry-After` where applicable). Idempotency-Key header on `POST /v1/feedback/correction` and `POST /v1/eval/report` to prevent duplicate tickets on flaky networks.
- Clients: exponential backoff for retryable errors; surface offline state explicitly when cloud assist or recall fetch fails.

Standard error `code` values (SCREAMING_SNAKE; extend in the **OpenAPI** artifact and error-code registry; never remove or repurpose without major API version):

| code | Typical HTTP | retryable | When |
|------|--------------|-----------|------|
| RATE_LIMITED | 429 | yes | Quota exceeded; honor `Retry-After` seconds |
| SERVICE_UNAVAILABLE | 503 | yes | Temporary outage / overload |
| BAD_REQUEST | 400 | no | Malformed JSON or invalid parameters |
| VALIDATION_ERROR | 422 | no | Schema validation failed on body |
| UNAUTHORIZED | 401 | no | Missing or invalid auth (future optional auth) |
| FORBIDDEN | 403 | no | Policy / region block |
| NOT_FOUND | 404 | no | Unknown pack_id or resource |
| PACK_INCOMPATIBLE | 409 | no | Pack fails `min_schema_version` or app version check |
| PACK_SIGNATURE_INVALID | 400 | no | Client should not retry same bytes |
| PAYLOAD_TOO_LARGE | 413 | no | Cropped image still over limit |
| UNSUPPORTED_MEDIA_TYPE | 415 | no | Wrong Content-Type |
| INTERNAL_ERROR | 500 | yes | Unexpected server fault (retry with backoff, bounded) |

Idempotency: successful replay of the same `Idempotency-Key` SHOULD return HTTP 200 with the original success body, not an error envelope.

32.2 Client observability (privacy-preserving)

- Event taxonomy (examples, all opt-in or anonymized where required): `scan_started`, `scan_completed`, `barcode_decode_failed`, `pack_apply_ok`, `pack_apply_failed`, `rule_fallback_used`, `cloud_escalation_accepted`, `recall_banner_shown`, `cook_story_started`, `cook_suggestion_shown`, `offline_model_download_started`, `offline_model_apply_ok`, `ai_tier_selected`.
- Never attach raw images to analytics; use hashed device + app version + pack version for cohort debugging.
- Crash and ANR reports: scrub PII; separate beta vs production streams.

32.3 Internationalization and localization

- Separate **UI strings** from **food knowledge** (pack-driven). UI: ARB / ICU MessageFormat with plural/gender where needed; fallback chain `requested locale → regional default → English (US)`.
- Food names: come from pack `regional_names` / language packs; never hardcode a single-language ontology in client code.
- QA: pseudolocale builds; minimum manual review for each launch tier-1 language. RTL: §28.2.

32.4 App store privacy labels and “Data safety” mapping

- Maintain an internal matrix: each data type collected (e.g. optional diagnostics, correction text, IP for abuse) → lawful basis → retention → whether linked to user → whether used for tracking → matches Apple Privacy Nutrition Labels and Google Play Data safety declarations.
- Update declarations before each store release when behavior changes (§26.3).

32.5 Backup, device transfer, and uninstall

- Document clearly: local SQLite may be included in OS backup; encrypted DB reduces exposure. Provide optional **export** (encrypted archive) for user-migrated devices if product adds accounts later.
- Uninstall: OS removes app data; state no separate “cloud profile” for default no-account users.

32.6 Deep links and system integrations

- Support cold-start deep links where useful: e.g. `foodguide://scan`, `.../ask?q=` (percent-encoded, length-capped) for widgets or assistant handoff — sanitize input through the same rule pipeline as in-app Ask.
- Future: App Shortcuts / home-screen widgets pointing to Scan or Use First; document intent filters and iOS URL scheme registration.

32.7 Feature flags and remote kill switches

- Server-controlled flags: disable cloud escalation globally or per region; force minimum pack version; show maintenance banner.
- Flags must default to safe local-only behavior when the config service is unreachable.

32.8 Rule and pack version coupling

- Every emitted answer trace (§29.3) should record `pack_semver` and `rule_set_version` (monotonic per pack type) so golden tests can bisect regressions.

====================================================================
33. COOK MODE: RECIPES, STORIES CAPTURE, MEAL TIME & CUISINE
====================================================================

33.1 Product scope (Cook)

Cook mode suggests **what to cook** from **visible or stated ingredients**, in **short steps**, respecting **region, meal time, and optional cuisine intent**. It extends the core assistant; it does not replace storage rules, recall overlays, or label reading.

**Completeness without Cook:** users who never enable or open Cook **SHALL** still receive the full **§1** core promise (storage, separation, use-first, localized hints). Cook is **optional spice**, not a second mandatory product (§17.1).

Primary flows:
- **Stories-style capture:** sequential photos (fridge shelf, counter, pantry) → merged ingredient hypothesis → 1–3 recipe cards (title, time, steps summary, “use first” tie-in).
- **Ask:** “What’s for dinner with eggs, rice, and spinach?” / “Quick lunch, Turkish home-style.”
- **Time-of-day:** use device local time + locale to bias templates (e.g. breakfast vs dinner); user can override meal slot.

33.2 UX principles

- Default **1–3 suggestions**, not infinite scroll; **tap to expand** full steps.
- Each card: **prep/cook time**, **difficulty**, **uses your items** (chips), **missing optional** items (clearly marked).
- Link back to **USE FIRST** when an ingredient is urgent per rules engine.
- Optional **Save** to a lightweight “cook later” list (not a full recipe CMS).

33.3 Data and grounding

- **Tier-1** remains safety/recall/label; recipe text is **Tier-5-style generation** formatted from structured slots: `ingredients_used`, `cuisine_tags`, `meal_slot`, `steps[]`, `safety_notes` (e.g. cook poultry thoroughly — generic, not temperature guarantees unless from authority pack).
- Prefer **template + slot fill** from detected foods; LLM/SLM only for wording when allowed (§34).
- Optional future: link to **open licensed** or user-provided URLs; never scrape copyrighted instructions without license.

33.4 Benchmarks (industry)

- **Samsung Food:** strong fridge vision + personalization; benchmark for multimodal UX, not for copying lock-in.
- **Supercook:** ingredient-first search; benchmark for “use what you have” ranking.
- **RecipeGen** (research): step-aligned multimodal quality bar for generated instructions.
- **ChatGPT-class:** general Q&A; we differentiate on **offline tiers**, **rules-first safety**, **no mandatory account**.

33.5 API (normative contract in CM OpenAPI artifact)

- `POST /v1/cook/suggest` — normalized ingredients + meal_slot + cuisine_hint + locale → structured recipe candidates.
- Optional `POST /v1/cook/from_evidence` when cloud multimodal is allowed (reduced payload policy unchanged).

33.6 Safety, allergens, and legal (Cook)

- Same allergen policy as §26.4: ingredients from barcode/OCR/OFF are **unverified** for allergies.
- Do not claim **nutritional therapy** or **medical diets**; optional filters (vegetarian, etc.) are **user-declared preference** only, not certification.
- Raw protein handling: always surface **cook thoroughly** and **separation** reminders from rule packs where applicable.

====================================================================
34. THREE-TIER AI SWARM, OFFLINE MODELS & AUTO-UPGRADE
====================================================================

34.1 Architecture overview

Orchestration uses a **bounded graph** (e.g. LangGraph-style), not unbounded agent chat. Three **AI capability tiers**; the router picks tier based on **device capability**, **user settings**, **connectivity**, **confidence**, and **task type** (storage vs cook wording).

| Tier | Name | Role | Typical runtimes |
|------|------|------|------------------|
| **T1** | Local-Light | Rules, templates, optional **user-downloaded** small generative bundle | Deterministic engine; **MediaPipe LLM Inference** / **Gemma**-class or similar **bundled** model; **ONNX / LiteRT** tiny models |
| **T2** | Device-Integrated | On-device foundation / SLM **managed by OS or Play services** | **Android: Gemini Nano** via **AICore** / **Android AI Edge SDK** / **ML Kit GenAI** where available ([Gemini Nano](https://developer.android.com/ai/gemini-nano), [Google AI Edge](https://ai.google.dev/edge)); **iOS: Apple Foundation Models** on supported devices; template fallback elsewhere |
| **T3** | Cloud | Rich multimodal recipe + hard shelf reasoning | **Gemini API** or equivalent; only with **explicit consent** and **minimized payload** (§12) |

**Fallback chain:** attempt T2 → on failure or unsupported device → T1; if user allows cloud and policy permits → T3. **Forced offline** setting skips T3 entirely.

34.2 Google & cross-platform offline options (research summary — verify URLs and SDK versions at implementation time)

- **Gemini Nano (Android):** efficient on-device model via **AICore**; summarization, classification, expanding multimodal on newer Pixels/Galaxy; **check availability** per device; not bundled inside the app APK — system-delivered.
- **Google AI Edge:** **MediaPipe**, **LiteRT** (formerly TFLite), **LLM Inference API** for **downloaded** Gemma-class weights; **AI Edge Gallery** ([google-ai-edge/gallery](https://github.com/google-ai-edge/gallery)) showcases patterns.
- **User-downloadable “light” model (this product):** offer an optional **~1–3 GB** (order-of-magnitude, exact size per chosen checkpoint) **Gemma 2B / similar** package via **Settings → Offline AI → Download**; **Wi‑Fi only** default; **pause/resume**; store in app sandbox; **encrypt at rest** where platform supports.
- **iOS (2026 context):** **Google AI Edge Eloquent** demonstrates **offline-first** on-device gen AI on iPhone; parallel pattern for “download + local only” consumer apps; **Apple Foundation Models** on Apple Intelligence devices for Tier 2–style compression.

34.3 Swarm roles (specialists) — extended

Add to existing pipeline (Appendix D): **CookPlanner** (ingredient → dish candidates), **RecipeWriter** (slot filling / wording), **NutritionGuard** (block medical claims; optional), **Verifier** (unchanged — last pass). All must respect **evidence order** §4.

34.4 Automated model upgrade

- **Nano / system models:** follow **OS / Play** update channels; app probes **version capability** on launch and after `MODEL_READY` broadcasts where documented.
- **Downloaded SLM bundle:** manifest delivered per **OfflineModelBundleManifest** (§31.3), typically via CDN; payload **SHALL** include at minimum `model_id`, `semver`, `sha256`, `min_app_version`, `size_bytes`, `runtime` (`mediapipe` | `onnx` | `litert`). Filename on CDN is a deployment choice (e.g. `model_manifest.json`). App checks on **Wi‑Fi**; notifies **“Offline AI update available”**; user can **auto-update** toggle; **rollback** to previous bundle on checksum / crash threshold (§21 patterns).

34.5 Settings UX (must-have)

- **AI mode:** Automatic / Save data (prefer T1+T2 only) / Offline only (T3 disabled).
- **Download offline model:** button + progress + delete + storage used.
- **Cloud assist for Cook:** separate toggle from storage cloud assist (clear copy).

34.6 Energy and thermal

- Batch inference; avoid sustained NPU load during Stories capture; degrade to **fewer suggestions** on thermal or low battery (§11 tiers).

====================================================================
35. ENTERPRISE NON-FUNCTIONAL REQUIREMENTS, RESILIENCE & GOVERNANCE
====================================================================

35.1 Availability and performance (service tier — program-defined SLO)

- Pack distribution and recall-proxy APIs **SHOULD** target **99.9%** monthly availability per region for production (exclude client-only offline paths). Exact SLO **SHALL** be ratified with SRE and recorded in the service catalog.
- P95 latency targets for `GET /v1/packs/manifest` and `GET /v1/packs/download/{pack_id}` **SHALL** be defined per environment; degradation **SHALL** fail open to last valid cached pack on device (§10).

35.2 Resilience, backup, and disaster recovery

- **RTO / RPO** for pack registry and signing pipeline **SHALL** be defined (e.g. RPO ≤ 24h for curated content; critical safety rollback **SHALL** be executable within hours).
- Multi-region object storage for signed packs **SHOULD** be used for enterprise deployments; CDN **SHALL** support signed URLs or edge authentication per security architecture.
- **Kill switches** for faulty packs and cloud escalation **SHALL** remain operable without client redeploy (§32.7).

35.3 Identity, access, and key management

- Administrative interfaces (pack publish, model manifest publish, curation) **SHALL** enforce **RBAC** and **MFA** per organizational policy.
- Pack and model signing keys **SHOULD** reside in **HSM** or cloud KMS; key rotation **SHALL** be documented; break-glass procedures **SHALL** exist.

35.4 Audit and compliance logging

- Immutable audit trail **SHALL** record: pack publish (who, what version, checksum), model bundle publish, rule_set_version changes affecting Tier-1 safety, and administrative access. Retention **SHALL** meet legal hold and enterprise policy (often ≥ 1 year operational; longer with Legal hold).
- Client telemetry **SHALL NOT** substitute for audit logs where regulated evidence is required.

35.5 Data residency and cross-border transfer

- For enterprise tenants, data region **SHALL** be selectable; subprocessors **SHALL** be disclosed; **SCCs** or equivalent **SHALL** govern EU/UK transfers where applicable (§26.3).

35.6 Secure development lifecycle

- **SBOM** for mobile and server artifacts **SHALL** be produced per release (§30.4).
- **SAST/DAST** and dependency scanning **SHOULD** gate production promotion; critical CVEs **SHALL** be remediated per security SLA.
- Annual **penetration test** **SHOULD** cover API and admin paths.

35.7 Vendor and model risk

- Third-party foundation APIs (Tier T3) **SHALL** have contractual DPA, subprocessors list, and exit/failover strategy (degrade to T1/T2).
- On-device models delivered by OEM (Gemini Nano, etc.) **SHALL** be subject to capability testing and incident monitoring per §30.

====================================================================
36. FULL SOURCE MERGE
====================================================================

This file includes the complete content from both GS-FOOD1.md and GS-FOOD2.md. Sections **1–35** above synthesize both sources plus enterprise extensions (including **HANDOFF** program-start instructions, the **§5** capability model, **§17.1** / **§17.5** user experience and QA traceability, compliance, authorities, UX, security, ops, API/platform excellence, Cook mode, three-tier AI, enterprise NFR). Appendix C (below) is the full verbatim text of GS-FOOD1.md. Appendix D (below) is the full verbatim text of GS-FOOD2.md, including all sections through the one-sentence product definition — no truncation. Each appendix opens with an **ARCHIVAL NOTICE** restating §31.2 precedence (**§1–35** over verbatim archives).

====================================================================
CHANGELOG & GOVERNANCE
====================================================================

6.0.0 — **PROGRAM HANDOFF BASELINE:** **HANDOFF** section (how to use blueprint); **§17.5** `UX-AC-01`–`UX-AC-11` ↔ §17.1; Reading Guide QA line; **§15** UX/trust ↔ §17.5; SUMMARY / **§31.1** / **§36** / COPY / footer — document **ready for execution** (no further structural adds assumed unless scope/regulation changes).
5.0.5 — **§17.1** user-centered experience commitments (full synthesis); **§3** pillars; **§5.1** real-world connectivity; **§5.4** cross-cutting UX bar; **§8–9**, **§12**, **§19**, **§26.2–26.4**, **§29.3**, **§33.1**; Compliance Appendix Summary; reading guide / SUMMARY / **§36** / COPY / footer.
5.0.4 — **§14** MVP & release acceptance (§5.1 precedence); **§23** roadmap ↔ §5 table; **§13** which paths track MVP vs Phase 1.5+; **§15–§19** ↔ §5; **§1**, PURPOSE, SUMMARY, **§31.1**, **§36**, COPY, footer.
5.0.3 — **§5** capability model: MVP → Phase 3 inventory, architectural layers table, primary & cross-cutting flows; SUMMARY + reading guide.
5.0.2 — **Appendices C–D:** archival NOTICE banners (audit-only verbatim; **§1–35** authoritative; §31.2 precedence); clarify GS-FOOD2 legacy “master” title does not override synthesized body.
5.0.1 — Cross-reference and terminology polish: §25 illustrative PackManifest JSON + §10 pointer; §6.1 **SHALL** vs MUST; **ApiErrorEnvelope** in §13/§32.1; §22 CM-neutral backend; §31.2 synthesized-body wording; §34.4 **OfflineModelBundleManifest**; SUMMARY appendix bullet; governance distinguishes blueprint revision vs pack pipeline.
5.0 — **Enterprise edition:** Document Control, RACI, RFC 2119 conformance, repository policy (blueprint-only), §31 artifact register without repo paths, **§35 enterprise NFR** (SLO/DR/RBAC/audit/residency/SDL), Full Source Merge renumbered to **§36**; removal of scaffold references from changelog narrative.
4.0 — Cook mode (§33); three-tier AI (§34); API extensions; OpenAPI cook paths in CM.
3.4 — §6.1 canonical `rule_id` naming; §13 OpenAPI artifact under CM; §32.1 standard API error code table; ApiErrorEnvelope pattern for codes; version 3.4.
3.3 — §32 API/observability/i18n/store privacy/backup/deep links/feature flags; §28.2 accessibility test protocol; §30.4 SBOM; §13 pointer; ApiErrorEnvelope; §31/§33 renumber (Full Source Merge).
3.2 — Plan implementation: §26–31 (regulatory, authorities/licensing, competitive/WCAG/edge cases, local encryption/sync/transparency, ops runbooks, reading guide); §4/7/11/15–17 updates; JSON Schemas versioned under CM; header reading guide.
3.1 — Completed Appendix D: appended full verbatim remainder of GS-FOOD2.md (sections 5–46); fixed splice formatting; updated Section 26 merge note.

This file is the canonical single-source **blueprint**. **Blueprint** revisions **SHALL** follow Document Control (rationale, reviewer sign-off per organization). **Pack** and **rule** content **SHALL** flow through the pack publishing pipeline (signature, golden-set gates in §15, governance in §30). Safety-impacting blueprint edits **SHALL** involve Safety & Curation review.

---

COPY-READY REPORT BLOCK

FOOD GUIDE APP — MASTER BLUEPRINT (COPY BLOCK)

Product: Food Guide App — an offline-first, privacy-first, camera-first household assistant: storage, separation, use-first, localized use hints, plus **Cook mode** (recipe suggestions from photos/ingredients, meal-time and cuisine context, Stories-style capture). **Blueprint v6.0.0** = program handoff baseline: implement **§1–35**; use **HANDOFF** section for gates; **§17.5** `UX-AC-01`–`UX-AC-11` for §17.1 QA. **Tiered capabilities** in **§5**; **user-centered commitments** in **§17.1**. **Three-tier AI:** Local-Light (rules + optional downloaded SLM), Device-Integrated (Gemini Nano / Apple Foundation Models where available), Cloud (opt-in). Strict evidence hierarchy; HTTP API contract (OpenAPI under CM); packs and optional offline model bundles with auto-update; compliance §26–27; machine-readable schemas per §31.3 artifact register (CM).

---

End of GS-FOOD3.md (v6.0.0 ENTERPRISE — PROGRAM HANDOFF BASELINE; appendices C–D verbatim archival)

====================================================================
APPENDIX C — GS-FOOD1.md (VERBATIM)
====================================================================

**ARCHIVAL NOTICE**  
The text below is a **verbatim** snapshot of **GS-FOOD1.md** retained for audit and lineage. It is **not** the live product specification. **Implementation, conformance, and compliance SHALL follow §1–35 above.** On conflict, the synthesized body wins over this appendix (§31.2). Use this section only to trace *why* a decision existed historically or to recover dropped nuance before folding it forward into §1–35.

SUMMARY
This is the improved blueprint after evaluating current open-source alternatives and current on-device / cloud AI options.
The conclusion is clear: do not copy pantry apps. Build a fast camera-first food storage assistant, and reuse open data, open-source patterns, and on-device AI runtimes.

FOOD GUIDE APP
IMPROVED COMPLETE BLUEPRINT
OPEN-SOURCE AND CUTTING-EDGE VERSION
PLAIN TEXT MASTER SPEC

1. EXECUTIVE DECISION

Build:
- a free mobile app
- no mandatory authentication
- offline-first
- local-first AI
- optional cloud enhancement
- region-aware and culture-aware
- camera-first
- short-answer-first

Do not build:
- a recipe manager clone
- a pantry spreadsheet clone
- a heavy household ERP
- a medical or scientific claim engine

Core product promise:
Take a picture or ask a question.
Get a direct answer:
- where to store food
- what should stay together
- what should stay apart
- what to use first
- how to use it in your local food culture

2. DEEP EVALUATION OF EXISTING OPEN-SOURCE / OPEN DATA OPTIONS

2.1 What already exists

A. Food storage reference
- USDA FoodKeeper
- useful for storage categories, freshness windows, quality guidance
- strong seed source for structured storage rules

B. Open product / barcode data
- Open Food Facts
- useful for barcode lookups, product naming, ingredients, packaging, categories
- good as enrichment, not as the main storage logic

C. Open-source pantry / kitchen systems
- Grocy
- KitchenOwl
- Mealie
- RecipeSage
- Norish
- Pantry
- smaller GitHub pantry apps and mobile inventory projects

2.2 What those products do well

Grocy:
- inventory
- shopping
- stock tracking
- household management
- barcode workflows

KitchenOwl:
- grocery list
- recipes
- meal planning
- Flutter frontend
- clean household workflow

Mealie:
- recipe management
- meal planning
- import recipes from URLs
- strong self-hosting pattern

RecipeSage:
- collaborative recipes
- shopping lists
- cross-platform household usage

Norish:
- modern household-first recipe and grocery collaboration
- real-time workflow
- clean modern product direction

FoodKeeper:
- structured storage guidance
- direct food storage use case
- good base for your rule engine

Open Food Facts:
- barcode/product enrichment
- localized product data
- open and reusable

2.3 What is missing in the market

None of the major open-source tools is centered on this exact job:
"What should I do with this food right now?"

The gap is:
- camera-first food storage guidance
- local cultural food-use guidance
- keep together / keep apart guidance
- offline-first mobile UX
- region-aware advice without login
- direct "store / move / use / separate" actions

This gap is your product opportunity.

2.4 What to reuse, not copy

Reuse from market:
- pantry inventory patterns
- barcode workflows
- simple shopping-list logic
- household region/language localization patterns
- self-hosted data architecture ideas
- modern meal planning UI ideas

Do not copy:
- complicated pantry counting
- enterprise-like inventory workflows
- admin-heavy data entry
- recipe-book-first UX
- account-first onboarding

3. IMPROVED PRODUCT POSITIONING

Best positioning:
A free, privacy-first, offline-first food storage and food-use assistant.

Plain app-store version:
This app helps people organize food at home.
It tells you where to store food, what should stay together, what should stay apart, what to use first, and how to use food in ways that fit your local culture and daily life.

4. PRODUCT DIFFERENTIATION

4.1 What makes this product distinct

- no mandatory account
- works offline
- local AI first
- direct actions, not long explanations
- kitchen organization support
- region-aware
- culture-aware
- climate-aware
- fast camera use
- free-first

4.2 User-facing output model

Default answer format:
- DO NOW
- STORE HERE
- KEEP WITH / KEEP APART
- USE LIKE THIS
- USE FIRST

Example:
DO NOW:
Move the bread out of the fridge.

STORE HERE:
Bread box or dry cabinet.

KEEP APART:
Moisture and wet produce.

USE LIKE THIS:
Eat soon, toast, or freeze extra slices.

USE FIRST:
Already opened loaf first.

5. BEST REFERENCE STACK TO BUILD THIS NOW

5.1 Open data and free data sources

Primary sources:
- USDA FoodKeeper dataset
- USDA FoodData Central
- Open Food Facts
- openFDA food enforcement
- EU RASFF consumers portal

Use them like this:
- FoodKeeper = storage baseline
- FoodData Central = canonical food naming and nutrient context
- Open Food Facts = barcode/product enrichment
- openFDA = US recall enhancement
- RASFF = EU recall enhancement

5.2 Open-source products to study during design
Use as benchmark repos only:
- Grocy
- KitchenOwl
- Mealie
- RecipeSage
- Norish
- Pantry
- Grocy Android
- small offline pantry apps on GitHub

5.3 Cutting-edge device AI stack

Android best path:
- Google AI Edge
- Gemini Nano where device supports it
- MediaPipe Tasks
- ML Kit barcode scanning
- optional ONNX Runtime Mobile fallback

iPhone best path:
- Core ML
- Apple Vision framework
- barcode recognition
- text recognition
- optional ONNX Runtime Mobile or ExecuTorch if custom model pipeline needed

Cross-platform runtime options:
- ONNX Runtime Mobile
- ExecuTorch
- TensorFlow Lite if required by selected models
- OpenCV for classical vision utilities only

6. FINAL ARCHITECTURE DECISION

6.1 Frontend
Use:
- Flutter

Why:
- one codebase
- strong camera support
- fast UI iteration
- good offline support
- works well with platform channels for Android and iOS native AI features

6.2 Backend
Use:
- Python
- FastAPI
- Postgres
- Redis
- object storage
- job queue

6.3 AI architecture
Use:
- on-device AI first
- rule engine first for common cases
- cloud AI only for low-confidence or complex cases
- structured specialist orchestration internally

6.4 Internal orchestration
Use:
- LangGraph or equivalent graph-based orchestration
- not free-form agent chat
- deterministic flow first
- specialist handoff only when required

7. IMPROVED PRODUCT ARCHITECTURE

7.1 App modes

Mode A:
Offline local mode
- no internet needed
- no sign-in needed
- local rules
- local OCR
- local barcode scanning
- local image detection for common foods
- local language generation for short answers

Mode B:
Hybrid mode
- local first
- cloud only when low confidence
- cloud only if user allows

Mode C:
Enhanced online mode
- advanced mixed-scene reasoning
- richer cultural adaptation
- stronger kitchen audit
- recall alerts
- faster content updates

7.2 Core system layers

Layer 1:
Capture layer
- camera
- photo upload
- voice input
- barcode input
- text input

Layer 2:
Perception layer
- barcode recognition
- OCR
- image labeling
- food object detection
- packaging detection
- cut/whole detection

Layer 3:
Normalization layer
- map detected items to canonical food entries
- resolve synonyms
- resolve local names
- resolve region-specific food names

Layer 4:
Decision layer
- storage rules
- separation rules
- pairing rules
- use-first rules
- leftovers rules
- freezing rules
- climate adjustment
- culture adjustment

Layer 5:
Response layer
- short action response
- region-aware language
- local food-use patterns
- reminder suggestions

Layer 6:
Optional cloud enhancement
- advanced mixed-scene interpretation
- hard-question reasoning
- update service
- regional content refresh
- evaluation system

8. INTERNAL AGENT / SWARM MODEL

8.1 Keep the swarm small and controlled

Agent 1:
Vision Agent
- detect food items
- detect containers
- detect shelf type
- detect food grouping

Agent 2:
Barcode and OCR Agent
- read product codes
- read labels
- read dates
- identify packaging text

Agent 3:
Food Mapper Agent
- map item to food ontology
- resolve local food names
- resolve culture-specific variants

Agent 4:
Storage Agent
- determine best storage place
- determine move-now advice
- determine counter/fridge/pantry/freezer recommendation

Agent 5:
Pairing Agent
- decide what can stay together
- decide what should stay apart
- detect organizational conflicts

Agent 6:
Usage Agent
- suggest what to use first
- suggest how to use food soon
- suggest local food-use direction
- suggest leftovers actions

Agent 7:
Region Agent
- adapt to climate
- adapt to location
- adapt to culture profile
- adapt naming and examples

Agent 8:
Verifier Agent
- compress output
- remove contradictions
- ensure short direct answer
- ensure safe fallback on low confidence

Agent 9:
Upgrade Governor Agent
- test new models
- compare versions
- canary release
- rollback on degradation

8.2 Runtime policy
Default path:
camera -> detect -> map -> decide -> verify -> answer

Complex path:
camera -> detect + OCR + barcode in parallel -> map -> region adjust -> decide -> verify -> answer

Cloud path:
if local confidence is low and cloud allowed:
send cropped or reduced data only
then merge cloud result with local rule result
then verify
then answer

9. KNOWLEDGE MODEL

9.1 Food record schema

Each food item must contain:
- food_id
- canonical_name
- aliases
- regional_names
- categories
- storage_options
- recommended_storage
- keep_together_rules
- keep_apart_rules
- use_methods
- use_first_priority
- after_cut_rules
- after_open_rules
- leftovers_rules
- freeze_rules
- humidity_notes
- climate_adjustments
- regional_adjustments
- usage_patterns
- language_templates

9.2 Rule families

Storage rules:
- fridge
- pantry
- freezer
- counter
- bread box
- dark cool area

Separation rules:
- raw animal products apart from ready-to-eat foods
- moisture-sensitive apart from wet items
- odor-sensitive apart from strong-odor items
- ethylene-sensitive away from ethylene-heavy produce when needed

Use rules:
- eat soon
- cook soon
- freeze now
- keep dry
- refrigerate after opening
- refrigerate after cutting
- do not stack
- keep covered
- keep ventilated

Culture rules:
- common local use
- common local storage style
- common local preparation pattern
- common local kitchen rhythm

10. REGION AND CULTURE ENGINE

10.1 Inputs
- device language
- locale
- timezone
- GPS if allowed
- manual country selection
- manual food-culture selection
- climate classification pack

10.2 Why this matters
The app must adapt:
- examples
- naming
- storage practicality
- use suggestions
- reminder timing
- local dish suggestions

10.3 Region profile output
REGION_PROFILE:
- country
- subregion
- climate band
- language
- food culture family
- preferred naming set
- kitchen storage context
- seasonal logic
- local use patterns

10.4 Conflict resolution
Priority order:
- spoilage prevention
- practical home storage
- local climate
- local culture
- user preference

11. COMPLETE FEATURE SET

11.1 Must-have
- camera scan
- text chat
- local food identification
- barcode scan
- storage recommendation
- keep together / apart recommendation
- use-first recommendation
- leftovers recommendation
- freezer recommendation
- region adaptation
- language adaptation
- offline mode
- no-login mode

11.2 Strong add-ons
- fridge audit
- pantry audit
- fruit bowl audit
- leftovers timer
- weekly food rotation reminder
- simple drink-water reminders
- simple seasonal food suggestions
- kitchen reset checklist

11.3 Later add-ons
- shared household mode
- smart fridge integrations
- meal planning
- shopping assistance
- public campaign deployments for municipalities
- white-label partner versions

12. USER FLOWS

12.1 Scan single item
User takes one picture.
App returns:
- item detected
- store here
- keep with / apart
- use like this
- use first priority

12.2 Scan shelf
User takes picture of fridge or pantry shelf.
App returns:
- what is okay
- what should move
- what should separate
- what to use first
- quick cleanup list

12.3 Ask by chat
User types:
- can this go in the fridge
- should these stay together
- what should I use first
- how can I use this food

App returns:
- short action answer
- optional local usage pattern

12.4 Low-confidence flow
App says:
I need one detail.
Is this cut or whole

13. ON-DEVICE AI IMPLEMENTATION

13.1 Android
Primary stack:
- Flutter app
- native Android plugin bridge
- ML Kit for barcode
- MediaPipe Tasks for vision
- Gemini Nano via Google AI Edge where available
- ONNX Runtime Mobile fallback for custom compact models

13.2 iPhone
Primary stack:
- Flutter app
- native iOS plugin bridge
- Vision framework for OCR and barcode
- Core ML for local inference
- ONNX Runtime Mobile or ExecuTorch only if custom model path is needed

13.3 Shared local components
- SQLite
- encrypted key-value settings
- local knowledge packs
- local embeddings optional
- deterministic rule engine
- local short-answer generation templates

13.4 Capability tiers

Tier 1 devices:
- barcode + OCR + rule engine
- no heavy scene detection

Tier 2 devices:
- common food image recognition
- short local text generation

Tier 3 devices:
- stronger local multimodal support
- mixed scene reasoning
- better offline conversation

14. CLOUD ENHANCEMENT STACK

14.1 Cloud responsibilities
- advanced scene reasoning
- ambiguous food recognition
- richer region adaptation
- continuous knowledge-pack publishing
- recall checks
- evaluation
- upgrade testing

14.2 Cloud should not be required for
- basic food storage answers
- basic barcode use
- basic pantry guidance
- core app startup
- core user journey

14.3 Cloud privacy rule
Only send cloud data if:
- user allowed cloud assist
- the local engine cannot confidently answer
- payload is minimized
- image is cropped where possible
- no permanent storage unless diagnostics enabled

15. OPEN-SOURCE / FREE SERVICE INVENTORY

15.1 Recommended base services

Open data:
- FoodKeeper
- FoodData Central
- Open Food Facts
- openFDA
- RASFF

Open-source benchmarking repos:
- Grocy
- Grocy Android
- KitchenOwl
- Mealie
- RecipeSage
- Norish
- Pantry
- small offline pantry apps

Open-source technical components:
- ONNX Runtime Mobile
- ExecuTorch
- OpenCV
- MediaPipe
- Flutter
- FastAPI
- Postgres
- Redis

15.2 Use decision
If free-first is mandatory:
- maximize on-device inference
- use open datasets
- use rules for common decisions
- use cloud sparingly
- store knowledge packs on CDN or simple object storage
- use anonymous evaluation only if user allows

16. CONTENT SYSTEM

16.1 Content style
No long essays.
Each food item needs:
- short store answer
- short separate answer
- short use answer
- short local-use hint
- quick mistakes list
- reminder tags

16.2 Food template
FOOD:
Tomato

STORE:
Whole = counter until ready
Cut = fridge

KEEP WITH:
Dry whole produce

KEEP APART:
Wet containers, leaking raw foods

USE:
Salad, sauce, sandwich, roast

LOCAL USE:
Europe = salad / sauce / bruschetta patterns
US = sandwich / salad / roast patterns
Asia = stir-fry / salad / sauce patterns
Africa = stew / sauce / side patterns

MISTAKES:
Putting all tomatoes into the fridge too early
Leaving cut tomato uncovered

17. INVENTORY DESIGN

17.1 Keep it lightweight
This app is not an inventory ERP.

17.2 Inventory sources
- recent scans
- recent barcodes
- recent shelf audits
- quick add by user

17.3 Inventory actions
- mark used
- mark finished
- mark frozen
- remind tomorrow
- remind this week
- add to use-first list

18. KITCHEN AUDIT SYSTEM

18.1 Audit types
- fridge audit
- pantry audit
- freezer audit
- fruit bowl audit
- leftovers audit

18.2 Output blocks
- GOOD
- MOVE
- SEPARATE
- USE FIRST
- OPTIONAL LOCAL IDEAS

18.3 Scoring style
Use:
- great
- okay
- needs attention

Do not use:
- technical scores
- scary warnings
- long analysis paragraphs

19. HEALTHY-LIVING LAYER

19.1 Scope
Keep this practical and simple.

19.2 Include
- drink water reminders
- use produce first reminders
- leftovers rotation reminders
- weekly fridge clean-up
- seasonal produce nudges
- simple kitchen hygiene reminders

19.3 Exclude initially
- disease advice
- diagnosis
- personal medical recommendations
- strict nutrition programs

20. DATA ARCHITECTURE

20.1 On-device
- SQLite for recent items, reminders, settings, inventory-lite
- encrypted storage for preferences
- file storage for images if user saves them
- local knowledge pack cache
- local model cache

20.2 Cloud
- Postgres for canonical food knowledge
- object storage for packs and models
- Redis for queue/cache
- evaluation warehouse
- release registry

20.3 Pack types
- base global food pack
- country pack
- culture pack
- language pack
- climate pack
- barcode enrichment mappings
- use-pattern pack

21. UPDATE SYSTEM

21.1 What updates offline users can receive
- knowledge pack updates
- language updates
- better region packs
- better local models
- better barcode mappings

21.2 Safe upgrade process
- download in background if allowed
- verify checksum
- keep current version
- install only if compatible
- rollback if failure

21.3 Cloud model rollout
- benchmark candidate
- compare with current
- canary deploy
- monitor error rate
- rollback automatically if worse

22. PRICING / DISTRIBUTION MODEL

22.1 Launch model
- free app
- no account
- no paywall for core features

22.2 Sustainability options
- municipality sponsorship
- food-waste reduction program sponsorship
- retailer partnership
- appliance partnership
- optional white-label contracts
- optional non-intrusive local campaign packs

22.3 Avoid
- forced ads
- profile-based ad targeting
- data brokerage
- friction-heavy onboarding

23. MVP DEFINITION

23.1 MVP categories
Start with:
- tomatoes
- bread
- milk
- yogurt
- cheese
- eggs
- chicken
- fish
- beef
- leafy greens
- cucumbers
- onions
- potatoes
- garlic
- apples
- bananas
- citrus
- berries
- herbs
- leftovers
- cooked rice
- cooked pasta

23.2 MVP features
- scan item
- scan shelf
- ask question
- barcode read
- local answers
- region adaptation
- short reminders
- no sign-up

24. PHASE PLAN

24.1 Phase 0
Research and foundation
- ontology
- food schema
- region profiles
- pack format
- UI wireframes
- local engine prototype

24.2 Phase 1
MVP mobile release
- Android first or Android + iPhone
- local OCR
- barcode
- basic food detection
- rule engine
- storage answers
- separation answers
- use-first answers
- region-aware templates

24.3 Phase 2
Enhanced cloud layer
- hard-case image reasoning
- advanced kitchen audit
- recall layer
- better localization
- smarter weekly reminders

24.4 Phase 3
Scale
- more foods
- more regions
- family mode optional
- public-sector deployments
- smart-kitchen integrations

25. WHAT TO BUILD FIRST

First concrete deliverables:
- product requirements document
- food ontology
- JSON schema for food records
- pack format
- mobile app architecture
- local AI runtime decision matrix
- region profile schema
- 500 golden test scenarios

26. BEST TECHNICAL DECISION SET

Recommended final stack:

Mobile:
- Flutter

Android local AI:
- ML Kit
- MediaPipe Tasks
- Gemini Nano via Google AI Edge where available
- ONNX Runtime Mobile fallback

iPhone local AI:
- Vision
- Core ML
- ONNX Runtime Mobile or ExecuTorch only if needed

Backend:
- Python
- FastAPI
- Postgres
- Redis
- object storage

Cloud AI orchestration:
- graph-based orchestrator
- deterministic paths first
- specialist agents internally
- verifier before response

Data:
- FoodKeeper
- FoodData Central
- Open Food Facts
- openFDA
- RASFF

27. FINAL BUILD RECOMMENDATION

Do not build a clone of Grocy, KitchenOwl, or Mealie.
Study them.
Reuse patterns.
But build a different product.

Build this:
A free, camera-first, privacy-first, offline-first food storage and food-use assistant that gives fast, short, location-aware answers and works locally on the phone, with optional online enhancement for hard cases.

28. MARKET WIN STRATEGY

Your winning edge is:
- faster than search
- simpler than pantry apps
- more practical than recipe apps
- more private than cloud-first assistants
- more useful daily than static food guides
- adaptable to local culture without setup burden

29. SOURCES REVIEWED

Official/open data:
https://www.foodsafety.gov/keep-food-safe/foodkeeper-app
https://catalog.data.gov/dataset/fsis-foodkeeper-data
https://fdc.nal.usda.gov/api-guide
https://openfoodfacts.github.io/openfoodfacts-server/api/
https://open.fda.gov/apis/food/enforcement/
https://food.ec.europa.eu/food-safety/rasff_en
https://webgate.ec.europa.eu/rasff-window/screen/consumers

Open-source / benchmark products:
https://github.com/grocy/grocy
https://grocy.info/
https://github.com/patzly/grocy-android
https://github.com/TomBursch/kitchenowl
https://docs.kitchenowl.org/
https://github.com/mealie-recipes/mealie
https://github.com/julianpoy/recipesage
https://github.com/julianpoy/recipesage-selfhost
https://github.com/norish-recipes/norish
https://github.com/netz-sg/pantry
https://github.com/AMWen/pantry_app
https://github.com/giankarlo-o/My-Pantry

On-device AI / mobile ML:
https://ai.google.dev/edge
https://developer.android.com/ai/gemini-nano
https://ai.google.dev/edge/mediapipe/solutions/vision/object_detector
https://developers.google.com/ml-kit/vision/barcode-scanning
https://onnxruntime.ai/docs/get-started/with-mobile.html
https://docs.pytorch.org/executorch/stable/index.html
https://executorch.ai/
https://developer.apple.com/machine-learning/core-ml/
https://developer.apple.com/documentation/vision

END OF ANSWER.

====================================================================
APPENDIX D — GS-FOOD2.md (VERBATIM)
====================================================================

**ARCHIVAL NOTICE**  
The text below is a **verbatim** snapshot of **GS-FOOD2.md** retained for audit and lineage. It is **not** the live product specification. **Implementation, conformance, and compliance SHALL follow §1–35 above.** On conflict, the synthesized body wins over this appendix (§31.2). GS-FOOD2’s internal title (“master source of truth”) applied **only** to that file’s era and does **not** override §1–35 in this document.

FOOD GUIDE APP
IMPROVED COMPLETE BLUEPRINT
CURRENT MASTER SOURCE OF TRUTH
ENGLISH (US)
VERSION 2.0

====================================================================
1. PRODUCT IDENTITY
====================================================================

Product working name:
FOOD GUIDE APP

Product category:
Mobile food storage, food-use, and kitchen organization assistant

Primary mission:
Help people decide what to do with food right now with the least possible friction.

Primary promise:
Take a picture, scan a barcode, or ask a short question.
Get a direct answer that tells the user:
- where to store it
- what should stay together
- what should stay apart
- what to use first
- what to do next
- how to use it in a locally relevant way

Primary design law:
The app is not a recipe manager, not a pantry ERP, not a nutrition coach, and not a medical advice system.
It is an action engine for home food storage and household food-use decisions.

Product thesis:
Existing pantry and recipe systems optimize tracking, planning, and lists.
This product must optimize immediate household action:
- move
- separate
- refrigerate
- freeze
- cover
- ventilate
- use first
- discard if unsafe
- check recall
- re-store correctly

====================================================================
2. EXECUTIVE BUILD DECISION
====================================================================

Build:
- free mobile app
- camera-first interaction
- offline-first architecture
- local-first AI
- deterministic rule engine for common cases
- optional cloud escalation for hard cases
- no mandatory account
- privacy-first data handling
- region-aware and culture-aware responses
- short-answer-first UX
- shelf and fridge audit workflows
- barcode, OCR, and image-based intake
- recall-awareness in online mode
- lightweight reminders and food rotation support

Do not build:
- recipe-book-first product
- spreadsheet pantry clone
- heavy household ERP
- health diagnosis tool
- clinical nutrition engine
- calorie tracker
- smart-home dependency trap
- cloud-only AI assistant
- onboarding-heavy account product

Market position:
Faster than search, simpler than pantry apps, more practical than recipe apps, more private than cloud-first assistants.

====================================================================
3. SOURCE-OF-TRUTH HIERARCHY
====================================================================

The app must use a strict evidence hierarchy for all food decisions.

Tier 1: Safety and storage authority
- official storage and food safety guidance
- official recall feeds
- explicit safety overrides

Tier 2: Canonical food identity and product enrichment
- food naming systems
- branded product identifiers
- barcode-linked metadata
- packaging and ingredient context

Tier 3: Local adaptation
- country pack
- region pack
- climate pack
- language pack
- culture pack
- local usage pattern pack

Tier 4: ML inference
- vision classification
- OCR extraction
- barcode parsing
- packaging state detection
- freshness cue extraction

Tier 5: Generative compression
- short natural-language output generator
- never authoritative by itself
- only formats and compresses decisions already grounded by rules and evidence

Decision priority order:
1. food safety and spoilage prevention
2. explicit product labeling
3. authoritative storage rules
4. cut/opened/leftover state
5. climate adjustment
6. region adjustment
7. culture-aware use suggestion
8. user preference
9. stylistic response generation

If any later layer conflicts with an earlier layer, the earlier layer wins.

====================================================================
4. PRODUCT DIFFERENTIATION
====================================================================

This product is distinct because it is:
- camera-first
- action-first
- local-first
- privacy-first
- direct-response-first
- household-practical
- climate-aware
- culture-aware
- no-login by default
- not built around recipe import, shopping plans, or stock accounting

The app must answer in a compact action grammar.

Canonical response format:
- DO NOW
- STORE HERE
- KEEP WITH
- KEEP APART
- USE FIRST
- USE LIKE THIS
- WHY
- CONFIDENCE
- OPTIONAL NEXT STEP

Example response:
DO NOW:
Move the cut cucumber into a sealed container.

STORE HERE:
Fridge crisper or cold shelf.

KEEP WITH:
Other sealed ready-to-eat vegetables.

KEEP APART:
Leaking raw meat, wet unpackaged produce, strong-odor foods.

USE FIRST:
The cut cucumber before whole vegetables.

USE LIKE THIS:
Salad, sandwich, yogurt dip, or quick pickle.

WHY:
It is already cut and will lose quality faster at room temperature.

CONFIDENCE:
High

OPTIONAL NEXT STEP:
Set a 2-day reminder.

====================================================================
5. PRIMARY USER SEGMENTS
====================================================================

Segment A: Busy households
Need:
- quick answers
- no setup burden
- shelf scanning
- food rotation help

Segment B: Students and young adults
Need:
- simple storage advice
- low-friction camera scan
- leftovers help
- avoid waste

Segment C: Families
Need:
- fridge and pantry audit
- use-first reminders
- child-safe household organization
- optional multi-user household mode later

Segment D: Older adults
Need:
- clear direct language
- large readable UI
- minimal steps
- high trust
- no complex account requirements

Segment E: Food-waste-conscious users
Need:
- use-first prioritization
- freezer suggestions
- local use ideas
- shelf cleanup workflow

====================================================================
6. NON-GOALS AND EXCLUSIONS
====================================================================

Initial product must not provide:
- diagnosis of foodborne illness
- allergy guarantees
- personalized medical advice
- exact microbiology timelines beyond supported authority data
- guaranteed freshness prediction from image alone
- “safe to eat” decisions based only on appearance
- full inventory accounting system
- enterprise warehouse workflows
- advanced meal planning as core UX
- ad-targeted monetization
- broad social feed mechanics

All safety language must be conservative.
When uncertain, the app must say it needs one more detail or must give the safer storage path.

====================================================================
7. CORE JOBS TO BE DONE
====================================================================

Job 1:
The user sees food and wants immediate storage instructions.

Job 2:
The user scans a shelf and wants a cleanup plan.

Job 3:
The user wants to know what should stay together or apart.

Job 4:
The user wants to know what to use first.

Job 5:
The user wants a practical local way to use food soon.

Job 6:
The user wants barcode-based recognition for packaged foods.

Job 7:
The user wants reminders without building a full inventory system.

Job 8:
The user wants privacy and offline function without account creation.

====================================================================
8. PRODUCT MODES
====================================================================

Mode A: Offline Local Mode
Capabilities:
- no internet required
- no account required
- local OCR where supported
- local barcode scanning
- local image inference for common foods
- local rules
- local response generation
- local reminders
- local region pack usage
- last-downloaded knowledge packs available offline

Limitations:
- no live recall lookups
- no cloud scene reasoning
- no server-side model escalation
- limited ambiguity handling on low-end devices

Mode B: Hybrid Assist Mode
Capabilities:
- local-first
- cloud escalation only when confidence is below threshold
- cloud only with user permission
- cropped/minimized payload transfer
- result merging with local rule engine
- live recall lookups
- content update checks

Mode C: Enhanced Online Mode
Capabilities:
- richer mixed-scene understanding
- stronger multi-item shelf reasoning
- live recall and safety feed checks
- faster knowledge-pack refresh
- better cultural adaptation
- remote evaluation and model comparison
- optional household sync later

====================================================================
9. COMPLETE CAPABILITY STACK
====================================================================

Intake capabilities:
- camera scan
- photo upload
- text question
- barcode scan
- voice question
- manual item picker
- shelf audit
- leftovers capture

Perception capabilities:
- barcode decoding
- OCR extraction
- object detection
- image classification
- packaging-type detection
- cut-vs-whole state detection
- opened-vs-sealed state inference
- shelf-type inference
- visible moisture/leak risk cues
- handwritten date capture when legible

Decision capabilities:
- storage location recommendation
- keep-together recommendation
- keep-apart recommendation
- use-first prioritization
- freeze-now suggestion
- leftovers handling
- post-opening handling
- post-cut handling
- humidity and ventilation handling
- climate adjustment
- region-aware wording
- local-use suggestion
- recall warning overlay in connected mode

Utility capabilities:
- reminder tomorrow
- reminder this week
- mark used
- mark frozen
- save to recent items
- add to use-first list
- audit checklist
- quick cleanup sequence

====================================================================
10. SYSTEM ARCHITECTURE OVERVIEW
====================================================================

Client:
- Flutter mobile app as primary cross-platform shell
- platform channels for native AI, camera, barcode, OCR, and system capabilities
- local database and cache
- local rules engine
- local prompt/template engine
- local analytics buffer with opt-in upload only

Server:
- Python FastAPI backend
- PostgreSQL canonical data store
- Redis cache and queue support
- object storage for packs, assets, and model manifests
- background job workers
- evaluation service
- policy service
- recall aggregation service
- pack publishing pipeline
- admin content tooling

AI architecture:
- rule engine first
- local deterministic decision path first
- multimodal inference second
- cloud reasoning third
- generation last
- verifier always last

Control architecture:
- graph-based orchestration for internal specialist routing
- deterministic paths for mainstream flows
- bounded branching
- strict confidence thresholds
- explicit fallback states
- no free-running autonomous agent behavior in the user path

====================================================================
11. FRONTEND DECISION
====================================================================

Primary mobile framework:
Flutter

Why:
- strong cross-platform support
- fast camera integration
- good offline support
- mature plugin ecosystem
- efficient shared UI development
- platform-channel access to native Android and iOS AI stacks

Client-side architecture pattern:
- feature-first modular structure
- clean architecture boundary
- immutable domain models
- repository pattern for data access
- event-driven state management
- offline command queue for sync-safe operations
- explicit capability probing per device

Recommended app package modules:
- app_shell
- onboarding
- camera_capture
- barcode_scan
- ocr_capture
- food_detection
- shelf_audit
- chat_assistant
- reminders
- use_first
- inventory_lite
- settings
- packs
- sync
- diagnostics
- privacy_controls
- accessibility

State management requirement:
Use a deterministic state container with replayable events.
Every UI decision should be reproducible from:
- user input
- model output
- rule result
- region profile
- pack version

====================================================================
12. NATIVE AI STRATEGY BY PLATFORM
====================================================================

12.1 Android strategy

Primary Android stack:
- ML Kit for barcode scanning
- ML Kit or equivalent on-device text extraction path
- MediaPipe Tasks or equivalent lightweight object detection for common food and shelf scenes
- Gemini Nano path on supported devices for compact on-device response compression and ambiguity clarification
- LiteRT runtime path for custom compact models and future-proof cross-device deployment
- ONNX Runtime Mobile as secondary fallback only when model compatibility or deployment constraints favor ONNX

Android capability tiers:

Tier A:
- barcode only
- OCR only
- rules only
- minimal storage answers

Tier B:
- barcode + OCR + basic image labeling
- single-item detection
- short local response templates

Tier C:
- shelf image reasoning with multiple detections
- local compact language generation
- better ambiguity resolution
- stronger offline shelf audit

Android engineering rule:
Do not make Gemini Nano a hard requirement.
The app must run usefully on non-supported Android devices.

12.2 iPhone strategy

Primary iPhone stack:
- Vision for barcode and text extraction
- VisionKit live scanning UX where appropriate
- Core ML for custom small vision models
- Apple Foundation Models framework as the preferred on-device language layer on supported Apple Intelligence devices
- template-driven response compression fallback for unsupported devices
- ONNX Runtime Mobile or ExecuTorch only when a custom model path cannot be served efficiently by Core ML

iPhone capability tiers:

Tier A:
- barcode + OCR + rules
- no local language model requirement

Tier B:
- Core ML vision inference
- short local response templates

Tier C:
- Foundation Models-based natural response compression
- richer offline dialog refinement
- stronger contextual phrasing

iPhone engineering rule:
Foundation Models must be opportunistic, not mandatory.
Core functionality must still work on older supported iPhones.

12.3 Shared runtime rule

Shared rule:
Never bind the whole product to a single AI runtime.
Use pluggable inference adapters:
- barcode adapter
- OCR adapter
- image detector adapter
- local language adapter
- cloud escalation adapter

This prevents lock-in and allows per-device capability negotiation.

====================================================================
13. AI DESIGN PRINCIPLES
====================================================================

Principle 1:
Rules beat language models for storage guidance.

Principle 2:
Generative output is formatting, compression, and clarification, not truth generation.

Principle 3:
Cloud is escalation, not dependency.

Principle 4:
Perception and decision are separate stages.

Principle 5:
Every answer must include a confidence classification.

Principle 6:
The user should be asked at most one clarifying question before fallback.

Principle 7:
The app must prefer “safe but slightly conservative” over “helpful but risky”.

====================================================================
14. INTERNAL SPECIALIST PIPELINE
====================================================================

Specialist 1: Vision Intake
Responsibilities:
- detect visible food items
- detect containers
- detect shelf types
- detect grouping
- detect obvious risk scenes like leaking raw products

Specialist 2: Barcode and Label Intake
Responsibilities:
- barcode decode
- product lookup
- label OCR
- date string extraction
- packaging keywords extraction

Specialist 3: Food Mapper
Responsibilities:
- canonical food mapping
- branded-to-generic mapping
- synonym resolution
- local naming resolution
- category normalization

Specialist 4: State Resolver
Responsibilities:
- whole vs cut
- sealed vs opened
- cooked vs raw
- fresh vs leftover
- containerized vs exposed

Specialist 5: Storage Engine
Responsibilities:
- best storage zone
- counter/fridge/freezer/pantry decision
- container guidance
- humidity and ventilation guidance

Specialist 6: Separation Engine
Responsibilities:
- keep together
- keep apart
- odor conflict
- moisture conflict
- raw-to-ready-to-eat separation
- ethylene-sensitive produce separation

Specialist 7: Use-First Engine
Responsibilities:
- urgency ranking
- opened-first logic
- cut-first logic
- leftovers-first logic
- spoilage risk prioritization

Specialist 8: Region and Culture Engine
Responsibilities:
- language and tone adaptation
- climate adjustment
- local naming
- local use examples
- local kitchen practicality

Specialist 9: Recall and Safety Overlay
Responsibilities:
- live recall check in connected mode
- safety overlay insertion
- conservative warning language
- authority-link metadata storage

Specialist 10: Verifier
Responsibilities:
- remove contradictions
- enforce short format
- ensure explanation matches evidence
- ensure safety fallback
- ensure no unsupported claims

====================================================================
15. RUNTIME FLOW
====================================================================

Default single-item flow:
capture input
-> extract evidence
-> map to canonical food
-> resolve state
-> apply storage rules
-> apply separation rules
-> apply use-first rules
-> apply region and culture adjustments
-> verify
-> generate short answer
-> offer reminder/save actions

Shelf audit flow:
capture shelf image
-> detect multiple items and containers
-> detect risk clusters
-> map visible items
-> infer shelf context
-> evaluate conflicts
-> rank actions
-> produce grouped output:
   GOOD
   MOVE
   SEPARATE
   USE FIRST
   OPTIONAL IDEAS

Packaged product flow:
scan barcode
-> product lookup
-> parse product name/category/packaging
-> read explicit label storage text if visible
-> map product to generic storage family
-> apply post-opening rules
-> answer

Low-confidence flow:
capture
-> conflicting evidence or low-confidence class
-> ask one short clarifying question
-> re-run decision
-> if still uncertain, return conservative fallback

Cloud escalation flow:
only if permission granted and threshold met
-> crop relevant image area
-> strip unnecessary metadata
-> send reduced payload
-> receive cloud interpretation
-> merge with local rule output
-> verify
-> return answer
-> do not store payload by default

====================================================================
16. KNOWLEDGE MODEL
====================================================================

16.1 Canonical food entity

Each food item record must include:
- food_id
- canonical_name
- generic_family
- branded_family_optional
- aliases
- regional_names
- plural_forms
- categories
- subcategories
- common_packaging_types
- raw_or_processed_flags
- typical_storage_options
- recommended_storage
- disallowed_storage
- container_guidance
- ventilation_guidance
- humidity_guidance
- light_exposure_guidance
- temperature_range_hint
- keep_together_rules
- keep_apart_rules
- ethylene_profile
- odor_profile
- moisture_profile
- after_cut_rules
- after_open_rules
- after_cook_rules
- leftovers_rules
- freeze_rules
- thaw_rules
- use_first_priority_logic
- shelf_audit_tags
- local_use_patterns
- mistakes_common
- safety_notes
- region_adjustments
- climate_adjustments
- language_templates
- authority_sources
- evidence_confidence
- pack_version
- last_reviewed_at

16.2 Product entity for barcode enrichment

Fields:
- barcode
- product_name
- brand
- quantity
- ingredients_text
- allergens_optional
- packaging_text
- storage_text_detected
- category_guess
- country_markets_optional
- linked_canonical_food_id
- confidence
- source_system
- source_updated_at

16.3 Shelf observation entity

Fields:
- observation_id
- captured_at
- image_reference_local
- zone_type
- detected_items[]
- container_presence[]
- risk_markers[]
- moisture_markers[]
- raw_ready_eat_conflict
- use_first_rankings[]
- audit_output
- confidence

====================================================================
17. RULE ENGINE
====================================================================

The rules engine is the real product core.

Rule families:
- storage placement
- container requirement
- ventilation requirement
- humidity sensitivity
- odor transfer sensitivity
- ethylene emission sensitivity
- ethylene sensitivity
- post-opening storage
- post-cut storage
- cooked leftovers handling
- use-first urgency
- freeze suitability
- thaw handling
- raw and ready-to-eat separation
- shelf conflict detection
- climate adjustment
- user preference adjustment
- language rendering templates

Rule types:
- hard safety rule
- hard storage rule
- soft quality rule
- soft practicality rule
- local custom rule
- explanation template rule

Example hard rule:
If item_state = raw_animal_product AND nearby_item_state = ready_to_eat_uncovered
-> enforce separation
-> confidence minimum medium
-> explanation required

Example hard rule:
If item = cut_fruit_or_vegetable AND time_since_cut unknown
-> prefer refrigerated covered storage

Example soft rule:
If item = whole_tomato AND ripeness < ripe
-> prefer counter over fridge unless climate or user preference pack overrides for practicality

Example local rule:
If region climate = very_hot_household_no_AC
-> reduce safe room-temperature recommendation duration for quality guidance
-> keep safety language conservative

Rule execution order:
1. explicit label instruction
2. safety and contamination rules
3. authoritative storage baseline
4. state-based modification
5. packaging-based modification
6. climate adjustment
7. region/culture adjustment
8. user preference adjustment
9. language template selection

====================================================================
18. CONFIDENCE MODEL
====================================================================

Confidence is required for every answer.

Confidence levels:
- HIGH
- MEDIUM
- LOW
- UNKNOWN

Confidence inputs:
- barcode certainty
- OCR clarity
- image classifier score
- state-detection confidence
- canonical mapping confidence
- rule coverage completeness
- contradiction count
- recall lookup freshness in online mode

Threshold policy:
HIGH:
direct answer, no clarification needed

MEDIUM:
direct answer allowed with concise reason

LOW:
ask one short clarifying question before final answer

UNKNOWN:
return conservative fallback and optionally suggest manual item selection

Confidence reduction triggers:
- multiple similar food candidates
- cut/whole state unresolved
- opened/sealed state unresolved
- poor image quality
- mixed shelf clutter
- contradicting OCR and image signals
- unknown local product with weak category map

====================================================================
19. REGION, LANGUAGE, AND CULTURE ENGINE
====================================================================

Inputs:
- device language
- locale
- timezone
- country
- optional user-selected culture profile
- optional GPS coarse region if allowed
- climate band pack
- kitchen type preference
- dietary pattern preference only for use examples, not nutrition advice

Outputs:
- localized naming set
- climate adjustment
- likely kitchen storage context
- culturally familiar use examples
- reminder timing preferences
- seasonal framing
- measurement wording

Conflict resolution:
- safety first
- spoilage prevention second
- practicality third
- local familiarity fourth
- user preference fifth

Examples of valid localization:
- bread box vs bread bin vs dry cupboard wording
- “scallion” vs “spring onion”
- local quick-use examples
- local produce naming
- climate-sensitive room-temperature phrasing

Culture engine constraints:
- only adapt examples and wording
- never override safety
- never invent unsupported local food science claims
- keep output short

====================================================================
20. CONTENT SYSTEM
====================================================================

Each food item must have compact editorial content blocks.

Required content blocks:
- short storage answer
- short keep-with answer
- short keep-apart answer
- short use-soon answer
- short local-use hint
- common mistakes
- reminder tags
- fallback phrasing
- low-confidence clarification question
- discard/escalate phrasing where applicable

Example editorial pattern:

FOOD:
Tomato

WHOLE STORAGE:
Counter until ripe, then short counter hold or fridge if needed for longevity.

CUT STORAGE:
Fridge in covered container.

KEEP WITH:
Dry intact produce.

KEEP APART:
Leaking raw foods and wet open containers.

USE SOON:
Cut pieces first.

USE IDEA:
Salad, sauce, sandwich, roast, quick saute.

COMMON MISTAKES:
Refrigerating all tomatoes too early.
Leaving cut tomato uncovered.

Editorial style rules:
- short
- direct
- no essay tone
- no moralizing
- no false certainty
- no medical framing
- household language only

====================================================================
21. LIGHTWEIGHT INVENTORY DESIGN
====================================================================

This is not a stock ledger.

Purpose of inventory-lite:
- support recent-item memory
- power reminders
- power use-first list
- improve repeat answers
- support shelf history
- reduce re-entry friction

Inventory-lite sources:
- recent scans
- saved recent items
- recent barcodes
- shelf audit captures
- manual quick add
- leftovers save action

Inventory-lite actions:
- mark used
- mark finished
- mark frozen
- mark opened
- mark cut
- save reminder
- pin to use-first
- remove from recent

Inventory-lite constraints:
- no mandatory quantities
- no complex purchase records
- no batch accounting
- no expiry ledgers as primary UX
- no admin-heavy forms

====================================================================
22. KITCHEN AUDIT SYSTEM
====================================================================

Audit types:
- fridge audit
- pantry audit
- freezer audit
- fruit bowl audit
- leftovers audit

Audit output structure:
- GOOD
- MOVE
- SEPARATE
- USE FIRST
- OPTIONAL IDEAS

Audit tone:
- calm
- practical
- non-judgmental
- no technical score display to end users

Internal audit scoring dimensions:
- contamination risk
- humidity conflict
- odor conflict
- storage mismatch
- urgency
- visible clutter
- exposure state

Public output labels:
- great
- okay
- needs attention

Never output:
- scary risk scores
- scientific jargon
- long paragraphs

====================================================================
23. REMINDERS AND HEALTHY-LIVING LAYER
====================================================================

Initial reminder scope:
- use produce first
- leftovers rotation
- weekly fridge reset
- pantry quick check
- drink water reminder optional
- freeze-now suggestion
- tomorrow check reminder

Do not include initially:
- disease advice
- meal plans
- calorie targets
- strict diet systems
- symptom-based recommendations

Reminder principles:
- few notifications
- useful timing
- local processing by default
- no dark-pattern retention tactics

====================================================================
24. DATA SOURCES AND THEIR ROLES
====================================================================

FoodKeeper role:
- structured seed for storage windows and storage placement guidance
- baseline authority source
- not sufficient alone for all packaged, regional, and shelf-context decisions

FoodData Central role:
- canonical food naming and family mapping
- broader food identity normalization
- nutrient context only as internal taxonomy support, not as diet coaching

Open Food Facts role:
- barcode enrichment
- product names
- ingredients
- packaging clues
- branded-to-generic mapping support
- localization support
- not the source of truth for storage science by itself

openFDA food enforcement role:
- U.S. recall overlay
- recall detail enrichment
- online-only safety augmentation

EU RASFF role:
- EU recall overlay
- consumer-facing recall awareness
- online-only safety augmentation

Internal curated packs role:
- local naming
- culture patterns
- climate adjustments
- corrected mappings
- explanation templates
- quality-control overrides

====================================================================
25. DATA PACK SYSTEM
====================================================================

Pack types:
- base_global_food_pack
- country_pack
- culture_pack
- language_pack
- climate_pack
- barcode_mapping_pack
- packaging_cue_pack
- shelf_audit_pattern_pack
- use_pattern_pack
- correction_override_pack

Pack manifest fields:
- pack_id
- pack_type
- semantic_version
- compatible_app_versions
- region_scope
- language_scope
- authority_sources[]
- checksum
- created_at
- expires_at_optional
- rollback_version
- signing_key_id
- min_schema_version

Pack installation policy:
- verify signature
- verify checksum
- validate schema
- stage install
- run compatibility check
- activate only if all checks pass
- retain previous version for rollback

Offline behavior:
- use last valid installed pack
- show pack age in diagnostics
- never block core functionality because update service is unreachable

====================================================================
26. ON-DEVICE DATA ARCHITECTURE
====================================================================

Local stores:
- SQLite for structured app data
- secure encrypted preferences store
- file cache for retained scans if user saves them
- local pack cache
- model cache
- recent audit cache
- local event log for debugging with opt-in export only

Suggested local database tables:
- user_preferences
- region_profile
- recent_items
- saved_items
- reminders
- use_first_queue
- scans
- barcode_cache
- food_entity_cache
- pack_registry
- local_model_registry
- audit_history
- sync_queue
- consent_settings
- diagnostics_events

Image retention default:
- temporary only
- auto-delete after processing unless user explicitly saves
- thumbnails only for recent history if enabled
- no cloud upload by default

====================================================================
27. CLOUD BACKEND ARCHITECTURE
====================================================================

API framework:
- FastAPI

Core services:
- api_gateway
- auth_optional_service
- pack_registry_service
- canonical_food_service
- barcode_enrichment_service
- recall_service
- cloud_reasoning_service
- evaluation_service
- telemetry_ingest_opt_in
- moderation_and_policy_service
- admin_curation_service
- release_management_service

Primary databases:
- PostgreSQL for canonical entities, packs, curation, and user opt-in data
- Redis for queueing, short-lived cache, and job coordination
- object storage for images when explicitly retained, packs, and model artifacts

Background jobs:
- recall ingestion
- pack generation
- curation review tasks
- model benchmark jobs
- analytics aggregation
- canary evaluation
- cleanup jobs
- content diff jobs

Cloud responsibility boundaries:
Cloud may handle:
- hard-case scene reasoning
- recall checks
- pack publishing
- curated corrections
- evaluation and benchmarking
- optional household sync later

Cloud must not be required for:
- startup
- basic storage answers
- basic barcode use
- basic text answers
- local reminders
- core user flow

====================================================================
28. API SURFACE
====================================================================

Public mobile API endpoints, phase 1:

POST /v1/resolve/item
Input:
- text question and/or normalized local evidence
Output:
- structured answer blocks
- confidence
- evidence summary
- suggestion actions

POST /v1/resolve/shelf
Input:
- normalized shelf observations
Output:
- grouped audit plan

POST /v1/barcode/lookup
Input:
- barcode
Output:
- product enrichment
- canonical mapping candidates

GET /v1/packs/manifest
Output:
- available packs
- compatibility info
- checksums

GET /v1/packs/download/{pack_id}
Output:
- signed pack payload

GET /v1/recalls/check
Input:
- region
- barcode or canonical food IDs
Output:
- relevant recall notices if any

POST /v1/eval/report
Input:
- opt-in anonymized decision trace
Output:
- accepted receipt

POST /v1/feedback/correction
Input:
- user correction
- optional evidence
Output:
- ticket receipt

Internal admin endpoints:
- pack publish
- pack rollback
- curation queue
- benchmark trigger
- model canary compare
- source refresh
- taxonomy merge review

All API outputs must be structured JSON first.
Human-readable text is produced either on device or by the response formatter.

====================================================================
29. SAFETY, TRUST, AND LEGAL POSITIONING
====================================================================

The app must clearly state:
- this is practical household guidance
- it is not medical advice
- recall checks are supplemental and depend on connectivity and source freshness
- images alone are not enough to guarantee safety
- label instructions and official recalls override generic guidance

Required safety behaviors:
- if raw meat contamination risk is detected, force separation guidance
- if the item appears spoiled but confidence is low, avoid claiming spoilage as fact; recommend caution and verification
- if recall data matches, show priority warning
- if date text is unreadable, do not fabricate an expiry conclusion
- if the item is baby food, infant formula, or medically sensitive category, route to stricter wording and authority-first behavior

Prohibited behaviors:
- inventing food safety certainty
- giving medical advice
- overriding explicit package instructions without cause
- downplaying recalls
- claiming freshness from appearance only
- making legal compliance guarantees to institutions

====================================================================
30. PRIVACY AND SECURITY
====================================================================

Core privacy commitments:
- no mandatory account
- local-first processing
- cloud only with explicit user permission when needed
- minimized payloads
- no permanent image storage by default
- opt-in analytics only
- no data brokerage
- no profile-based ad targeting

Security controls:
- TLS for all network traffic
- signed pack downloads
- checksum verification
- secure local preference storage
- secret rotation on server
- role-based admin access
- audit logs for content changes
- server-side rate limiting
- abuse monitoring
- malware scanning for uploaded admin pack assets
- image payload minimization and redaction where practical

Data minimization rules:
- send crop, not whole image, when crop is enough
- send normalized evidence instead of raw image when possible
- remove EXIF before upload unless needed for explicit user-approved diagnostics
- avoid storing free-form user text beyond need
- retain analytics only in aggregated or pseudonymous form when opted in

====================================================================
31. LICENSING AND OPEN-SOURCE REUSE POLICY
====================================================================

Reuse policy:
- study open-source pantry and kitchen projects as design references
- do not clone their product UX wholesale
- do not import copyleft code into commercial distribution paths without deliberate review
- isolate optional server-side components with separate license review if needed
- prefer permissive libraries for core app and core runtime

Benchmark-only projects:
- Grocy
- KitchenOwl
- Mealie
- RecipeSage
- related pantry apps

What to reuse conceptually:
- barcode flows
- household organization patterns
- simple recent-item workflows
- self-hosted pack architecture ideas
- meal-context cross-links only where useful

What not to inherit:
- admin-heavy inventory models
- recipe-first IA
- shopping-list-first IA
- account-first onboarding
- ERP-like quantity management

====================================================================
32. UX PRINCIPLES
====================================================================

UX laws:
- camera should be the fastest entry path
- answers must fit on one screen in common cases
- user should get value before any settings
- no mandatory setup flow
- one-tap actions after answer
- ask for one clarification maximum
- show confidence quietly, not dramatically
- make correction easy
- reduce typing wherever possible

Primary tabs:
- Scan
- Ask
- Use First
- Audits
- Saved
- Settings

Primary home screen:
- big camera action
- quick barcode action
- ask a question field
- continue recent item
- weekly use-first card

Answer screen actions:
- remind tomorrow
- remind this week
- mark stored
- save item
- scan shelf
- ask follow-up

Accessibility:
- large text support
- voice input
- clear contrast
- icon + text labels
- simple sentence mode
- reduced motion mode
- offline indicators

====================================================================
33. DETAILED USER FLOWS
====================================================================

33.1 Single item by camera
1. user opens Scan
2. user photographs tomato
3. local detector proposes “tomato”
4. state resolver checks whole vs cut
5. rules apply
6. answer renders
7. quick actions displayed
8. optional save/reminder

33.2 Packaged item by barcode
1. user taps barcode
2. barcode decoded locally
3. product lookup resolves brand/product/category
4. OCR optionally reads storage text
5. canonical mapping selected
6. post-opening rules prepared
7. answer renders

33.3 Shelf audit
1. user photographs fridge shelf
2. multi-object detector runs
3. risk cluster detection runs
4. detected items mapped
5. rule engine identifies conflicts
6. grouped action list returned

33.4 Text question
User asks:
“Should cut onions stay in the pantry?”
System:
- parse entities
- resolve item and state
- rules answer directly
- no model required unless clarification needed

33.5 Low-confidence clarification
System asks:
“Is it cut or whole?”
or
“Is the package already opened?”
Never ask multi-part clarification in one step.

33.6 Recall interaction
If online and match found:
- display recall banner first
- do not bury safety notice below general storage advice
- provide next action wording

====================================================================
34. RESPONSE GENERATION RULES
====================================================================

All answers are generated from structured slots.

Required response slots:
- do_now
- store_here
- keep_with
- keep_apart
- use_first
- use_like_this
- why
- confidence
- next_step_optional

Generation rules:
- max 1 sentence per slot in default mode
- no hedging overload
- no chain-of-thought exposure
- no unsupported science language
- use local naming where pack permits
- if safety concern exists, lead with that
- if confidence low, say what single detail is missing

Tone:
- calm
- competent
- practical
- reassuring without overpromising

====================================================================
35. MVP SCOPE
====================================================================

Initial food coverage:
- tomatoes
- bread
- milk
- yogurt
- cheese
- eggs
- chicken
- fish
- beef
- leafy greens
- cucumbers
- onions
- potatoes
- garlic
- apples
- bananas
- citrus
- berries
- herbs
- leftovers
- cooked rice
- cooked pasta

MVP features:
- camera scan single item
- barcode scan
- text ask
- shelf audit basic
- local rules
- local templates
- region adaptation
- use-first list
- reminders
- no sign-up
- optional connected recall check
- correction submission

MVP exclusions:
- family sharing
- shopping list
- full meal planning
- smart-fridge integration
- retailer integrations
- public-sector white-labeling
- advanced cloud scene reasoning beyond guarded beta

====================================================================
36. PHASED ROADMAP
====================================================================

Phase 0: Foundation
Deliverables:
- taxonomy
- food schema
- pack schema
- region profile schema
- rules engine prototype
- mobile IA
- golden test corpus
- device capability matrix

Phase 1: MVP app
Deliverables:
- Flutter shell
- barcode
- OCR
- basic food detection
- rules engine
- answer cards
- reminders
- basic shelf audit
- pack updater
- privacy controls

Phase 2: Hybrid intelligence
Deliverables:
- cloud escalation
- recall service
- model comparison harness
- richer shelf audit
- admin curation tools
- correction review pipeline

Phase 3: Scale and partnerships
Deliverables:
- more foods
- more country packs
- household sync optional
- municipal deployment mode
- retailer or appliance partnership adapters
- white-label program

====================================================================
37. EVALUATION AND QUALITY SYSTEM
====================================================================

You need a disciplined evaluation harness from day one.

Evaluation categories:
- canonical mapping accuracy
- barcode-to-food mapping accuracy
- single-item storage answer accuracy
- keep-apart rule accuracy
- use-first prioritization accuracy
- shelf audit action ranking quality
- clarification effectiveness
- offline latency
- battery impact
- hallucination rate in generated text
- contradiction rate
- recall overlay precision

Golden set requirement:
At least 500 golden scenarios before wide launch.

Golden scenario types:
- whole vs cut
- sealed vs opened
- raw vs cooked
- shelf clutter
- mixed fridge shelf
- produce bowl
- leftovers container
- packaged dairy
- region-specific naming
- ambiguous lookalikes
- low-light image
- blurry barcode
- conflicting OCR
- hot-climate adjustment

Evaluation outputs:
- pass/fail by category
- confidence calibration report
- regression diff report
- user-facing wording regression report
- battery/latency benchmark

User correction loop:
- accept in-app correction
- route to moderation queue
- create candidate mapping adjustment
- test against golden set
- publish only after review

====================================================================
38. OBSERVABILITY AND DIAGNOSTICS
====================================================================

Local diagnostics:
- app version
- pack version
- model version
- capability tier
- last update check
- last successful barcode lookup
- last recall sync
- offline/online state

Server diagnostics:
- pack publish status
- source ingestion freshness
- recall feed freshness
- cloud escalation latency
- model canary comparison
- rule conflict incidence
- correction queue backlog

User-visible diagnostics page:
- simple and readable
- no raw secrets
- useful for support export
- explicit privacy controls

====================================================================
39. RELEASE MANAGEMENT
====================================================================

Release channels:
- internal dev
- dogfood
- beta
- stable

Pack channels:
- canary
- stable
- long-term fallback

Release safety:
- signed artifacts
- staged rollout
- rollback support
- backward-compatible pack validation
- feature flags for cloud escalation
- server kill-switch for faulty pack

Model rollout:
- benchmark candidate model
- compare with current
- canary small cohort
- monitor latency, battery, answer quality
- rollback if degradation detected

====================================================================
40. PERFORMANCE TARGETS
====================================================================

Startup:
- fast cold start
- scan action visible immediately

Single barcode response:
- near-instant local decode
- degraded but usable if network absent

Single-item answer:
- local answer in a few seconds on mainstream devices
- faster on high-tier devices

Shelf audit:
- basic result in short acceptable time
- progressive rendering allowed:
  first quick issues, then full grouped answer

Battery constraints:
- avoid continuous background vision
- short burst inference only
- no heavy idle model residency on low-end devices
- aggressive cache reuse

Storage constraints:
- modular model downloads
- pack compression
- selective language pack install
- device-tier-specific model bundles

====================================================================
41. TEAM AND IMPLEMENTATION WORKSTREAMS
====================================================================

Workstream A: Product and UX
- information architecture
- answer card design
- audit UX
- onboarding-free flow
- accessibility

Workstream B: Mobile client
- Flutter shell
- state management
- storage layer
- pack handling
- native bridges

Workstream C: Android intelligence
- barcode
- OCR
- detector integration
- Gemini Nano adapter
- LiteRT integration

Workstream D: iPhone intelligence
- Vision
- VisionKit
- Core ML
- Foundation Models adapter
- fallback template runtime

Workstream E: Rules and taxonomy
- food ontology
- storage rules
- separation rules
- use-first logic
- region adjustment

Workstream F: Backend and curation
- FastAPI services
- canonical data
- pack publishing
- admin tools
- correction workflow

Workstream G: Safety and compliance
- privacy reviews
- data minimization
- copy review
- recall logic
- moderation policy

Workstream H: Evaluation
- golden sets
- regression harness
- calibration
- latency and battery benchmarks
- quality gates

====================================================================
42. MONETIZATION AND DISTRIBUTION
====================================================================

Launch business model:
- free app
- no account wall
- no core feature paywall

Future sustainability options:
- municipality sponsorship
- food waste reduction programs
- retailer partnership
- appliance partnership
- white-label deployments
- optional premium household sync later

Avoid:
- forced ads
- behavioral ad targeting
- selling user data
- friction-heavy subscription traps
- paywalling the core answer loop

====================================================================
43. FINAL BUILD RECOMMENDATION
====================================================================

Do not build a clone of Grocy, KitchenOwl, Mealie, or RecipeSage.

Study them for:
- information architecture lessons
- lightweight recent-item patterns
- grocery and barcode ergonomics
- self-hosted backend patterns
- household collaboration ideas for later phases

But build a different product:
A free, camera-first, privacy-first, offline-first food storage and food-use assistant that gives fast, short, practical, region-aware answers locally on the phone, with optional online enhancement only for hard cases and live recall overlays.

====================================================================
44. WHAT TO BUILD FIRST
====================================================================

Immediate deliverables:
1. product requirements document
2. food ontology v1
3. JSON schemas for food, product, shelf observation, region profile, and pack manifest
4. deterministic rules engine specification
5. mobile app architecture document
6. Android capability matrix
7. iPhone capability matrix
8. 500-scenario golden evaluation set
9. content template library
10. admin curation workflow
11. pack publishing pipeline
12. privacy and safety copy pack

====================================================================
45. FINAL STACK RECOMMENDATION
====================================================================

Mobile shell:
- Flutter

Android:
- ML Kit
- MediaPipe Tasks or equivalent lightweight detector
- Gemini Nano where supported
- LiteRT as preferred future-facing custom runtime path
- ONNX Runtime Mobile as fallback where deployment fit is better

iPhone:
- Vision
- VisionKit where useful
- Core ML
- Foundation Models on supported devices
- ONNX Runtime Mobile or ExecuTorch only if needed

Backend:
- Python
- FastAPI
- PostgreSQL
- Redis
- object storage
- background job workers

Data:
- FoodKeeper baseline
- FoodData Central canonical naming support
- Open Food Facts barcode enrichment
- openFDA recall overlay
- EU RASFF recall overlay
- curated internal packs

AI orchestration:
- deterministic graph-based workflow
- bounded specialist routing
- verifier before response
- rule-first, generation-last

====================================================================
46. ONE-SENTENCE PRODUCT DEFINITION
====================================================================

FOOD GUIDE APP is a privacy-first, offline-first, camera-first household food assistant that tells people exactly where to store food, what to separate, what to use first, and what to do next, using local rules and on-device AI first, with optional cloud help only for hard cases.

====================================================================
END OF APPENDIX D — GS-FOOD2.md (VERBATIM, COMPLETE)
====================================================================
GS FOOD — Enterprise Architecture Improvement Blueprint
Production Readiness Directive and Immediate Execution Specification

1. Executive Summary

GS FOOD is a hybrid culinary intelligence platform composed of a legacy Python backend, the stitch_pantry_planner_ui experience layer, and a vendored Node.js intelligence engine named FREE AI. The platform already demonstrates strong architectural instincts: provider ladders exist, budget guardians exist, internal routing is constrained, and the FastAPI boundary is security-aware. The current platform is not failing because it lacks ideas or technical ambition. It is failing to reach production readiness because the highest-capability reasoning and orchestration engine, FREE AI, is not yet authoritative in the live request path, leaving GS FOOD in a fragmented dual-brain state.

The immediate production objective is to eliminate architectural ambiguity. Python must become the stable API facade, authentication boundary, policy gateway, persistence coordinator, and external service surface. FREE AI must become the primary reasoning, orchestration, provider-governance, schema-repair, and intelligence execution core. Legacy Python-side agent logic must be reduced to transport, compatibility, and policy-adjacent duties only. GS FOOD must not remain a dual-brain architecture.

The current system score remains constrained because the advanced runtime controls are incomplete in the production path. The bridge from Python to FREE AI is not finalized. The structured output repair system is still too dependent on extraction-first retries. The memory graph remains incomplete, so cross-session personalization is weak. Scheduled provider probes are missing, so provider volatility and throttling can silently degrade the platform. Evidence receipts exist, but the decision graph is incomplete, so traceability, rollback, and root-cause analysis are materially weaker than required for production operation.

This blueprint is an implementation directive. The next agent must treat it as authority to begin building immediately. The next agent must not merely comment on the design. The next agent must implement the system directly from this specification, including code, contracts, schemas, bridge logic, validation flows, telemetry, persistence, probes, control-plane surfaces, and rollout mechanics. Execution is required. Commentary is insufficient. The receiving agent must start writing the implementation directly from this blueprint.

Donor-derived runtime patterns are generalized into GS FOOD only where they improve production readiness without distorting the product. Those patterns include strict request and response contracts, normalized infer-result handling, health-aware fallback behavior, telemetry event taxonomy, non-bypassable enforcement pipelines, schema normalization, stateful observability events, server-side secret isolation, structured ingestion discipline, and operator-facing control-plane patterns. Donor-specific domain behavior, styling, branding, and irrelevant chat-oriented patterns are not adopted.

2. Current-State Architectural Baseline

2.1 Operational Reality

GS FOOD currently operates as a hybrid system with three practical centers of gravity.

The first center is the legacy Python backend. It currently acts as the externally reachable API surface and also retains legacy agent-hub behavior. This means Python still performs request acceptance, security enforcement, some orchestration behavior, and compatibility logic. This role is too broad for the target state and is the primary source of integration drag.

The second center is stitch_pantry_planner_ui. This is the user-facing interaction layer and should remain thin. It should not own reasoning, provider selection, memory logic, or policy logic. It should emit well-formed requests and render validated results, traces, and controlled UI states only.

The third center is FREE AI, the vendored Node.js intelligence engine. FREE AI is the most advanced runtime in the platform. It already contains stronger orchestration, retrieval, routing, and intelligence execution capabilities than the Python-side logic. However, FREE AI is not yet fully authoritative because the Python bridge is incomplete. As a result, GS FOOD continues to exhibit fragmented request handling and duplicated logic risk.

2.2 Current Strengths That Must Be Preserved

The Python boundary is already security-forward. Internal routing restrictions exist. JWT-based isolation exists. FastAPI hardening is present. These properties make Python the correct location for external ingress, authentication, tenancy boundaries, rate controls, and policy enforcement.

Provider ladders and budget guardian logic already exist conceptually and likely partially in runtime. That means the platform already understands provider sequencing, cost ceilings, fallback posture, and volatility management. This must be preserved and relocated into the authoritative intelligence execution path centered in FREE AI.

Evidence receipts are already generated. That means GS FOOD already has the beginnings of traceability discipline. The production upgrade is not to discard receipts but to expand them into a durable decision graph with structured event storage.

2.3 Current Weaknesses Blocking Production Readiness

The Python backend has not fully adopted FREE AI as the unified intelligence core. This causes split decision logic, weak contract discipline, duplicated orchestration risk, inconsistent output handling, and unclear ownership of retries, validation, and fallback.

The memory graph remains design-only or partial. This caps reasoning quality, cross-session continuity, household personalization, dietary safety recall, and long-term preference inference.

The provider probe subsystem is missing. This leaves external inference provider health largely reactive. Silent model deprecations, throttling, latency spikes, or schema drift can degrade the platform before operators understand the failure pattern.

The schema repair pipeline is primitive. The system still relies too heavily on extraction-first retry behavior rather than a structured validation and repair family. This wastes tokens, increases latency, raises failure variability, and allows malformed outputs to move too close to end-user exposure.

The observability and control surface is incomplete. Evidence receipts exist, but operator-grade request tracing, repair visibility, memory review, provider health status, and rollout monitoring do not yet exist as a unified operational plane.

2.4 Production Readiness Interpretation

The platform is promising but not production-ready. The blockers are structural, not cosmetic. The path to production readiness is therefore to finish the authority handoff from Python-side orchestration to FREE AI, enforce strict contracts at the bridge, add a non-bypassable validation and promotion pipeline, persist the decision graph, operationalize provider probes, and complete the memory graph with trust-gated write semantics.

3. System Composition and Runtime Boundaries

3.1 Client/UI Layer

Target component or subsystem:
stitch_pantry_planner_ui

Implementation objective:
Reduce the UI to a presentation and request-capture layer that emits typed request envelopes and renders only validated, promoted results and controlled degraded states.

Concrete files, modules, services, or layers to create or modify:
- ui/services/gsFoodApiClient
- ui/types/requestEnvelope
- ui/types/responseEnvelope
- ui/state/requestTraceSummary
- ui/components/admin/* only if an internal admin front end exists within the UI surface
- UI request serializer and response normalizer layers

Contracts and data structures:
The UI must emit the canonical request envelope defined in Section 8 and receive the canonical response envelope. No UI-side provider logic, memory logic, repair logic, or orchestration logic is permitted.

Runtime behavior:
The UI submits requests to Python only. It never talks directly to FREE AI. It renders status states including queued, processing, degraded, quarantined-preview, validated-success, and blocked-error. It may optionally display trace summaries if authorized.

Validation rules:
Client-side validation is limited to request completeness, allowed enum values, and basic payload shape. Business and intelligence validation remain server-side.

Operational controls:
UI feature flags must allow:
- bridge-rollout mode selection indicator
- admin trace visibility gating
- degraded-mode banner visibility
- prompt-evaluation tooling visibility for authorized roles only

Rollout sequence:
UI changes can ship early as long as they remain backward compatible with the current Python API, then switch to strict request envelope mode once Python bridge endpoints are live.

Failure handling:
If the response status indicates degraded, blocked, or quarantined-preview, the UI must render a controlled state, not raw provider output.

Acceptance criteria:
- UI emits canonical request envelope fields
- UI never invokes FREE AI directly
- UI can render validated and degraded states distinctly
- UI supports correlation ID display for support workflows

3.2 Python API and Legacy Service Layer

Target component or subsystem:
Python FastAPI service

Implementation objective:
Convert Python into the stable API facade, auth boundary, policy gateway, persistence coordinator, bridge owner, and external service surface. Remove or downgrade legacy Python intelligence orchestration.

Concrete files, modules, services, or layers to create or modify:
- server/app/main.py
- server/app/clients/free_ai_client.py
- server/app/contracts/request_envelope.py
- server/app/contracts/response_envelope.py
- server/app/contracts/error_contracts.py
- server/app/routes/intelligence.py
- server/app/security/internal_service_auth.py
- server/app/policies/request_policy.py
- server/app/telemetry/event_emitter.py
- server/app/persistence/decision_trace_writer.py
- server/app/persistence/memory_write_coordinator.py
- server/app/compat/legacy_agent_shim.py
- server/app/health/free_ai_health.py

Contracts and data structures:
Python owns the external request contract and validates ingress envelopes. Python also validates normalized FREE AI responses before returning them externally. Python persists decision traces and coordinates any durable writes approved by the promotion pipeline.

Runtime behavior:
Python accepts inbound requests, authenticates them, applies ingress policy, enriches them with session and authorization context, forwards them to FREE AI via FreeAIClient, receives normalized results, applies final policy and promotion checks, coordinates persistence, and returns canonical responses.

Trust boundary:
Python is the external trust boundary. FREE AI is an internal trusted service, but only after mutual internal authentication.

Current maturity:
Partial. Strong security posture exists, but bridge authority is incomplete.

Target maturity:
Full production ingress boundary with no duplicate intelligence logic beyond compatibility shims.

Migration implication:
Legacy Python agents must be retired or placed behind an explicit deprecated compatibility shim with a removal schedule.

Operational risk if left unchanged:
Dual-brain divergence, inconsistent outputs, trace fragmentation, repeated bugs, and unclear system ownership.

Concrete implementation responsibilities:
- enforce ingress auth
- enforce rate limiting
- assign request_id and trace context
- invoke FREE AI
- coordinate persistence
- emit telemetry
- enforce final response policy
- own degraded-mode response semantics

3.3 FREE AI Intelligence Engine

Target component or subsystem:
FREE AI Node.js engine

Implementation objective:
Make FREE AI the authoritative reasoning, orchestration, provider governance, retrieval, schema-repair, and intelligence execution core.

Concrete files, modules, services, or layers to create or modify:
- src/api/internalBridgeRouter.js
- src/contracts/requestEnvelope.js
- src/contracts/responseEnvelope.js
- src/orchestration/requestClassifier.js
- src/orchestration/providerPolicyRouter.js
- src/orchestration/complexityRouter.js
- src/providers/healthMatrix.js
- src/providers/providerCooldownManager.js
- src/providers/providerLadderEngine.js
- src/validation/schemaGate.js
- src/validation/domainGate.js
- src/validation/promotionGate.js
- src/repair/repairRouter.js
- src/repair/providerSpecificRepairStrategies.js
- src/retrieval/culinaryEntityResolver.js
- src/retrieval/retrievalFusionEngine.js
- src/memory/memoryCandidateBuilder.js
- src/telemetry/eventPublisher.js
- src/health/bridgeHealthEndpoint.js

Contracts and data structures:
FREE AI accepts the canonical request envelope and returns the canonical response envelope with normalized infer results, validation status, repair actions, and memory write candidates.

Runtime behavior:
FREE AI classifies the request, selects the execution path, chooses providers or local execution strategies, performs retrieval, composes outputs, validates outputs, repairs if needed, evaluates promotion gates, generates memory write candidates, and returns normalized results to Python.

Trust boundary:
Internal trusted execution engine. It does not expose raw provider secrets to clients and must only be reachable through internal service auth.

Current maturity:
Higher than Python-side orchestration, but incomplete as the authoritative production path.

Target maturity:
Single source of truth for intelligence execution.

Migration implication:
FREE AI must absorb orchestration authority. Existing Python-side logic must not remain co-equal.

Operational risk if left unchanged:
Persistent dual-brain architecture and production inconsistency.

Concrete implementation responsibilities:
- request classification
- provider selection
- retrieval orchestration
- schema repair
- validation
- memory candidate generation
- decision event emission
- health reporting

3.4 Provider Abstraction and Governance Layer

Implementation objective:
Centralize provider selection, provider suitability, budget policy, structured output fit, cooldown management, and failover logic.

Concrete modules:
- src/providers/providerCatalog.js
- src/providers/providerCapabilityMap.js
- src/providers/providerHealthMatrix.js
- src/providers/providerBudgetGuardian.js
- src/providers/providerFailoverPolicy.js
- src/providers/providerQuarantineStore.js

Operational risk if left unchanged:
Provider volatility and cost drift continue to cause hidden production instability.

3.5 Validation and Repair Layer

Implementation objective:
Create a non-bypassable post-compose enforcement pipeline that blocks invalid outputs from display or persistence.

Concrete modules:
- src/validation/*
- src/repair/*
- quarantine storage integration in Python persistence layer

Operational risk if left unchanged:
Malformed, unsafe, or semantically incorrect culinary outputs can leak to users or memory.

3.6 Memory and Retrieval Layer

Implementation objective:
Upgrade retrieval from semantic-only support into entity-linked culinary reasoning, and upgrade memory from context arrays into a trust-gated graph.

Concrete modules:
- retrieval resolvers
- entity dictionaries
- graph storage adapters
- memory write APIs
- preference conflict handlers

Operational risk if left unchanged:
Poor personalization, dietary safety gaps, substitution inconsistency, and weak cross-session continuity.

3.7 Evaluation, Evidence, and Decision Graph Layer

Implementation objective:
Persist complete request-level execution traces, promotion events, validation outcomes, fallback behavior, and operator interventions.

Concrete modules:
- decision event schema registry
- async event writer
- dashboard aggregates
- replay query APIs

Operational risk if left unchanged:
Rollback, incident review, regression diagnosis, and auditability remain inadequate.

3.8 Reliability Monitoring Layer

Implementation objective:
Continuously probe provider health and schema conformance, mutate ladder posture safely, and surface degraded states before user impact escalates.

Concrete modules:
- scheduled probe runners
- health state evaluators
- cooldown logic
- alert producers

Operational risk if left unchanged:
Provider outages remain reactive and silent.

3.9 Admin and Observability Layer

Implementation objective:
Give operators controlled visibility into request traces, provider health, memory review, quarantines, rollout safety, and release health.

Concrete modules:
- admin dashboard backend
- aggregated metrics materializer
- search endpoints for traces, memory nodes, and quarantined artifacts

Operational risk if left unchanged:
Production support remains blind and rollback decisions remain guesswork.

3.10 Background Jobs and Probe Runners

Implementation objective:
Isolate non-user-blocking work from hot-path inference.

Concrete modules:
- provider probes
- telemetry materialization
- memory reconciliation jobs
- regression scorecard jobs
- prompt tuning batch jobs

Operational risk if left unchanged:
Latency and reliability degrade due to background contention on the primary request path.

3.11 Persistence and Storage Layer

Implementation objective:
Define durable stores for session context, decision graph events, memory graph, quarantine artifacts, schema registries, and provider health history.

Concrete stores:
- relational or document store for request traces and aggregates
- graph-capable store or graph-emulation schema for memory and decision graph relations
- object store or blob table for quarantined artifacts
- cache store for hot provider health and session state

Operational risk if left unchanged:
Critical runtime artifacts remain fragmented or non-durable.

4. Scorecard Interpretation by Capability Domain

4.1 Architecture — 75%

What is already working:
GS FOOD is modular. UI, Python API, and Node.js intelligence are already conceptually separated.

What deficit prevents a higher score:
The primary production flow still lacks the finalized unified API bridge. Architectural boundaries exist on paper but are not enforced by a single authoritative runtime path.

What engineering work materially raises the score:
Implement FreeAIClient, establish strict canonical contracts, retire Python-side agent orchestration, and enforce Python-as-facade plus FREE-AI-as-core.

Production risk if not improved:
Dual ownership, drift, duplicated bug surfaces, trace fragmentation, and rollout ambiguity.

Donor-grade runtime controls that elevate the domain:
Strict bridge contracts, never-throw boundary semantics, normalized infer-result contracts, health probe endpoints, and non-bypassable enforcement.

Implementation tasks to execute first:
- create FreeAIClient
- define request/response schemas
- replace legacy Python agent calls with bridge invocation
- add bridge health endpoint and contract tests

4.2 Orchestration — 80%

What is already working:
Provider ladders, budget guardians, and explicit routing ideas exist and are strong foundations.

What deficit prevents a higher score:
Routing is not yet fully centralized and authority is still fragmented.

What engineering work materially raises the score:
Move all provider selection and request classification into FREE AI, add adaptive complexity routing, health-aware cooldown logic, and schema-aware model swap rules.

Production risk if not improved:
Inconsistent task handling, inflated costs, and weak degraded-mode behavior.

Implementation tasks:
- centralize provider routing modules
- add policy tables by task class
- add health matrix and cooldown manager

4.3 Security — 85%

What is already working:
Strong FastAPI hardening, JWT isolation, and internal routing restrictions.

What deficit prevents a higher score:
Internal bridge auth, signed service-to-service requests, and stronger persistence trust gates need to be formalized.

What engineering work materially raises the score:
Add mTLS or signed internal tokens, enforce least-privilege internal routes, add admin action audit logging, and implement validation-before-display and validation-before-persist gates.

Production risk if not improved:
Integration changes could weaken the strongest part of the platform.

Implementation tasks:
- internal service auth module
- signed bridge requests
- audit log model
- rate limiting and abuse controls on public endpoints

4.4 Reasoning Quality — 60%

What is already working:
FREE AI already provides stronger orchestration and structured generation capability than Python-side logic.

What deficit prevents a higher score:
Primitive extraction-first repair logic, incomplete memory graph, and insufficient entity-linked retrieval reduce reliability of complex culinary reasoning.

What engineering work materially raises the score:
Introduce the full post-compose validation and repair pipeline, domain gates, structured repair families, and memory-backed personalization.

Production risk if not improved:
Low-confidence meal plans, invalid structured outputs, and inconsistent dietary reasoning.

Implementation tasks:
- schema validator
- domain validator
- repair router
- critic gate
- memory candidate builder

4.5 Retrieval — 65%

What is already working:
Semantic context retrieval exists.

What deficit prevents a higher score:
Entity linking, pantry canonicalization, substitution reasoning, and confidence-weighted fusion are incomplete.

What engineering work materially raises the score:
Implement ingredient and pantry entity resolution, dietary rule retrieval, substitution knowledge modeling, and provenance-aware retrieval summaries.

Production risk if not improved:
Context will remain useful but unreliable for production-grade culinary decisions.

Implementation tasks:
- culinary entity resolver
- pantry canonical dictionary
- retrieval fusion engine
- dietary rules registry

4.6 Reliability — 65%

What is already working:
Ad hoc provider handling exists and some local probes may exist.

What deficit prevents a higher score:
No scheduled provider probes, no structured demotion logic, no cooldown windows, and no restoration criteria.

What engineering work materially raises the score:
Add probe runners, rolling health windows, provider quarantine, model availability checks, schema conformance probes, and alerting.

Production risk if not improved:
Silent provider degradation, throttling failures, and unstable user-facing behavior.

Implementation tasks:
- provider probe scheduler
- health history store
- cooldown manager
- ladder mutation logic

4.7 UX (System/Admin) — 70%

What is already working:
Admin controls likely exist through API endpoints.

What deficit prevents a higher score:
No rich trace UI, no repair analytics, no quarantine viewer, no memory review panel, no rollout health surface.

What engineering work materially raises the score:
Build an operator dashboard with trace search, provider health, repair analytics, decision graph explorer, and quarantine review workflows.

Production risk if not improved:
Support and release management remain slow and error-prone.

Implementation tasks:
- admin dashboard APIs
- aggregate materializer jobs
- trace explorer UI
- quarantine review UI

4.8 Memory — 40%

What is already working:
Memory direction exists conceptually.

What deficit prevents a higher score:
Design-only or partial state. No complete graph, no write tiers, no review workflow, no conflict resolution.

What engineering work materially raises the score:
Build the memory graph, memory write tiers, provenance fields, contradiction logic, and review tooling.

Production risk if not improved:
Weak personalization, repeated user correction, and dietary safety recall failures.

Implementation tasks:
- graph schema
- memory write coordinator
- conflict markers
- review APIs
- tiered write policies

4.9 Performance — 70%

What is already working:
The modular stack can support optimization once paths are consolidated.

What deficit prevents a higher score:
Bridge latency, free-tier throttling, repair-loop amplification, background contention, and persistence overhead are not yet systematically managed.

What engineering work materially raises the score:
Introduce hot-path and cold-path separation, async telemetry, probe isolation, request classification, concurrency controls, and caching.

Production risk if not improved:
Latency creep and unstable throughput during load or provider throttling events.

Implementation tasks:
- queue-based background jobs
- async event writer
- cache layer
- task-class timeout budgets

5. Confirmed Strengths and What They Mean Architecturally

5.1 Modular Separation Between UI, Python API, and Node.js AI Engine

Mechanism:
The system is already split into distinct runtime zones, which is the correct structural pattern for a production platform.

Architectural meaning:
This enables hard boundaries for security, contracts, scaling, and ownership.

Why it matters:
Production stability improves when ingress, intelligence execution, and presentation do not share uncontrolled logic.

How to preserve through migration:
Do not move auth or public ingress into FREE AI. Do not move intelligence execution back into the UI or Python.

Regression risks during integration:
Bridge shortcuts could accidentally embed business logic in Python or client fallback logic in the UI.

Explicit guardrails:
- UI never talks to providers or FREE AI directly
- Python never remains co-equal orchestration brain
- FREE AI never becomes public ingress

Implementation rules:
Add ownership statements in contracts and test them via integration checks.

5.2 Provider Ladders

Mechanism:
Provider ladders establish ordered provider preference and fallback sequencing.

Architectural meaning:
The platform can degrade gracefully rather than fail abruptly when a provider or model becomes unavailable.

Why it matters:
This is essential for free-tier volatility and structured output reliability.

How to preserve:
Provider ladders must be moved into the authoritative FREE AI path and backed by live health state.

Regression risks:
Static ladders without health data will route into degraded providers.

Guardrails:
- health state must influence ladder ordering
- ladder mutations must be observable and auditable

5.3 Budget Guardian Strategies

Mechanism:
Budget guardians constrain cost exposure and likely influence provider choice.

Architectural meaning:
Inference execution remains economically bounded.

Why it matters:
Free-tier and mixed-cost provider environments require execution discipline.

How to preserve:
Budget policy must be embedded in request envelopes and enforced by FREE AI routing modules.

Regression risks:
Bridge migration could bypass budget enforcement if legacy Python logic remains active.

Guardrails:
Budget policy field required in request envelope. FREE AI must emit chosen policy and cost posture in decision trace.

5.4 Explicit Routing Policies

Mechanism:
Task classes likely already influence provider or execution choice.

Architectural meaning:
Different workloads are not treated as equivalent.

Why it matters:
Structured extraction, recipe generation, dietary reasoning, and admin evaluations do not need the same inference posture.

How to preserve:
Encode routing policy tables and task classification modules explicitly.

Regression risks:
Ad hoc routing if policy tables are not centralized.

Guardrails:
All task_class decisions must emit policy_reason events.

5.5 Hardened FastAPI Security Posture

Mechanism:
FastAPI boundary uses bearer auth, JWT claims, and internal route restrictions.

Architectural meaning:
External request validation and authorization are already in the right service.

Why it matters:
Python is the correct ingress owner.

How to preserve:
Do not bypass Python for public requests.

Regression risks:
A direct FREE AI exposure would weaken current posture.

Guardrails:
Reject any implementation that exposes FREE AI directly to clients.

5.6 Internal Routing Restrictions

Mechanism:
Only approved internal paths are reachable across service boundaries.

Architectural meaning:
Lateral movement and accidental public exposure are constrained.

Why it matters:
Bridge security depends on internal-only surfaces.

Guardrails:
Define allowed service paths and forbidden service paths in routing policy.

5.7 Evidence Receipt Generation

Mechanism:
Receipts capture some execution metadata.

Architectural meaning:
The platform already values traceability.

Why it matters:
Decision graphs can be built on top of this discipline rather than from scratch.

Guardrails:
Do not replace receipts with logs-only visibility. Expand them into structured decision events and persisted graphs.

6. Critical Gaps and Root Causes

6.1 Integration Disconnect

Current symptom:
Python server still acts as a legacy agent hub and has not formally adopted FREE AI through a unified bridge.

Likely root cause:
Bridge contract and FreeAIClient are missing or incomplete. Legacy logic remains in place for historical continuity.

Affected modules:
server/app/main.py, legacy Python agent modules, absent or incomplete bridge client, existing Python route handlers.

User-visible consequence:
Inconsistent output behavior and unstable feature quality.

Operator-visible consequence:
Difficult root-cause attribution and uncertain execution ownership.

Data quality risk:
Different reasoning paths may produce conflicting structured outputs.

Trust risk:
Users receive variable behavior without transparent explanation.

Performance impact:
Duplicate retries and unnecessary routing layers increase latency.

Production risk:
Architectural drift and high operational complexity.

Remediation path:
Implement bridge authority, deprecate legacy Python reasoning logic, formalize canonical request/response envelopes, and enforce single-brain execution.

Concrete implementation actions:
- build FreeAIClient
- route all intelligence endpoints through it
- mark legacy Python agents deprecated
- create compatibility shims only where temporary continuity is needed
- add integration tests to prove Python delegates to FREE AI

6.2 Fragile Memory State

Current symptom:
Memory graph remains incomplete or design-only.

Root cause:
Persistent entity model, write policies, and review tooling were never completed.

Affected modules:
memory layer, preference handling, dietary recall logic, session-to-session personalization paths.

User-visible consequence:
Repeated preferences must be re-explained. Long-term personalization is weak.

Operator-visible consequence:
No memory audit or correction workflow.

Data quality risk:
Incorrect inferred preferences may be applied or forgotten inconsistently.

Trust risk:
Users perceive the system as unreliable or unsafe around dietary preferences.

Performance impact:
Repeated context gathering inflates prompt size and latency.

Production risk:
Unsafe recalls for restrictions or allergies if memory remains ad hoc.

Remediation:
Build graph-backed memory with tiered write policies and trust gating.

6.3 Reliability Blindspots

Current symptom:
No scheduled provider probes and no dynamic health mutation.

Root cause:
Reliability logic remains reactive and tied to request-time failures.

Affected modules:
provider governance, routing, operations, alerting.

User-visible consequence:
Unexpected provider failures and degraded experience.

Operator-visible consequence:
No early warning or controlled demotion.

Data quality risk:
Provider schema drift may silently poison outputs.

Trust risk:
System appears unstable or arbitrary.

Performance impact:
Repeated failed attempts on degraded providers.

Production risk:
High during free-tier throttling or provider change events.

Remediation:
Scheduled probes, rolling windows, cooldowns, restoration criteria, and dashboard surfacing.

6.4 Primitive Error Repair

Current symptom:
Simple extraction-first fallbacks dominate.

Root cause:
Missing repair family architecture and missing non-bypassable quality gates.

Affected modules:
structured output parsing, provider retries, downstream persistence.

User-visible consequence:
Malformed or semantically weak structured outputs.

Operator-visible consequence:
No clear repair telemetry.

Data quality risk:
Invalid structured outputs may persist or display.

Trust risk:
Users lose confidence in meal planning or pantry reasoning accuracy.

Performance impact:
Retry storms and token waste.

Production risk:
Unsafe promotion of malformed content.

Remediation:
Build parser, schema gate, type gate, domain gate, repair router, critic gate, and promotion gate.

6.5 Observability Deficits

Current symptom:
Evidence receipts exist but decision graph correlation is partial and admin surface is weak.

Root cause:
No durable event taxonomy, no aggregate materialization, no dashboard-first operations design.

Affected modules:
telemetry, support workflows, release monitoring.

User-visible consequence:
Delayed incident resolution.

Operator-visible consequence:
Blind support and weak root-cause inspection.

Data quality risk:
Hidden failure patterns go unnoticed.

Trust risk:
Operational unpredictability persists.

Performance impact:
Longer mean time to detection and longer mean time to recovery.

Production risk:
Unsafe releases and slower rollback decisions.

Remediation:
Add event taxonomy, async event ingestion, decision graph store, admin APIs, and operator dashboard.

6.6 Duplicated Orchestration Logic Across Python and Node

Remediation:
Deprecate Python-side intelligence routing except for compatibility shims and policy gating.

6.7 Partial Decision Provenance

Remediation:
Persist every routing, validation, repair, fallback, memory, and promotion event with correlation IDs.

6.8 Weak Cross-Session Personalization

Remediation:
Graph memory with evidence-backed preference evolution.

6.9 Provider Health Drift Over Time

Remediation:
Probe runners plus provider cooldown manager.

6.10 Schema Retry Waste

Remediation:
Repair attempt budgets and model-swap thresholds.

6.11 Fragmented Admin Surface Area

Remediation:
Unified operator control plane with role-restricted actions.

6.12 Incomplete Trust Gating Before Persistence

Remediation:
Promotion gates must explicitly approve memory writes and response display separately.

6.13 Insufficient Rollout Safety Signals

Remediation:
Release health view, regression scorecards, and progressive bridge rollout flags.

7. Python-to-FREE-AI Bridge Architecture

7.1 Implementation Objective

The FreeAIClient in server/app/main.py must be implemented immediately and must become the authoritative mechanism by which Python delegates intelligence execution to FREE AI. Python remains the stable API facade, auth boundary, security boundary, policy gateway, persistence coordinator, and external service surface. FREE AI becomes the primary reasoning, orchestration, provider-governance, schema-repair, and intelligence execution core. Legacy standalone Python agents are to be reduced to compatibility shims or removed.

7.2 Modules to Create or Modify

Python side:
- server/app/main.py
- server/app/routes/intelligence.py
- server/app/clients/free_ai_client.py
- server/app/contracts/request_envelope.py
- server/app/contracts/response_envelope.py
- server/app/contracts/internal_bridge_errors.py
- server/app/security/internal_service_auth.py
- server/app/policies/bridge_policy.py
- server/app/telemetry/event_emitter.py
- server/app/health/free_ai_bridge_health.py
- server/app/compat/legacy_agent_shim.py
- server/app/tests/test_free_ai_bridge_contract.py
- server/app/tests/test_bridge_degraded_mode.py
- server/app/tests/test_legacy_agent_retirement_paths.py

FREE AI side:
- src/api/internalBridgeRouter.js
- src/contracts/requestEnvelope.js
- src/contracts/responseEnvelope.js
- src/health/internalHealthRoute.js
- src/telemetry/bridgeEvents.js
- src/tests/bridgeContract.test.js

7.3 Unified Request Contract

Canonical request envelope:
{
  "request_id": "uuid",
  "session_id": "string",
  "user_id": "string|null",
  "anonymous_id": "string|null",
  "task_type": "pantry_match|recipe_generation|meal_plan|dietary_reasoning|substitution_reasoning|structured_extraction|admin_evaluation",
  "task_intent": "string",
  "user_input": "string",
  "pantry_context": {
    "items": [],
    "freshness": {},
    "source": "user|memory|system"
  },
  "dietary_context": {
    "restrictions": [],
    "allergies": [],
    "preferences": [],
    "confidence": {}
  },
  "retrieval_context": {
    "enabled": true,
    "sources": [],
    "top_k": 0,
    "filters": {}
  },
  "memory_context": {
    "session_memory_refs": [],
    "durable_memory_refs": [],
    "write_policy_tier": "tier1|tier2|tier3"
  },
  "budget_policy": {
    "max_cost_tier": "free|low|standard",
    "latency_class": "fast|balanced|deep",
    "repair_budget": 0
  },
  "response_schema_id": "string",
  "trace_flags": {
    "emit_detailed_trace": true,
    "preview_allowed": false,
    "admin_request": false
  },
  "timeout_ms": 0
}

Canonical response envelope:
{
  "request_id": "uuid",
  "engine_run_id": "uuid",
  "selected_provider": "string|null",
  "selected_model": "string|null",
  "output_payload": {},
  "structured_result": {},
  "validation_status": {
    "schema_valid": false,
    "domain_valid": false,
    "promotion_status": "approved|preview_only|blocked"
  },
  "repair_actions": [],
  "citations_or_evidence": [],
  "memory_write_candidates": [],
  "decision_trace_ref": "string",
  "latency_ms": 0,
  "status": "success|degraded|blocked|timeout|bridge_error|provider_unavailable"
}

7.4 Bridge Responsibilities That Remain in Python

Python must own:
- external authentication and authorization
- request rate limiting
- tenant and user identity resolution
- API request validation at ingress
- correlation ID generation if absent
- bridge invocation
- final response normalization verification
- durable persistence coordination
- admin authorization checks
- degraded-mode and fallback HTTP semantics
- audit trail emission for external actions

Python must not remain responsible for:
- provider routing
- structured output repair strategy
- reasoning orchestration
- primary retrieval orchestration
- intelligence response composition

7.5 Responsibilities That Move to FREE AI

FREE AI must own:
- request classification
- provider selection
- provider ladder execution
- health-aware fallback logic
- adaptive complexity routing
- retrieval orchestration
- output composition
- schema repair routing
- critic-node-style pre-display validation
- memory write candidate generation
- decision event emission for internal execution steps

7.6 Invocation Pattern

Synchronous path:
Used for user-facing pantry matching, recipe generation, meal planning, and dietary reasoning requests. Python calls FREE AI and awaits a normalized response within task-class timeout budgets.

Asynchronous path:
Used for admin evaluations, regression runs, heavy recomputation tasks, and possibly long-running plan generation or bulk profiling jobs. Python returns accepted/queued status and the job executes through a background queue.

7.7 Timeout Policy

Gateway-side timeout enforcement is mandatory.
Recommended timeout classes:
- pantry_match fast path: 1500–3000 ms target budget, hard timeout 5000 ms
- recipe_generation balanced path: 4000–8000 ms target budget, hard timeout 12000 ms
- meal_plan deep path: 8000–15000 ms target budget, hard timeout 20000 ms
- admin_evaluation async preferred, synchronous fallback hard timeout 30000 ms

Python must enforce client-facing timeout ceilings. FREE AI may have shorter internal provider sub-timeouts per attempt to preserve repair budget.

7.8 Retry Policy

FreeAIClient must never blindly retry the full request without classifying error type. Allowed retry categories:
- transient network failure to FREE AI internal endpoint: one retry with jitter if idempotent
- provider-unavailable result returned by FREE AI: no Python-level blind retry; FREE AI should have already executed fallback
- malformed internal bridge response: zero automatic retries; respond degraded and emit alert
- timeout from FREE AI: no repeated retries for hot path; return degraded or timeout status

7.9 Error Classes

Python internal bridge errors:
- BridgeConnectionError
- BridgeTimeoutError
- BridgeAuthError
- BridgeContractError
- BridgeDegradedModeError

FREE AI execution errors normalized into response status:
- provider_unavailable
- schema_validation_failed
- domain_validation_failed
- repair_budget_exhausted
- blocked_by_policy
- degraded_mode_served

Never-throw bridge semantics at the client boundary:
FreeAIClient must normalize internal failures into controlled return types wherever possible. Python endpoints must not leak raw stack traces or provider internals.

7.10 Internal Authentication and Secret Isolation

Python-to-FREE-AI communication must use service-to-service authentication with one of:
- mTLS between internal services
- signed short-lived internal JWTs with audience restriction
- HMAC request signing with timestamp validation if internal environment is simpler

Required controls:
- FREE AI endpoint internal-only
- provider secrets stored server-side only
- FREE AI never returns raw provider credentials or secret-bearing payloads
- Python never exposes FREE AI topology externally

7.11 Correlation IDs and Idempotency

Every request must carry:
- request_id
- session_id
- engine_run_id once FREE AI accepts execution

Idempotency considerations:
Python should add an idempotency key for retry-safe operations where duplicate external submissions are plausible, especially admin evaluations and persistent write flows.

7.12 Response Normalization Across FREE AI Variants

The bridge must normalize response extraction regardless of FREE AI internal response variant. If FREE AI returns different internal shapes by provider family or internal execution path, src/api/internalBridgeRouter.js must normalize these to the canonical response envelope before returning to Python.

7.13 Health Probe Endpoint Design

FREE AI must expose an internal health endpoint that reports:
- process_up
- bridge_contract_version
- provider_health_summary
- readiness_state
- degraded_mode_state
- queue_depth if async execution exists

Python must consume this for readiness checks and operational dashboarding.

7.14 Degraded-Mode Behavior

If FREE AI is unavailable:
- Python does not reactivate full legacy Python intelligence logic as a co-equal path
- Python returns controlled degraded responses for user-facing tasks
- only explicitly approved minimal compatibility fallbacks may execute, and only for narrow low-risk task classes
- degraded responses must emit decision events and operator alerts

7.15 Modules to Deprecate on Python Side

Deprecate or reduce:
- legacy standalone Python agent orchestration modules
- duplicated provider selection logic in Python
- duplicated schema repair logic in Python
- duplicated retrieval orchestration if present
- duplicated prompt family selection logic

Retain only:
- compatibility shims where immediate removal is too risky
- policy-adjacent preprocessing
- persistence coordination
- ingress validation and auth

7.16 Contract Versioning Strategy

Both request and response contracts must include an internal version field in implementation, even if omitted in simplified examples. Version negotiation is internal and fail-closed. Python and FREE AI must reject unsupported versions clearly.

7.17 Acceptance Tests for Bridge Completion

Required tests:
- Python delegates all intelligence endpoints to FreeAIClient
- FREE AI returns canonical response envelope
- malformed FREE AI responses are blocked and alerted
- bridge degraded mode produces controlled client responses
- correlation IDs propagate end-to-end
- legacy Python agent paths are unreachable except approved compatibility routes
- provider secrets are never exposed in responses
- request contract validation rejects malformed task_type, budget_policy, and trace_flags

8. Orchestration and Provider Governance Design

8.1 Implementation Objective

All provider routing, laddering, fallback, budget control, and execution-path selection must be centralized in FREE AI. Python must not make provider selection decisions beyond ingress policy constraints.

8.2 Modules to Create or Refactor

- src/orchestration/requestClassifier.js
- src/orchestration/taskPolicyTable.js
- src/orchestration/complexityRouter.js
- src/providers/providerCatalog.js
- src/providers/providerCapabilityMap.js
- src/providers/providerLadderEngine.js
- src/providers/providerHealthMatrix.js
- src/providers/providerCooldownManager.js
- src/providers/providerBudgetGuardian.js
- src/providers/providerFailoverPolicy.js
- src/providers/providerSuitabilityScorer.js
- src/providers/providerQuarantineStore.js

8.3 Request Classification

Task classes:
- pantry matching
- recipe generation
- meal planning
- dietary reasoning
- substitution reasoning
- structured extraction
- operator/admin actions
- background evaluation tasks

Classification factors:
- expected output schema rigidity
- token complexity
- need for retrieval
- need for domain validation strictness
- latency budget
- budget policy
- provider health posture

8.4 Provider Decision Factors

Provider selection must consider:
- structured output reliability
- current health score
- recent schema conformance rate
- recent timeout rate
- cooldown status
- cost tier compatibility
- task class suitability
- latency requirements
- repair budget remaining
- historical quality score by task class

8.5 Silent Fallback Routing

FREE-AI-inspired silent fallback routing is mandatory. If the preferred provider fails before user-visible promotion, FREE AI must automatically move down the ladder according to policy and health state. The user must not receive raw provider failure details unless the result degrades below promotion thresholds.

8.6 Adaptive Complexity Routing

FREE AI must implement adaptive complexity routing.
- Simple pantry lookup: low-cost fast model, minimal repair budget, strict timeouts
- Recipe generation: balanced model with structured generation fit
- Meal planning: deeper reasoning class, retrieval enabled, larger repair budget
- Dietary reasoning: high domain validation strictness, provider must meet safety and schema reliability thresholds
- Structured extraction: provider selected primarily for strict schema conformance
- Admin/evaluation tasks: may use more expensive or deeper evaluation-capable path asynchronously

8.7 Health Matrix and Cooldown Logic

ProviderHealthMatrix fields:
- provider_id
- model_id
- health_score
- schema_success_rate_rolling
- timeout_rate_rolling
- avg_latency_rolling
- quota_error_rate_rolling
- cooldown_until
- quarantine_state
- last_probe_at
- last_success_at

Cooldown rules:
- repeated transient failures beyond threshold enter cooldown window
- schema failure spikes trigger model demotion
- quota exhaustion triggers short-term demotion and alternate provider promotion
- repeated failures across a provider family trigger broader provider quarantine if configured

Restoration rules:
- provider exits cooldown only after successful scheduled probes or observed recovery in controlled traffic
- restoration must be gradual and traceable

8.8 Deterministic Fallback Path

When all preferred providers degrade, FREE AI must follow a deterministic fallback path by task class. This path must be codified, not improvised. For example:
- structured extraction may prefer reduced-scope output over unstructured output
- recipe generation may return validated degraded suggestions with warning status
- meal planning may return preview-only or partial plan if promotion gates are not met

8.9 Schema-Failure-Aware Model Swap Triggers

If a provider exceeds schema failure thresholds for a given response_schema_id over a rolling window, that provider-model pair must be demoted for that schema class. This directly adapts the missing FREE AI pattern into GS FOOD.

8.10 Policy Tables

Implementation must include policy tables mapping:
task_type -> provider class preference -> health threshold -> schema strictness -> repair budget -> timeout class -> fallback mode -> memory write allowance

8.11 Operator Override Boundaries

Operators may:
- manually quarantine a provider-model pair
- override ladder order temporarily
- disable a task class for a provider
- force evaluation traffic only to a provider in staging

Operators may not:
- bypass promotion gates for user-facing production responses without audit
- disable all validation
- route public requests directly to raw provider outputs

8.12 Acceptance Criteria

- all provider choices are emitted as decision events
- ladder mutation is visible in dashboard
- cooldown timers are enforced
- restoration requires probe-confirmed health
- request class policy tables are complete for all GS FOOD task types

9. Structured Output, Validation, and Schema Repair Architecture

9.1 Implementation Objective

Replace primitive extraction-first repair logic with a non-bypassable structured validation and repair pipeline that blocks invalid outputs from display or persistence.

9.2 Mandatory Output Flow

draft output -> parser -> validator -> domain checker -> repair router -> critic -> final promotion

This flow must be implemented exactly as a pipeline. No display and no persistence may occur before final promotion.

9.3 Modules to Create or Refactor

- src/validation/parser.js
- src/validation/schemaValidator.js
- src/validation/typeValidator.js
- src/validation/domainValidator.js
- src/validation/validationResultNormalizer.js
- src/repair/repairRouter.js
- src/repair/providerSpecificRepairStrategies.js
- src/repair/repairBudgetManager.js
- src/validation/criticGate.js
- src/validation/promotionGate.js
- src/quarantine/outputQuarantineWriter.js
- src/quarantine/quarantineStateMachine.js
- server/app/persistence/quarantine_store.py

9.4 Parser Stage

Purpose:
Extract structured output according to the declared response_schema_id.

Responsibilities:
- parse provider response
- normalize common wrapper variants
- detect malformed JSON or partial structure
- attach parse diagnostics

Failure handling:
Parse failure enters repair router immediately if budget remains.

9.5 Schema Validator

Purpose:
Validate required fields, field presence, enum values, nested structure, and contract alignment.

Failure classes:
- missing_required_field
- invalid_enum
- unexpected_structure
- array_shape_error

9.6 Type Validator

Purpose:
Validate primitive and composite types, numeric ranges where defined, and field coercion rules if safe.

Failure classes:
- type_mismatch
- numeric_out_of_range
- invalid_nullable_usage

9.7 Domain Validator

Purpose:
Validate culinary correctness and policy compliance.

Mandatory culinary domain rules:
- allergy conflicts
- dietary conflicts
- pantry availability confidence
- substitution plausibility
- unit/quantity sanity
- meal-plan coherence
- unsupported health claims prohibition

Examples:
A recipe recommendation cannot violate known allergy data without being blocked.
A meal plan cannot simultaneously claim vegan compliance while containing non-vegan ingredients.
A substitution must be plausible in culinary use, not merely semantically related.
Units and quantities must remain sane within recipe context.
Health claims not supported by approved knowledge sources must be blocked.

9.8 Repair Router

Purpose:
Select the correct repair family based on failure class, provider, model, schema, and task type.

Repair families:
- parse recovery
- schema field completion
- type correction
- domain correction
- provider switch repair
- constrained regeneration

Repair triggers:
- parse failure
- schema failure
- type failure
- domain failure
- critic failure
- provider trust or health downgrade during execution

9.9 Provider-Specific Repair Prompts

Provider-specific repair prompts must exist because schema drift and output failure patterns vary by provider family. These prompts are internal execution assets and must remain compiled and versioned.

Strict compiled prompt structure for intelligence execution is required:
- system invariants
- schema-specific constraints
- domain constraints
- prohibited behaviors
- repair objective
- prior failure diagnostics

9.10 Repair Attempt Budgets and Circuit Breakers

Each request carries repair_budget from budget_policy.
Repair attempts must be bounded.
Circuit breaker triggers:
- parse failure repeated beyond threshold
- domain failure repeated beyond threshold
- total repair latency exceeds class budget
- provider-model schema instability threshold exceeded

When circuit breaks:
- attempt provider-model swap if policy allows
- if no trusted path remains, quarantine and return blocked or preview-only based on task class

9.11 Critic-Node-Style Pre-Display Validation

A critic gate must review outputs after repair but before promotion. This gate evaluates:
- domain risk
- unsupported claims
- obvious internal contradictions
- missing evidence in required evidence-bearing task classes
- memory write safety posture

9.12 Quality Gates

Gate 1: schema validity
The output must match the declared response_schema_id.

Gate 2: domain validity
The output must satisfy culinary and dietary rules.

Gate 3: provider trust and health acceptance
The final output may not be promoted if produced under disallowed degraded provider conditions.

Gate 4: repair budget acceptance
The output may not be promoted if repair exceeded allowed budget or circuit-break threshold.

Gate 5: memory write safety
Memory write candidates must pass trust-tier gating independently of response display.

Gate 6: response display approval
The output must pass critic review and overall promotion policy.

Gate 7: evidence and trace completeness
Required decision events and supporting diagnostics must exist before promotion.

9.13 Dispatch-Allowed Gating Semantics

Adapted donor pattern:
The final validation object must include dispatch_allowed semantics for:
- display_allowed
- persistence_allowed
- memory_write_allowed

These are independent. A response may be display_allowed but memory_write_allowed=false. A quarantined artifact is always persistence_allowed to quarantine storage but not display_allowed to end users.

9.14 Preview-Mode Logic

Preview-only is allowed only for explicitly permitted task classes and privileged surfaces. It is intended for operator/admin review or degraded user-safe fallback in narrow cases. Preview mode must be visibly marked and must not auto-write memory.

9.15 Quarantine Storage Behavior

Invalid outputs and blocked memory writes must be written to quarantine with:
- request_id
- engine_run_id
- provider
- model
- failure_class
- validation diagnostics
- repair history
- trace reference
- created_at
- state

States:
- quarantined
- under_review
- rescued
- replayed
- discarded

9.16 Acceptance Tests

- malformed provider output is blocked from display
- schema-valid but domain-invalid output is blocked
- repair attempts stop at configured budget
- provider switch occurs after repeated schema failure where policy allows
- quarantine records contain diagnostics and trace refs
- display and memory-write approvals are independently enforced

10. Memory Graph and Long-Term Context Architecture

10.1 Implementation Objective

Replace simple context arrays with a production memory graph that models users, households, pantry state, preferences, dietary constraints, substitutions, and meal history with evidence-backed, trust-gated writes.

10.2 Graph Node Types

Required nodes:
- User
- Household
- PantryItem
- IngredientPreference
- DietaryRestriction
- Allergy
- DislikedIngredient
- CuisinePreference
- MealHistory
- PlanHistory
- SubstitutionPattern
- SessionMemoryFragment
- EvidenceReference

10.3 Edge Types

Required edges:
- belongs_to_household
- has_in_pantry
- prefers
- avoids
- allergic_to
- cooked_recently
- follows_diet
- substitutes_with
- derived_from_evidence
- confirmed_by_user
- inferred_from_repetition

10.4 Mandatory Memory Write Tiers

Tier 1: ephemeral low-trust session memory
Used for temporary conversational context, short-term pantry mentions, and recent task-local details. Auto-write allowed. Expires automatically. Not treated as durable truth.

Tier 2: durable inferred preference memory with evidence threshold
Used for repeated preferences or repeated pantry patterns with evidence across sessions or repeated confirmations by behavior. Requires confidence threshold, provenance, and contradiction checks. Auto-write allowed only if evidence threshold is met.

Tier 3: user-confirmed persistent identity memory
Used for allergies, hard dietary restrictions, household anchors, and identity-level preferences that materially affect safety or system behavior. Requires explicit user confirmation or trusted migration import. Never auto-written from a single speculative inference.

10.5 What Can Be Auto-Written

Allowed Tier 1 examples:
- recent pantry items mentioned in the session
- recent cuisine interest for the current conversation
- temporary meal plan intent

Allowed Tier 2 examples:
- repeated preference for certain cuisine after multiple validated sessions
- repeated dislike of a specific ingredient inferred from corrections or consistent avoidance

10.6 What Needs Stronger Evidence

Requires repeated evidence:
- inferred dietary preference
- recurring household pantry patterns
- stable substitution preference

10.7 What Requires Explicit Confirmation

Requires Tier 3 confirmation:
- allergies
- medical-style dietary restrictions
- household composition
- long-term protected preference that affects exclusion rules

10.8 What Must Never Be Auto-Written

Never auto-write:
- health conditions not explicitly confirmed
- allergy status from weak inference
- strict religious or ethical diet commitment without confirmation
- any unsupported health claim about user needs

10.9 Provenance Fields

Every durable memory write must store:
- memory_id
- node_type
- edge_type if applicable
- source_request_id
- source_engine_run_id
- evidence_refs
- confidence_score
- recency_score
- created_at
- updated_at
- write_tier
- write_reason
- confirmed_by_user boolean
- conflict_state

10.10 Conflict Resolution

Memory contradiction detection must compare new candidate facts against existing durable facts. Conflicts create a conflict marker rather than silent overwrite. Conflict states:
- none
- mild_conflict
- hard_conflict
- user_confirmation_required

10.11 False Memory Prevention

Truth-gated memory persistence is mandatory.
No memory candidate becomes durable unless:
- its write tier allows it
- evidence threshold is satisfied
- contradiction checks pass or move it into review
- promotion gate approves memory_write_allowed

10.12 User Correction Workflows

Users must be able to:
- correct pantry state
- remove wrongly inferred preferences
- confirm or deny proposed durable preferences
- update allergies or restrictions intentionally

10.13 Admin Review Workflows

Operators must be able to:
- inspect memory lineage
- review blocked or conflicting memory candidates
- rescue false positives with audit trail
- trigger replay after correction

10.14 Storage Model

Preferred model:
- graph-capable database or graph-emulation schema using relational tables:
  nodes, edges, evidence_refs, memory_conflicts, memory_reviews

Required write APIs:
- write_session_memory
- propose_durable_memory
- confirm_identity_memory
- resolve_memory_conflict
- retire_memory_entry

10.15 Why the Current Design-Only State Caps Reasoning Quality

Without durable memory graphing, GS FOOD cannot safely and consistently recall pantry context, preferences, exclusions, or cross-session patterns. This forces repeated prompt stuffing, increases latency, weakens personalization, and reduces safety confidence for dietary outputs.

11. Decision Graph, Traceability, and Evaluation Receipts

11.1 Implementation Objective

Expand partial evidence receipts into a durable decision graph that captures the full execution lineage of each request.

11.2 Why Receipts Alone Are Insufficient

Receipts summarize. They do not fully encode branching, retries, provider switches, repair sequences, validation failures, memory write candidates, operator overrides, or fallback causality. Production operations require full execution lineage, not just endpoint summaries.

11.3 Event Types to Persist

Mandatory structured event types:
- request_received
- ingress_validated
- free_ai_call_started
- free_ai_call_completed
- retrieval_started
- retrieval_completed
- provider_selected
- provider_failed
- provider_cooldown_applied
- fallback_triggered
- draft_output_generated
- parse_failed
- schema_validation_failed
- type_validation_failed
- domain_validation_failed
- repair_started
- repair_completed
- critic_blocked
- promotion_approved
- promotion_blocked
- memory_read
- memory_write_candidate
- memory_write_blocked
- memory_write_committed
- quarantine_written
- operator_override
- response_returned

11.4 Minimum Event Schema

Each event must contain:
- event_id
- event_type
- request_id
- session_id
- engine_run_id
- parent_event_id nullable
- timestamp
- actor_type system|operator
- component_name
- task_type
- provider_id nullable
- model_id nullable
- payload_summary
- decision_reason
- severity
- trace_tags

11.5 Storage Strategy

Use async ingestion with non-blocking writes.
Stores:
- hot event store for recent