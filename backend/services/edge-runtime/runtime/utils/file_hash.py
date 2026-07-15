"""SHA-256 hashing — the spine of the audit chain. Only the hash of each
evidence image is ever synced to the cloud; the image itself stays local."""

import hashlib


def sha256_bytes(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return "sha256:" + h.hexdigest()
