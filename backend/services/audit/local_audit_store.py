"""Writes the audit package to local disk as JSON and returns its URI. On the
edge this is the durable record even with no network; the cloud store (P4) mirrors
it to Cloud Storage when online."""

from __future__ import annotations

import json
import pathlib


def save_package(package: dict, storage_dir: str) -> str:
    out_dir = pathlib.Path(storage_dir) / "audit_packages"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{package['decisionId']}.json"
    path.write_text(json.dumps(package, indent=2, default=str), encoding="utf-8")
    return path.resolve().as_uri()
