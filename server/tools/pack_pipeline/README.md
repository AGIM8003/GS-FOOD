# Knowledge pack pipeline (uplift U4)

Offline build path: **Open Food Facts** bulk or delta JSONL → **DuckDB** → regional JSON slice → sign with your Ed25519 key → host on HTTPS for [`PackUpdateService`](../../../food_guide_app/lib/data/pack/pack_update_service.dart).

## Steps

1. Download a daily JSONL export or delta from [Open Food Facts data](https://world.openfoodfacts.org/data) (respect ODbL / usage policy).
2. `pip install -r requirements-pack.txt`
3. `python build_slice.py --input products.jsonl --region default --output-dir ./out_slice`
4. Sign `out_slice/manifest.json` (include `files` sha256 map + `signature_b64`) with the private key matching `assets/config/pack_trusted_public_key.b64` in the app.
5. Upload `out_slice/` contents to your CDN; set **Pack CDN base URL** in app Settings.

## Optional enrichment

- **Robotoff** or server-side **HF** NER on ingredient text can run in CI and write derived fields into the slice JSON before signing—keep heavy models off the mobile hot path.
