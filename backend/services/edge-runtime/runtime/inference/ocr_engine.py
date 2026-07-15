"""Tesseract OCR — reads raw text off an evidence image. Lightweight, runs on
Jetson too (libtesseract). The reliable workhorse for structured fields (PO,
quantity, lot, document checklist) — far steadier than a VLM for printed text."""

from __future__ import annotations

import pytesseract
from PIL import Image


def ocr_text(path: str) -> str:
    return pytesseract.image_to_string(Image.open(path))
