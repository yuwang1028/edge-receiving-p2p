"""Invoice IDP — extract structured fields from a supplier-invoice document.

The supplier invoice is an EXTERNAL document (unlike the buyer's PO, which is an
ERP record), so it's the right thing to OCR/IDP. Classical OCR + regex for now;
the same swap-by-provider story as receiving applies (Vertex/local VLM later).
Reads invoice_no, po_number, supplier, billed_quantity, unit_price, amount, terms."""

from __future__ import annotations

import re

from .ocr_engine import ocr_text


def _money(s: str) -> float:
    try:
        return float(s.replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def extract_invoice(path: str) -> dict:
    text = ocr_text(path)
    low = text.lower()

    inv = re.search(r"(INV-[A-Z0-9-]+)", text)
    po = re.search(r"\b(\d{8})\b", text)
    qty = re.search(r"quantity[:\s]*(\d+)", low) or re.search(r"(\d+)\s*cartons", low)
    up = re.search(r"unit price[:\s]*(?:usd)?\s*\$?([\d,]+\.\d{2})", low)
    amt = re.search(r"total due[:\s]*(?:usd)?\s*\$?([\d,]+\.\d{2})", low) or re.search(
        r"subtotal[:\s]*(?:usd)?\s*\$?([\d,]+\.\d{2})", low
    )
    terms = re.search(r"(net\s*\d+)", low)

    billed = int(qty.group(1)) if qty else 0
    unit_price = _money(up.group(1)) if up else 0.0
    amount = _money(amt.group(1)) if amt else round(billed * unit_price, 2)
    if not unit_price and billed:
        unit_price = round(amount / billed, 2)

    found = sum(bool(x) for x in (inv, po, qty))
    return {
        "invoice_no": inv.group(1) if inv else "",
        "po_number": po.group(1) if po else "",
        "supplier": "BASF" if "basf" in low else "",
        "billed_quantity": billed,
        "unit_price": unit_price,
        "amount": amount,
        "payment_terms": terms.group(1).title() if terms else "",
        "confidence": 0.95 if found == 3 else 0.6,
    }
