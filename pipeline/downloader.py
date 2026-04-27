"""Download Croatian retail price archives from https://api.cijene.dev/v0/list.

Runs in GitHub Actions. Extracts into pipeline/archives/{date}/ for
build_prices_index.py to consume. That folder is gitignored.

Usage:
    python downloader.py                       # latest archive (default)
    python downloader.py --date 2026-04-17     # one specific day
    python downloader.py --no-extract          # keep .zip, skip extraction
    python downloader.py --list                # just print the index, no download
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import urllib.request
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path

API_LIST_URL = "https://api.cijene.dev/v0/list"
TARGET_DIR = Path(__file__).resolve().parent / "archives"


def fetch_index() -> list[dict]:
    with urllib.request.urlopen(API_LIST_URL, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    archives = payload.get("archives", [])
    archives.sort(key=lambda a: a["date"])
    return archives


def parse_date(s: str) -> date:
    return datetime.strptime(s, "%Y-%m-%d").date()


def select(archives: list[dict], args: argparse.Namespace) -> list[dict]:
    if args.date:
        d = parse_date(args.date).isoformat()
        picked = [a for a in archives if a["date"] == d]
        if not picked:
            sys.exit(f"No archive available for {d}")
        return picked
    return [archives[-1]]  # latest


def human_size(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} TB"


def download(url: str, dest: Path) -> None:
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(url, timeout=120) as resp, tmp.open("wb") as out:
        shutil.copyfileobj(resp, out, length=1024 * 256)
    tmp.replace(dest)


def extract(zip_path: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(out_dir)


def process_one(item: dict, extract_zip: bool) -> None:
    d = item["date"]
    url = item["url"]
    size = item.get("size", 0)
    zip_path = TARGET_DIR / f"{d}.zip"
    out_dir = TARGET_DIR / d

    if zip_path.exists() and zip_path.stat().st_size == size:
        print(f"[skip] {d}.zip already present ({human_size(size)})")
    else:
        print(f"[get ] {d}.zip  {human_size(size)}  <- {url}")
        TARGET_DIR.mkdir(parents=True, exist_ok=True)
        download(url, zip_path)

    if extract_zip:
        marker = out_dir / ".extracted"
        if marker.exists():
            print(f"[skip] {d}/ already extracted")
        else:
            print(f"[unzip] {d}.zip -> {d}/")
            extract(zip_path, out_dir)
            marker.write_text(datetime.now(timezone.utc).isoformat() + "\n")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--date", help="download a single YYYY-MM-DD archive")
    p.add_argument("--no-extract", action="store_true", help="skip unzip step")
    p.add_argument("--list", action="store_true", help="print index and exit")
    args = p.parse_args()

    print(f"Fetching index from {API_LIST_URL}")
    archives = fetch_index()
    print(f"  {len(archives)} archives, {archives[0]['date']} .. {archives[-1]['date']}")

    if args.list:
        for a in archives:
            print(f"  {a['date']}  {human_size(a.get('size', 0)):>9}  {a['url']}")
        return 0

    picks = select(archives, args)
    total = sum(a.get("size", 0) for a in picks)
    print(f"Selected {len(picks)} archive(s), ~{human_size(total)} total")
    print(f"Target: {TARGET_DIR}")

    for item in picks:
        process_one(item, extract_zip=not args.no_extract)

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
