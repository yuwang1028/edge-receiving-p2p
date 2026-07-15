"""Robust image ingestion for real-world evidence: iPhone (HEIC/HEIF), Samsung /
Android (JPEG), webcam / CSI camera frames, and the usual PNG/WEBP/TIFF/BMP.

For every upload we keep the ORIGINAL bytes (hashed for the audit chain) and
produce a NORMALIZED derivative — EXIF-rotation applied (so iPhone/Samsung shots
aren't sideways), converted to RGB, downscaled, saved as JPEG — which is what the
browser previews and the VLM/OCR will read.

Fully tolerant: anything Pillow can't decode (e.g. an SVG, a PDF, a corrupt
frame) falls back to "store original, no normalization" instead of erroring."""

from __future__ import annotations

import io
from dataclasses import dataclass

try:
    import pillow_heif

    pillow_heif.register_heif_opener()  # teaches Pillow to open iPhone .heic/.heif
except Exception:  # pragma: no cover - optional dep
    pass

try:
    from PIL import Image, ImageOps

    _PIL_OK = True
except Exception:  # pragma: no cover
    _PIL_OK = False

# Longest edge for the normalized derivative — plenty for OCR/VLM, keeps it light.
MAX_EDGE = 2048
JPEG_QUALITY = 88

# EXIF tag ids (avoid importing ExifTags maps for a couple of values).
_EXIF_MAKE = 271
_EXIF_MODEL = 272
_EXIF_DATETIME = 306


@dataclass
class Ingested:
    normalized_bytes: bytes | None  # JPEG; None if the bytes weren't a raster image
    width: int | None               # original pixel dimensions
    height: int | None
    image_format: str               # original format, e.g. JPEG / HEIF / PNG / unknown
    device: str                     # EXIF make+model, e.g. "Apple iPhone 15 Pro"
    captured_at: str                # EXIF DateTime if present


def _device_and_capture(img) -> tuple[str, str]:
    try:
        ex = img.getexif()
        make = str(ex.get(_EXIF_MAKE, "") or "").strip()
        model = str(ex.get(_EXIF_MODEL, "") or "").strip()
        cap = str(ex.get(_EXIF_DATETIME, "") or "").strip()
        # iPhone reports make "Apple" + model "iPhone 15 Pro"; avoid "Apple Apple".
        device = (f"{make} {model}".strip() if model and not model.startswith(make) else (model or make)).strip()
        return device, cap
    except Exception:
        return "", ""


def ingest(data: bytes) -> Ingested:
    if not _PIL_OK:
        return Ingested(None, None, None, "unknown", "", "")
    try:
        img = Image.open(io.BytesIO(data))
        fmt = img.format or "unknown"
        device, captured_at = _device_and_capture(img)

        img = ImageOps.exif_transpose(img)  # fix iPhone/Samsung orientation
        w, h = img.size
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        elif img.mode == "L":
            img = img.convert("RGB")

        scale = MAX_EDGE / max(w, h) if max(w, h) > MAX_EDGE else 1.0
        if scale < 1.0:
            img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))))

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=JPEG_QUALITY)
        return Ingested(buf.getvalue(), w, h, fmt, device, captured_at)
    except Exception:
        # Non-raster (SVG/PDF) or undecodable frame — keep the original as-is.
        return Ingested(None, None, None, "unknown", "", "")
