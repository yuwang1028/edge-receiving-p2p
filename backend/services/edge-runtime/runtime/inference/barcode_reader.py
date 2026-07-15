"""Barcode / QR decode via zxing-cpp — for carton / shipment IDs, which are more
reliable read as a code than as OCR digits. Best-effort: returns [] if none
decode (e.g. a low-res photo or a non-standard symbology)."""

from __future__ import annotations


def read_barcodes(path: str) -> list[str]:
    try:
        import zxingcpp
        from PIL import Image

        results = zxingcpp.read_barcodes(Image.open(path))
        return [r.text for r in results if getattr(r, "text", "")]
    except Exception:
        return []
