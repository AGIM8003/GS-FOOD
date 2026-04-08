"""
Minimal OFF JSONL → slim pack slice for Food Guide (uplift U4).
Expects JSONL with at least: code, product_name, ingredients_text, allergens_tags (or similar).
Adjust field names to match your export schema.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path

try:
    import duckdb
except ImportError as e:  # pragma: no cover
    raise SystemExit("Install duckdb: pip install -r requirements-pack.txt") from e


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Path to OFF JSONL export")
    p.add_argument("--region", default="default")
    p.add_argument("--output-dir", required=True)
    p.add_argument("--limit", type=int, default=5000, help="Max rows for demo slice")
    args = p.parse_args()

    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    data_path = out / "ontology_products.jsonl"

    con = duckdb.connect(":memory:")
    con.execute(
        """
        CREATE TABLE raw AS
        SELECT * FROM read_ndjson(?, auto_detect=true, maximum_object_size=33554432);
        """,
        [args.input],
    )
    cols = [c[0] for c in con.execute("DESCRIBE raw").fetchall()]
    # Flexible projection — common OFF export column names
    name_col = next((c for c in ("product_name", "product_name_en") if c in cols), None)
    code_col = "code" if "code" in cols else None
    ing_col = next((c for c in ("ingredients_text", "ingredients_text_en") if c in cols), None)
    if not code_col:
        raise SystemExit("Input must include a product code column (e.g. code)")

    select_parts = [f'"{code_col}" AS barcode']
    if name_col:
        select_parts.append(f'"{name_col}" AS product_name')
    if ing_col:
        select_parts.append(f'"{ing_col}" AS ingredients_text')
    query = f"SELECT {', '.join(select_parts)} FROM raw LIMIT {int(args.limit)}"
    cur = con.execute(query)
    rows = cur.fetchall()
    col_names = [d[0] for d in cur.description or []]

    with data_path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(dict(zip(col_names, row)), ensure_ascii=False) + "\n")

    pack_meta = {
        "schema_version": 1,
        "region": args.region,
        "source": "openfoodfacts_jsonl_slice",
        "row_count": len(rows),
        "disclaimer": "Derived from Open Food Facts (ODbL). Verify on product packaging.",
    }
    meta_path = out / "pack_meta.json"
    meta_path.write_text(json.dumps(pack_meta, indent=2), encoding="utf-8")

    files = {
        "ontology_products.jsonl": sha256_file(data_path),
        "pack_meta.json": sha256_file(meta_path),
    }
    manifest = {
        "version": "slice-1.0.0",
        "region": args.region,
        "files": files,
        "signature_b64": "",
        "note": "Sign canonical payload (version, region, files) with Ed25519; set signature_b64.",
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote slice to {out} — sign manifest before publishing.")


if __name__ == "__main__":
    main()
