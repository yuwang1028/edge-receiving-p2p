"""PO management — the last upstream node. An awarded requisition becomes a real
purchase order (+ framework contract) written to the 'ERP', then flows into
receiving → four-way match → payment.

  POST /api/prs/{id}/po   create the PO from an awarded PR (deterministic)
  GET  /api/prs/{id}/po   the PO created from this PR (if any)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..agent.po_manager import (
    PAYMENT_TERMS,
    PRICE_TOLERANCE_PCT,
    build_supplier_email,
    next_po_number,
    required_documents,
    simulate_confirmation,
)
from ..local_store.local_database import (
    Contract,
    PurchaseOrder,
    PurchaseRequisition,
    SourcingResult,
    get_db,
)
from . import po_to_out

router = APIRouter()


def _awarded_sourcing(db: Session, pr_id: str) -> SourcingResult | None:
    return (
        db.query(SourcingResult)
        .filter(SourcingResult.pr_id == pr_id, SourcingResult.status == "awarded")
        .order_by(SourcingResult.created_at.desc())
        .first()
    )


@router.post("/api/prs/{pr_id}/po")
def create_po(pr_id: str, db: Session = Depends(get_db)) -> dict:
    pr = db.get(PurchaseRequisition, pr_id)
    if pr is None:
        raise HTTPException(404, f"PR {pr_id} not found")
    src = _awarded_sourcing(db, pr_id)
    if src is None:
        raise HTTPException(409, "Award a supplier on Sourcing before creating the PO")

    existing = db.query(PurchaseOrder).filter(PurchaseOrder.pr_id == pr_id).first()
    if existing is not None:
        return {"po": po_to_out(existing), "reused": True}

    docs = required_documents(pr.category)
    po_number = next_po_number([p.po_number for p in db.query(PurchaseOrder).all()])

    po = PurchaseOrder(
        po_number=po_number, supplier=src.awarded_supplier, material=pr.material,
        expected_quantity=pr.quantity, unit=pr.unit, unit_price=src.awarded_price,
        plant=pr.plant, required_documents=docs, status="open", pr_id=pr_id, source="po-agent",
        po_state="po_created",
    )
    db.add(po)
    # The contract leg of the four-way match, on the awarded terms.
    if db.get(Contract, po_number) is None:
        db.add(Contract(
            po_number=po_number, supplier=src.awarded_supplier, unit_price=src.awarded_price,
            currency="USD", payment_terms=PAYMENT_TERMS, price_tolerance_pct=PRICE_TOLERANCE_PCT,
            required_documents=docs,
        ))
    pr.status = "ordered"
    db.commit()
    db.refresh(po)
    return {"po": po_to_out(po), "reused": False}


@router.get("/api/prs/{pr_id}/po")
def get_po_for_pr(pr_id: str, db: Session = Depends(get_db)) -> dict:
    po = db.query(PurchaseOrder).filter(PurchaseOrder.pr_id == pr_id).first()
    if po is None:
        raise HTTPException(404, "No PO created from this PR yet")
    return po_to_out(po)


def _po_or_404(db: Session, po_number: str) -> PurchaseOrder:
    po = db.get(PurchaseOrder, po_number)
    if po is None:
        raise HTTPException(404, f"PO {po_number} not found")
    return po


@router.post("/api/pos/{po_number}/draft-email")
def draft_email(po_number: str, db: Session = Depends(get_db)) -> dict:
    """Agent drafts the supplier confirmation email (for human review, not auto-sent)."""
    po = _po_or_404(db, po_number)
    contract = db.get(Contract, po_number)
    amount = po.unit_price * po.expected_quantity
    po.supplier_email = build_supplier_email(po, amount, contract.payment_terms if contract else PAYMENT_TERMS)
    po.po_state = "email_drafted"
    db.commit()
    db.refresh(po)
    return po_to_out(po)


@router.post("/api/pos/{po_number}/send")
def send_po(po_number: str, db: Session = Depends(get_db)) -> dict:
    """Human sends the PO + confirmation request to the supplier."""
    po = _po_or_404(db, po_number)
    if not po.supplier_email:
        raise HTTPException(409, "Draft the supplier email first")
    po.po_state = "email_sent"
    db.commit()
    db.refresh(po)
    return po_to_out(po)


@router.post("/api/pos/{po_number}/confirm")
def confirm_po(po_number: str, db: Session = Depends(get_db)) -> dict:
    """Capture the supplier's confirmation (simulated) — including any document
    that will 'follow separately', which becomes a pre-receiving risk."""
    po = _po_or_404(db, po_number)
    po.confirmation = simulate_confirmation(po)
    po.po_state = "supplier_confirmed"
    db.commit()
    db.refresh(po)
    return po_to_out(po)
