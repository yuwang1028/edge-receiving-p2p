"""Seed the edge with master data + the hero receiving case.

PO + contract master data is PULLED FROM THE MOCK ERP CONNECTOR (CSV extracts),
not hardcoded — the same shape a real SAP/Coupa read would return. The supplier
INVOICE is NOT seeded: it arrives as a document and is IDP-extracted on the
Invoice console (so its amounts are read, not faked).

Hero case: BASF · Heidelberg · PO 45009281 · ordered 40 cartons → the dock detects
42 with 2 damaged + a missing batch certificate → partial receipt + invoice hold."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..connectors.erp import load_contracts, load_purchase_orders
from .local_database import Contract, PurchaseOrder, ReceivingCase

HERO_CASE = {
    "id": "rc_2026_0041",
    "po_number": "45009281",
    "plant": "Heidelberg",
    "title": "BASF shipment · delivery variance",
    "summary": "Inbound at Dock 3 against PO 45009281 — awaiting edge analysis.",
    "status": "received",
}


def seed_if_empty(db: Session) -> None:
    # PO + contract master data — fetched from the (mock) ERP, not seeded inline.
    if db.query(PurchaseOrder).count() == 0:
        for po in load_purchase_orders():
            db.add(PurchaseOrder(**po))
        db.commit()
    if db.query(Contract).count() == 0:
        for c in load_contracts():
            db.add(Contract(**c))
        db.commit()
    if db.get(ReceivingCase, HERO_CASE["id"]) is None:
        db.add(ReceivingCase(**HERO_CASE))
        db.commit()
