"""PO management — turn an AWARDED requisition (supplier + price fixed by
sourcing) into a purchase order written to the 'ERP'. Deterministic: PO number,
required documents, and contract terms come from rules, not a model. The PO it
creates lands in the same table receiving reads, so the chain continues
PR → sourcing → PO → receiving → match → payment."""

from __future__ import annotations

import re

# Inbound documents required at receiving, by material category.
DOCS_BY_CATEGORY = {
    "Chemicals": ["Packing list", "Batch certificate", "CoA"],
    "MRO": ["Packing list", "CoA"],
}
DEFAULT_DOCS = ["Packing list"]
PAYMENT_TERMS = "Net 30"
PRICE_TOLERANCE_PCT = 2.0


def next_po_number(existing: list[str]) -> str:
    """Next SAP-style 8-digit number after the highest existing one."""
    nums = [int(n) for n in existing if n.isdigit() and len(n) == 8]
    base = max(nums) if nums else 45009280
    return str(base + 1)


def required_documents(category: str) -> list[str]:
    return DOCS_BY_CATEGORY.get(category, DEFAULT_DOCS)


def supplier_inbox(supplier: str) -> str:
    base = re.sub(r"[^a-z0-9]", "", supplier.lower()) or "supplier"
    return f"orders@{base}.com"


def build_supplier_email(po, amount: float, terms: str = PAYMENT_TERMS) -> str:
    """Deterministic PO confirmation request the agent drafts for human review
    before sending — a template, not a model (PO management stays rules)."""
    docs = po.required_documents or []
    doclines = "\n".join(f"  - {d}" for d in docs)
    return (
        f"To: {supplier_inbox(po.supplier)}\n"
        f"Subject: Purchase Order {po.po_number} · {po.material} · {po.plant}\n\n"
        f"Dear {po.supplier} team,\n\n"
        f"Please confirm receipt of purchase order {po.po_number} for {po.expected_quantity} "
        f"{po.unit} of {po.material}, delivery to our {po.plant} plant.\n\n"
        f"Please confirm:\n"
        f"• order quantity\n"
        f"• expected ship date\n"
        f"• expected delivery date\n"
        f"• whether the following documents will be included with the shipment:\n"
        f"{doclines}\n\n"
        f"The PO amount is ${amount:,.0f} under {terms} terms.\n\n"
        f"Best,\nProcurement Operations"
    )


def simulate_confirmation(po) -> dict:
    """Simulated supplier reply. A batch certificate (when required) is promised
    'separately' — a planted pre-receiving risk so a later dock exception (missing
    batch cert) has upstream cause, not a surprise."""
    docs = po.required_documents or []
    pending = [d for d in docs if "batch" in d.lower()]
    confirmed = [d for d in docs if d not in pending]
    risk = ""
    if pending:
        risk = f"{', '.join(pending)} will follow separately — not confirmed for delivery. Receiving will require a document check."
    return {
        "confirmedQuantity": po.expected_quantity,
        "deliveryDays": 7,
        "documentsConfirmed": confirmed,
        "documentsPending": pending,
        "risk": risk,
    }
