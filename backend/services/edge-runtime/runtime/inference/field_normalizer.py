"""Turns a normalized extraction into the display-ready field list the operator
console shows (label / value / confidence / source / flag) — the same shape the
frontend already renders in its extracted-fields card.

Also parses structured fields out of raw OCR text for the classical pipeline."""

from __future__ import annotations

import re


def parse_fields_from_text(text: str, po: dict) -> dict:
    """Regex out PO number, quantity+unit, lot, supplier, material from OCR text.
    Supplier/material are confirmed against the PO (read-and-verify)."""
    low = text.lower()

    # PO: prefer a standalone 8-digit number (the real PO) over "PO <digits>",
    # which can match a truncated footer like "PO 450092".
    m = re.search(r"\b(\d{8})\b", text) or re.search(r"po\s*(?:number|no\.?)?\s*[:#]?\s*([0-9]{6,})", low)
    po_number = m.group(1) if m else ""

    qty, unit = 0, ""
    mt = re.search(r"total\s+\w+\s+(\d+)\s*([a-z]+)", low) or re.search(
        r"(\d+)\s*(cartons?|bags?|pcs|ea|pallets?|units?)", low
    )
    if mt:
        qty, unit = int(mt.group(1)), mt.group(2)

    # Lot: bounded (e.g. LOT-2026-0617) so it doesn't swallow a trailing quantity.
    ml = re.search(r"lot[-\s]?\d{4}[-\s]?\d{3,4}", low)
    lot = text[ml.start() : ml.end()].upper().replace(" ", "-") if ml else ""

    supplier = po.get("supplier", "") if po and po.get("supplier", "").lower() in low else ""
    material = po.get("material", "") if po and po.get("material", "").lower() in low else ""

    return {
        "po_number": po_number,
        "supplier": supplier,
        "material": material,
        "detected_quantity": qty,
        "unit": unit or (po.get("unit", "") if po else ""),
        "lot_number": lot,
    }


def build_display_fields(extraction: dict, po: dict) -> list[dict]:
    conf = float(extraction.get("confidence", 0.0))
    detected = int(extraction.get("detected_quantity", 0))
    expected = int(po.get("expected_quantity", 0))
    qty_flag = detected != expected
    unit = extraction.get("unit", "")
    return [
        {
            "label": "PO number",
            "value": extraction.get("po_number", ""),
            "confidence": min(conf + 0.05, 0.99),
            "source": "Packing list + carton label",
            "flag": False,
        },
        {
            "label": "Supplier",
            "value": extraction.get("supplier", ""),
            "confidence": min(conf + 0.03, 0.99),
            "source": "Letterhead + shipping marks",
            "flag": False,
        },
        {
            "label": "Material",
            "value": extraction.get("material", ""),
            "confidence": min(conf + 0.04, 0.99),
            "source": "Packing list line 1",
            "flag": False,
        },
        {
            "label": "Quantity received",
            "value": f"{detected} {unit}".strip(),
            "confidence": conf,
            "source": "Carton count · vision",
            "flag": qty_flag,
        },
        {
            "label": "Lot number",
            "value": extraction.get("lot_number", ""),
            "confidence": min(conf + 0.02, 0.99),
            "source": "Carton label barcode",
            "flag": False,
        },
    ]
