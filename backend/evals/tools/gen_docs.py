"""Synthetic evidence generator — renders packing-list (+ optional damage) images
AND emits the gold JSON in one shot, so every case ships with free, exact labels.

The rendered text matches what the classical pipeline parses:
  - PO   -> a standalone 8-digit number   (field_normalizer)
  - qty  -> "<N> cartons"                  (field_normalizer)
  - lot  -> "LOT-YYYY-NNNN"                (field_normalizer)
  - docs -> an ENCLOSED DOCUMENTS section with "enclosed / not enclosed" markers
            (document_classifier.enclosed_documents, line-scoped)
  - damage -> a "DAMAGE DETECTED - N cartons" caption (damage_detector fallback)

    ./.venv/bin/python ../../evals/tools/gen_docs.py --tier hero

Coverage-first, not volume: each SCENARIO below is one business failure mode. Add a
dict to SCENARIOS to add a case; do NOT clone the same case 1000x.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[3]
EVALS = REPO / "backend" / "evals"
ASSETS = EVALS / "assets"

_FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "DejaVuSans.ttf",
]


def _font(size: int) -> ImageFont.FreeTypeFont:
    for path in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()  # last resort (Tesseract may struggle)


# Every case = one scenario. `received`/`damaged`/`missing_docs` drive the exception.
SCENARIOS = [
    {
        "case_id": "basf_clean", "scenario": "clean_receipt", "supplier": "BASF",
        "po_number": "45009301", "material": "Resin additive", "ordered": 40, "received": 40,
        "unit": "cartons", "unit_price": 421, "plant": "Heidelberg", "lot": "LOT-2026-0631",
        "required": ["Packing list", "Batch certificate", "CoA"], "missing_docs": [],
        "damaged": 0, "gold_decision": "accept",
    },
    {
        "case_id": "mitsui_over_delivery", "scenario": "over_delivery", "supplier": "Mitsui Chemicals",
        "po_number": "45009312", "material": "Polymer granulate", "ordered": 40, "received": 43,
        "unit": "cartons", "unit_price": 388, "plant": "Ludwigshafen", "lot": "LOT-2026-0644",
        "required": ["Packing list", "CoA"], "missing_docs": [],
        "damaged": 0, "gold_decision": "partial_receipt",
    },
    {
        "case_id": "covestro_short_delivery", "scenario": "short_delivery", "supplier": "Covestro",
        "po_number": "45009327", "material": "Coating base", "ordered": 40, "received": 37,
        "unit": "cartons", "unit_price": 455, "plant": "Leverkusen", "lot": "LOT-2026-0659",
        "required": ["Packing list", "CoA"], "missing_docs": [],
        "damaged": 0, "gold_decision": "partial_receipt",
    },
    {
        "case_id": "habasit_missing_coa", "scenario": "missing_coa", "supplier": "Habasit",
        "po_number": "45009338", "material": "Conveyor belt", "ordered": 40, "received": 40,
        "unit": "cartons", "unit_price": 512, "plant": "Reinach", "lot": "LOT-2026-0662",
        "required": ["Packing list", "Batch certificate", "CoA"], "missing_docs": ["CoA"],
        "damaged": 0, "gold_decision": "partial_receipt",
    },
    {
        "case_id": "forbo_damaged", "scenario": "damaged_goods", "supplier": "Forbo",
        "po_number": "45009349", "material": "Flooring adhesive", "ordered": 40, "received": 40,
        "unit": "cartons", "unit_price": 402, "plant": "Frankfurt", "lot": "LOT-2026-0677",
        "required": ["Packing list", "CoA"], "missing_docs": [],
        "damaged": 3, "gold_decision": "partial_receipt",
    },
]


def _doc_line(name: str, missing: bool) -> str:
    return f"  {name}: {'not enclosed' if missing else 'enclosed'}"


def render_packing_list(sc: dict, out_path: Path) -> None:
    W, H = 1240, 1600
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    title_f, head_f, body_f = _font(46), _font(34), _font(30)

    y = 60
    d.text((60, y), sc["supplier"], font=title_f, fill="black"); y += 70
    d.text((60, y), "PACKING LIST / DELIVERY NOTE", font=head_f, fill="black"); y += 70
    d.line((60, y, W - 60, y), fill="black", width=2); y += 40

    rows = [
        ("Purchase Order", sc["po_number"]),
        ("Supplier", sc["supplier"]),
        ("Material", sc["material"]),
        ("Total quantity", f"{sc['received']} {sc['unit']}"),
        ("Lot number", sc["lot"]),
        ("Plant", sc["plant"]),
    ]
    for label, value in rows:
        d.text((60, y), f"{label}:", font=body_f, fill="black")
        d.text((470, y), str(value), font=body_f, fill="black")
        y += 56

    y += 30
    d.text((60, y), "ENCLOSED DOCUMENTS", font=head_f, fill="black"); y += 60
    doc_names = {"Packing list": "Packing list", "Batch certificate": "Batch certificate",
                 "CoA": "Certificate of Analysis"}
    for doc in sc["required"]:
        printed = doc_names.get(doc, doc)
        d.text((60, y), _doc_line(printed, doc in sc["missing_docs"]), font=body_f, fill="black")
        y += 52

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def render_damage(sc: dict, out_path: Path) -> None:
    W, H = 1240, 900
    img = Image.new("RGB", (W, H), (60, 60, 60))
    d = ImageDraw.Draw(img)
    d.rectangle((80, 120, W - 80, H - 120), outline=(200, 80, 80), width=8)
    d.text((120, 200), "DOCK DAMAGE PHOTO", font=_font(40), fill="white")
    d.text((120, 320), f"DAMAGE DETECTED - {sc['damaged']} cartons", font=_font(48), fill=(255, 160, 160))
    d.text((120, 440), "crushed / torn packaging", font=_font(34), fill="white")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


def build_case(sc: dict) -> dict:
    asset_dir = ASSETS / sc["case_id"]
    pl = asset_dir / "packing_list.png"
    render_packing_list(sc, pl)
    evidence = [{"kind": "packing_list", "path": str(pl.relative_to(REPO))}]
    if sc["damaged"] > 0:
        dmg = asset_dir / "damage.png"
        render_damage(sc, dmg)
        evidence.append({"kind": "damage", "path": str(dmg.relative_to(REPO))})

    docs_missing = list(sc["missing_docs"])
    docs_found = [d for d in sc["required"] if d not in docs_missing]
    return {
        "case_id": sc["case_id"],
        "tier": None,  # set by caller
        "scenario": sc["scenario"],
        "note": "synthetic — evidence rendered by gen_docs.py; gold values are the generator's ground truth.",
        "po": {
            "po_number": sc["po_number"], "supplier": sc["supplier"], "material": sc["material"],
            "expected_quantity": sc["ordered"], "unit": sc["unit"], "unit_price": sc["unit_price"],
            "plant": sc["plant"], "required_documents": sc["required"],
        },
        "evidence": evidence,
        "gold_extraction": {
            "po_number": sc["po_number"], "supplier": sc["supplier"], "material": sc["material"],
            "detected_quantity": sc["received"], "unit": sc["unit"], "lot_number": sc["lot"],
            "documents_found": docs_found, "documents_missing": docs_missing,
            "damaged_cartons": sc["damaged"],
        },
        "gold_decision": {"decision": sc["gold_decision"]},
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tier", default="hero")
    args = ap.parse_args()
    case_dir = EVALS / "cases" / args.tier
    case_dir.mkdir(parents=True, exist_ok=True)
    for sc in SCENARIOS:
        case = build_case(sc)
        case["tier"] = args.tier
        (case_dir / f"{sc['case_id']}.json").write_text(json.dumps(case, indent=2))
        print(f"· generated {sc['case_id']} ({sc['scenario']})")
    print(f"→ {len(SCENARIOS)} cases into {case_dir.relative_to(REPO)} + assets/")


if __name__ == "__main__":
    main()
