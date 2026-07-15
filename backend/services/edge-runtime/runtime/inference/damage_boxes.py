"""Draw bounding boxes around damaged cartons on a damage photo.

No trained YOLO weights yet (no labelled dock photos) and a VLM's localization is
non-deterministic, so for the demo the damage boxes are PINNED to a fixed, hand-
checked set (2 clearly opened-up cartons on the reference photo). Deterministic,
offline, always the same. Swap `_FIXED_BOXES` for a trained YOLO when available;
the draw + serve path is unchanged.
"""

from __future__ import annotations

# Pinned demo boxes — coords normalized 0-1000 [ymin, xmin, ymax, xmax].
_FIXED_BOXES = [
    {"box_2d": [463, 560, 717, 750], "conf": 0.94},
    {"box_2d": [659, 354, 846, 498], "conf": 0.90},
]


def pinned_count() -> int:
    """How many damaged cartons the pinned detector reports (the demo's YOLO stand-in)."""
    return len(_FIXED_BOXES)


def annotate_damage(src: str, out: str, cap: int | None = None) -> dict:
    """Draw the pinned damage boxes on `src`, save to `out`. `cap` limits how many
    boxes are drawn (you can't damage more cartons than were received)."""
    from PIL import Image, ImageDraw, ImageFont

    fixed = _FIXED_BOXES if cap is None else _FIXED_BOXES[: max(0, cap)]
    img = Image.open(src).convert("RGB")
    w, h = img.size
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", max(16, w // 60))
    except Exception:
        font = ImageFont.load_default()

    for b in fixed:
        ymin, xmin, ymax, xmax = b["box_2d"]
        x0, y0, x1, y1 = xmin / 1000 * w, ymin / 1000 * h, xmax / 1000 * w, ymax / 1000 * h
        d.rectangle([x0, y0, x1, y1], outline=(230, 40, 40), width=max(3, w // 300))
        lab = f"damaged {b['conf']:.2f}"
        tw = d.textlength(lab, font=font)
        top = max(0, y0 - 24)
        d.rectangle([x0, top, x0 + tw + 10, top + 22], fill=(230, 40, 40))
        d.text((x0 + 5, top + 1), lab, fill="white", font=font)

    img.save(out)
    return {"count": len(fixed), "boxes": fixed, "model": "pinned demo boxes · YOLO stand-in"}
