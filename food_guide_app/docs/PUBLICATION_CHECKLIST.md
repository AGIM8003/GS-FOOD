# Publication checklist (science / tech report)

Aligned with the SOTA execution plan: reproducible evaluation, licensing, and ablations.

## Problem framing

- Cite robust in-environment food recognition literature for motivation (e.g. cluttered refrigerator scenes).
- State privacy-first and offline-first constraints explicitly.

## Contributions to claim

1. Tiered on-device stack (T1–T3) plus signed knowledge packs.
2. Deterministic rule layer for safety-adjacent UX (non-medical disclaimers).
3. Empirical comparison on a **frozen golden set**: rules-only vs +vision (T2) vs +cloud assist.

## Data and licenses

| Source | License / notes |
|--------|------------------|
| Open Food Facts API / dumps | ODbL / DbCL — attribute and respect rate limits |
| Hugging Face datasets (e.g. Open Food Facts ingredient tasks) | Per dataset card |
| Bundled `default_pack.json` | Your copyright / CC as you choose |

## Reproducibility

- Pin **model file hashes** (TFLite / SLM bundles) and **pack version** in the paper appendix.
- Version **app** (`pubspec.yaml`) and **API** (`server/app/main.py`) together in evaluation tables.
- Store golden scenarios under `test/fixtures/golden_scenarios.json` and extend with labeled expected outputs.

## Ablations

- On-device OCR + rules only.
- + Open Food Facts normalization.
- + optional TFLite coarse classifier when `assets/models/food_coarse.tflite` is present.
- + Cook API template vs future HF-backed server path (document `source` field in API JSON).

## Ethics

- No retention of user camera frames by default; describe what leaves the device when cloud toggles are on.

## Device matrix and performance budgets

Record these on a small matrix (e.g. low / mid / flagship) for the publication appendix:

| Metric | Target (debug logging) | Notes |
|--------|------------------------|-------|
| Cold start to first interactive frame | Baseline + regression budget | `flutter run --profile` |
| Barcode → first AnswerCard (cached pack) | p95 < 800 ms mid-tier | No network |
| ML Kit OCR (still image) | p95 < 1200 ms | Curved labels via Document Scanner path |
| TFLite coarse (when present) | p95 < 200 ms / frame budget | `FoodClassifierIsolate` timing helper |
| Pack download + verify + activate | Success %, rollback count | `PackUpdateService` logs |
| Thermal throttle flag | Yes/No during 5 min scan session | OS power dialog |

Include OS version, device model, and whether ROI (segmenter) and background pack sync were enabled.
