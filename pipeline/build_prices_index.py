"""Parse the most recent downloaded archive and produce a compact JSON
catalog per supermarket chain, for the meal-planner web app to consume.

Reads from pipeline/archives/<date>/ (populated by downloader.py).
Writes to data/prices/ at the repo root.

Usage:
    python build_prices_index.py                 # latest dated folder
    python build_prices_index.py --date 2026-04-19
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ARCHIVE_ROOT = SCRIPT_DIR / "archives"
OUTPUT_DIR = SCRIPT_DIR.parent / "data" / "prices"
DATE_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

SCHEMA_VERSION = 1
FIELDS = ["id", "ean", "name", "brand", "category", "unit", "quantity", "minPrice"]

DISPLAY_NAME_OVERRIDES = {
    "dm": "dm",
    "ktc": "KTC",
    "ntl": "NTL",
    "djelo_vodice": "Djelo Vodice",
    "jadranka_trgovina": "Jadranka Trgovina",
    "trgovina-krk": "Trgovina Krk",
}


def pick_archive(args_date: str | None) -> Path:
    if args_date:
        d = ARCHIVE_ROOT / args_date
        if not d.is_dir():
            sys.exit(f"Archive folder not found: {d}")
        return d
    if not ARCHIVE_ROOT.is_dir():
        sys.exit(f"No archive root: {ARCHIVE_ROOT} (run downloader.py first)")
    dated = sorted(
        (p for p in ARCHIVE_ROOT.iterdir() if p.is_dir() and DATE_DIR_RE.match(p.name)),
        key=lambda p: p.name,
    )
    if not dated:
        sys.exit(f"No dated archive folders under {ARCHIVE_ROOT}")
    return dated[-1]


def display_name(chain_code: str) -> str:
    if chain_code in DISPLAY_NAME_OVERRIDES:
        return DISPLAY_NAME_OVERRIDES[chain_code]
    return chain_code.replace("_", " ").replace("-", " ").title()


def parse_price(raw: str) -> float | None:
    raw = (raw or "").strip().replace(",", ".")
    if not raw:
        return None
    try:
        v = float(raw)
    except ValueError:
        return None
    return v if v > 0 else None


def load_stores(stores_csv: Path) -> tuple[int, list[str], list[dict]]:
    cities: set[str] = set()
    stores: list[dict] = []
    with stores_csv.open("r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            code = (row.get("store_id") or "").strip()
            city = (row.get("city") or "").strip()
            address = (row.get("address") or "").strip()
            zipcode = (row.get("zipcode") or "").strip()
            if city:
                cities.add(city)
            if code:
                stores.append({
                    "code": code,
                    "address": address,
                    "city": city,
                    "zipcode": zipcode,
                })
    stores.sort(key=lambda s: (s["city"].lower(), s["address"].lower()))
    return len(stores), sorted(cities), stores


def load_min_prices(prices_csv: Path) -> dict[str, float]:
    min_by_pid: dict[str, float] = {}
    with prices_csv.open("r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            pid = (row.get("product_id") or "").strip()
            if not pid:
                continue
            price = parse_price(row.get("special_price") or "") or parse_price(
                row.get("price") or ""
            )
            if price is None:
                continue
            cur = min_by_pid.get(pid)
            if cur is None or price < cur:
                min_by_pid[pid] = price
    return min_by_pid


def process_chain(chain_dir: Path, date_str: str) -> dict | None:
    products_csv = chain_dir / "products.csv"
    prices_csv = chain_dir / "prices.csv"
    stores_csv = chain_dir / "stores.csv"
    if not (products_csv.is_file() and prices_csv.is_file()):
        return None

    store_count, cities, stores = load_stores(stores_csv) if stores_csv.is_file() else (0, [], [])
    min_prices = load_min_prices(prices_csv)

    rows: list[list] = []
    with products_csv.open("r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            pid = (row.get("product_id") or "").strip()
            if not pid:
                continue
            price = min_prices.get(pid)
            if price is None:
                continue
            rows.append([
                pid,
                (row.get("barcode") or "").strip(),
                (row.get("name") or "").strip(),
                (row.get("brand") or "").strip(),
                (row.get("category") or "").strip(),
                (row.get("unit") or "").strip(),
                (row.get("quantity") or "").strip(),
                round(price, 2),
            ])

    rows.sort(key=lambda r: r[2].lower())

    return {
        "schema": SCHEMA_VERSION,
        "date": date_str,
        "chain": chain_dir.name,
        "displayName": display_name(chain_dir.name),
        "storeCount": store_count,
        "cities": cities,
        "stores": stores,
        "fields": FIELDS,
        "products": rows,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--date", help="dated folder to parse (default: latest)")
    args = p.parse_args()

    src = pick_archive(args.date)
    date_str = src.name
    print(f"Parsing archive: {src}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for old in OUTPUT_DIR.glob("*.json"):
        if old.name != "index.json":
            old.unlink()

    chain_entries: list[dict] = []
    for entry in sorted(src.iterdir()):
        if not entry.is_dir():
            continue
        print(f"  {entry.name}: ", end="", flush=True)
        data = process_chain(entry, date_str)
        if data is None:
            print("(no products.csv/prices.csv — skipped)")
            continue

        out_file = OUTPUT_DIR / f"{entry.name}.json"
        with out_file.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        size_kb = out_file.stat().st_size / 1024
        print(f"{len(data['products'])} products, {size_kb:.0f} KB -> {out_file.name}")

        chain_entries.append({
            "code": data["chain"],
            "displayName": data["displayName"],
            "productCount": len(data["products"]),
            "storeCount": data["storeCount"],
            "cities": data["cities"],
            "file": out_file.name,
        })

    index = {
        "schema": SCHEMA_VERSION,
        "date": date_str,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "chains": chain_entries,
    }
    with (OUTPUT_DIR / "index.json").open("w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    total_products = sum(c["productCount"] for c in chain_entries)
    print(f"\nWrote {len(chain_entries)} chains, {total_products} products total -> {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
