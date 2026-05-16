"""Upload the meal-planner price catalog JSONs to a shared Google Drive folder.

Runs in GitHub Actions using a service account. Reads credentials from the
DRIVE_SA_JSON env var (the service account key JSON, stored as a repo secret)
and the folder ID from DRIVE_FOLDER_ID.

The service account must have Editor access to the target folder:
  1. In Drive, right-click folder -> Share -> add the service account's
     client_email -> "Editor" -> Done.
  2. The folder should also be "Anyone with the link, Viewer" so the web app
     can read with a browser API key.

Each run:
  - Lists the folder to discover existing {name: fileId} mappings.
  - Updates each existing JSON in place (same file ID -> stable share URL).
  - Creates any missing JSONs.

Usage (in CI):
    DRIVE_SA_JSON=...json... DRIVE_FOLDER_ID=... python upload_to_drive.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PRICES_DIR = SCRIPT_DIR.parent / "data" / "prices"

SCOPES = ["https://www.googleapis.com/auth/drive"]
RETRY_DELAYS = [1, 4, 15]


def main() -> int:
    if not PRICES_DIR.is_dir():
        print(f"[error] Prices directory not found: {PRICES_DIR}", file=sys.stderr)
        print("        Run build_prices_index.py first.", file=sys.stderr)
        return 2

    folder_id = os.environ.get("DRIVE_FOLDER_ID", "").strip()
    if not folder_id:
        print("[error] DRIVE_FOLDER_ID env var is empty.", file=sys.stderr)
        return 2

    sa_json = os.environ.get("DRIVE_SA_JSON", "").strip()
    if not sa_json:
        print("[error] DRIVE_SA_JSON env var is empty (expecting the service account JSON).", file=sys.stderr)
        return 2

    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from googleapiclient.errors import HttpError
    except ImportError:
        print("[error] Missing Google API libraries. pip install -r pipeline/requirements.txt", file=sys.stderr)
        return 2

    try:
        creds_info = json.loads(sa_json)
    except json.JSONDecodeError as e:
        print(f"[error] DRIVE_SA_JSON is not valid JSON: {e}", file=sys.stderr)
        return 2

    print(f"[debug] SA client_email: {creds_info.get('client_email')}")
    print(f"[debug] SA project_id : {creds_info.get('project_id')}")
    print(f"[debug] target folder : {folder_id}")
    if folder_id:
        prefix = folder_id[:6]
        suffix = folder_id[-4:]
        print(f"[debug] folder id len={len(folder_id)} prefix={prefix!r} suffix={suffix!r}")

    creds = Credentials.from_service_account_info(creds_info, scopes=SCOPES)
    service = build("drive", "v3", credentials=creds, cache_discovery=False)

    try:
        meta = service.files().get(
            fileId=folder_id,
            fields="id,name,mimeType,driveId,parents,owners(emailAddress),capabilities(canEdit,canAddChildren)",
            supportsAllDrives=True,
        ).execute()
        print(f"[debug] folder.get OK: name={meta.get('name')!r} mimeType={meta.get('mimeType')} "
              f"driveId={meta.get('driveId')} parents={meta.get('parents')} "
              f"owners={[o.get('emailAddress') for o in meta.get('owners', [])]} "
              f"capabilities={meta.get('capabilities')}")
    except HttpError as e:
        status = getattr(e.resp, "status", "?")
        body = getattr(e, "content", b"")
        try:
            body_str = body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else str(body)
        except Exception:
            body_str = repr(body)
        print(f"[debug] folder.get FAILED status={status} body={body_str}", file=sys.stderr)

    file_ids = _list_folder_files(service, folder_id)
    print(f"[info] folder {folder_id}: {len(file_ids)} existing files")

    json_files = sorted(PRICES_DIR.glob("*.json"))
    if not json_files:
        print(f"[error] No JSON files found in {PRICES_DIR}", file=sys.stderr)
        return 2

    created = updated = 0
    for path in json_files:
        name = path.name
        size = _human_size(path.stat().st_size)
        existing = file_ids.get(name)
        try:
            if existing:
                fid = _with_retry(
                    lambda: _update_file(service, existing, path, MediaFileUpload),
                    label=f"update {name}",
                )
                updated += 1
                print(f"  [updated] {name:<30} {size:>9}  id={fid}")
            else:
                fid = _with_retry(
                    lambda: _create_file(service, folder_id, path, MediaFileUpload),
                    label=f"create {name}",
                )
                created += 1
                print(f"  [created] {name:<30} {size:>9}  id={fid}")
        except HttpError as e:
            status = getattr(e.resp, "status", "?")
            body = getattr(e, "content", b"")
            try:
                body_str = body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else str(body)
            except Exception:
                body_str = repr(body)
            print(f"[debug] upload error body: {body_str}", file=sys.stderr)
            if str(status) in ("401", "403"):
                print(
                    f"[error] Drive rejected upload ({status}). "
                    "Check that the service account has Editor on the folder.",
                    file=sys.stderr,
                )
                return 1
            raise

    print(f"\nUploaded {created + updated} files to folder {folder_id} (created={created}, updated={updated})")
    return 0


def _list_folder_files(service, folder_id: str) -> dict[str, str]:
    out: dict[str, str] = {}
    page_token = None
    while True:
        resp = service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="nextPageToken, files(id,name)",
            pageSize=1000,
            pageToken=page_token,
            supportsAllDrives=False,
        ).execute()
        for f in resp.get("files", []):
            out[f["name"]] = f["id"]
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return out


def _create_file(service, folder_id: str, path: Path, MediaFileUpload) -> str:
    media = MediaFileUpload(str(path), mimetype="application/json", resumable=False)
    resp = service.files().create(
        body={"name": path.name, "parents": [folder_id]},
        media_body=media,
        fields="id",
    ).execute()
    return resp["id"]


def _update_file(service, file_id: str, path: Path, MediaFileUpload) -> str:
    media = MediaFileUpload(str(path), mimetype="application/json", resumable=False)
    resp = service.files().update(
        fileId=file_id, media_body=media, fields="id",
    ).execute()
    return resp["id"]


def _with_retry(fn, *, label: str):
    last_err = None
    for attempt, delay in enumerate(RETRY_DELAYS, start=1):
        try:
            return fn()
        except Exception as e:
            from googleapiclient.errors import HttpError  # lazy
            if isinstance(e, HttpError):
                status = getattr(e.resp, "status", None)
                if status and 400 <= int(status) < 500:
                    raise
            last_err = e
            if attempt == len(RETRY_DELAYS):
                raise
            print(f"    [retry {attempt}] {label} failed ({type(e).__name__}); retrying in {delay}s")
            time.sleep(delay)
    raise last_err if last_err else RuntimeError("unreachable")


def _human_size(n: int) -> str:
    v = float(n)
    for u in ("B", "KB", "MB", "GB"):
        if v < 1024:
            return f"{v:.1f} {u}"
        v /= 1024
    return f"{v:.1f} TB"


if __name__ == "__main__":
    sys.exit(main())
