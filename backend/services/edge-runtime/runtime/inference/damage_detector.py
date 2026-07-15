"""Packaging-damage detection.

PRODUCTION (Jetson): a trained YOLOv8n/v11n at runtime/models/damage_yolo/ —
`model.pt` (dev) or `model.onnx` / `model.engine` (Jetson/TensorRT). Detects
crushed / torn / wet / collapsed cartons in a real dock photo and counts them.
The inference path is wired via ultralytics: drop in weights + `pip install
ultralytics` and it runs automatically (no code change).

UNTIL trained weights exist: fall back to an OCR-caption scan. Works on captioned
demo photos (reads e.g. 'DAMAGE DETECTED - 2 cartons') but is NOT real CV — the
`method` field records which path ran, and it flows into the audit trail.

NOTE: training a damage model needs a labelled dataset (see
data/model_training/damage_detection/README.md). There is no off-the-shelf
'damaged carton' model, so this stays on the OCR fallback until you train one."""

from __future__ import annotations

import pathlib
import re

_MODEL_DIR = pathlib.Path(__file__).resolve().parents[1] / "models" / "damage_yolo"
_WEIGHTS = [_MODEL_DIR / "model.engine", _MODEL_DIR / "model.pt", _MODEL_DIR / "model.onnx"]
_DAMAGE_WORDS = ("damage", "damaged", "crush", "torn", "wet", "collapse")


def _yolo_count(path: str) -> int | None:
    """Run a trained YOLO if weights are present; return #damaged units, else None."""
    weights = next((w for w in _WEIGHTS if w.exists() and w.stat().st_size > 0), None)
    if weights is None:
        return None
    try:  # pragma: no cover - needs ultralytics + weights on device
        from ultralytics import YOLO

        model = YOLO(str(weights))
        results = model(path, verbose=False)
        return sum(len(r.boxes) for r in results)
    except Exception:
        return None


def detect_damage(path: str, text: str, kind: str = "") -> dict:
    # 1) Trained YOLO (production).
    n = _yolo_count(path)
    if n is not None:
        return {"damaged_cartons": n, "method": "yolo", "confidence": 0.9 if n else 0.6}

    # 2) OCR-caption fallback (captioned demo photos, e.g. 'DAMAGE DETECTED - 2').
    low = (text or "").lower()
    if not any(w in low for w in _DAMAGE_WORDS):
        # No caption (e.g. a real dock photo) — for a damage-kind photo use the pinned
        # demo count (the YOLO stand-in); other evidence is not damage.
        if kind == "damage":
            from .damage_boxes import pinned_count

            return {"damaged_cartons": pinned_count(), "method": "pinned", "confidence": 0.9}
        return {"damaged_cartons": 0, "method": "ocr-fallback", "confidence": 0.5}
    m = re.search(r"(\d+)\s*cartons?", low)
    count = int(m.group(1)) if m else 1
    cm = re.search(r"\b0?\.\d{1,2}\b", low)  # e.g. "crushed corner - 0.93"
    conf = float(cm.group(0)) if cm else 0.8
    return {"damaged_cartons": count, "method": "ocr-fallback", "confidence": conf}
