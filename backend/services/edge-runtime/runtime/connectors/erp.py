"""Mock ERP connector — PO + contract master data 'pulled from the ERP'.

Reads CSV extracts under backend/data/sample/ (purchase_orders.csv, contracts.csv)
instead of hardcoded seed dicts. Same shape an SAP/Coupa connector would return —
swap this module for a real SAP MM read and nothing downstream changes. NOTE: a PO
is the buyer's own ERP record, so it is FETCHED, not OCR'd (unlike the supplier
invoice, which is a document we IDP-extract)."""

from __future__ import annotations

import csv
import pathlib

_DATA = pathlib.Path(__file__).resolve().parents[4] / "data" / "sample"


def _docs(raw: str) -> list[str]:
    return [d.strip() for d in (raw or "").split(";") if d.strip()]


def load_purchase_orders() -> list[dict]:
    path = _DATA / "purchase_orders.csv"
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [
        {
            "po_number": r["po_number"].strip(),
            "supplier": r["supplier"].strip(),
            "material": r["material"].strip(),
            "expected_quantity": int(r["expected_quantity"]),
            "unit": r["unit"].strip(),
            "unit_price": float(r["unit_price"]),
            "plant": r["plant"].strip(),
            "required_documents": _docs(r["required_documents"]),
        }
        for r in rows
    ]


def load_materials() -> list[dict]:
    """Material catalog ('ERP master data') the PR agent matches a need against."""
    path = _DATA / "materials.csv"
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [
        {
            "material_code": r["material_code"].strip(),
            "name": r["name"].strip(),
            "category": r["category"].strip(),
            "unit": r["unit"].strip(),
            "indicative_price": float(r["indicative_price"]),
        }
        for r in rows
    ]


def load_suppliers() -> list[dict]:
    """Approved supplier pool, by category — the sourcing/PR agents pick from this."""
    path = _DATA / "suppliers.csv"
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [
        {
            "supplier": r["supplier"].strip(),
            "category": r["category"].strip(),
            "quote_price": float(r["quote_price"]),
            "lead_days": int(r["lead_days"]),
            "risk": r["risk"].strip(),
            "contracted": r["contracted"].strip().lower() in ("yes", "true", "1"),
        }
        for r in rows
    ]


def load_cost_centers() -> list[dict]:
    """Cost-center master data — the PR agent assigns one by plant + category."""
    path = _DATA / "cost_centers.csv"
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [
        {"cost_center": r["cost_center"].strip(), "description": r["description"].strip(),
         "plant": r["plant"].strip(), "category": r["category"].strip()}
        for r in rows
    ]


def load_gl_accounts() -> list[dict]:
    """G/L account master data — the PR agent assigns one by category."""
    path = _DATA / "gl_accounts.csv"
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [
        {"gl": r["gl"].strip(), "description": r["description"].strip(),
         "type": r["type"].strip(), "category": r["category"].strip()}
        for r in rows
    ]


def load_contracts() -> list[dict]:
    path = _DATA / "contracts.csv"
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [
        {
            "po_number": r["po_number"].strip(),
            "supplier": r["supplier"].strip(),
            "unit_price": float(r["unit_price"]),
            "currency": r["currency"].strip(),
            "payment_terms": r["payment_terms"].strip(),
            "price_tolerance_pct": float(r["price_tolerance_pct"]),
            "required_documents": _docs(r["required_documents"]),
        }
        for r in rows
    ]
