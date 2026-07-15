"""SHA-256 hashing for the audit chain. Self-contained so the audit service has
no dependency on the edge runtime. Only hashes ever leave the device."""

from __future__ import annotations

import hashlib


def sha256_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return "sha256:" + h.hexdigest()
