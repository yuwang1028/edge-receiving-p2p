"""Sourcing / spot buying — between PR approval and PO creation. Runs a
deterministic 3-bid comparison over the supplier pool, recommends a winner, and a
human awards it (status 'awarded'), fixing the supplier + price the PO will use.

  POST /api/prs/{id}/source   run the 3-bid comparison (needs an approved PR)
  GET  /api/prs/{id}/sourcing latest sourcing result
  POST /api/prs/{id}/award    human awards (defaults to the recommendation)
"""

from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from ..agent.sourcing import source
from ..local_store.local_database import PurchaseRequisition, SourcingResult, get_db
from ..utils.id_generator import gen_id

router = APIRouter()


def _out(s: SourcingResult) -> dict:
    return {
        "id": s.id, "prId": s.pr_id, "category": s.category, "quantity": s.quantity,
        "bids": s.bids or [], "recommendedSupplier": s.recommended_supplier,
        "recommendedPrice": s.recommended_price, "recommendedAmount": s.recommended_amount,
        "awardedSupplier": s.awarded_supplier, "awardedPrice": s.awarded_price,
        "awardedAmount": s.awarded_amount, "rationale": s.rationale, "status": s.status,
    }


def _latest(db: Session, pr_id: str) -> SourcingResult | None:
    return (
        db.query(SourcingResult)
        .filter(SourcingResult.pr_id == pr_id)
        .order_by(SourcingResult.created_at.desc())
        .first()
    )


@router.post("/api/prs/{pr_id}/source")
def run_sourcing(pr_id: str, db: Session = Depends(get_db)) -> dict:
    pr = db.get(PurchaseRequisition, pr_id)
    if pr is None:
        raise HTTPException(404, f"PR {pr_id} not found")
    if pr.status == "draft":
        raise HTTPException(409, "Approve the requisition before sourcing it")

    result = source(pr.category, pr.quantity, pr.unit_price)
    row = SourcingResult(
        id=gen_id("src"), pr_id=pr_id, category=pr.category, quantity=pr.quantity,
        bids=result["bids"], recommended_supplier=result["recommended_supplier"],
        recommended_price=result["recommended_price"], recommended_amount=result["recommended_amount"],
        rationale=result["rationale"], status="recommended",
    )
    db.add(row)
    pr.status = "sourced"
    db.commit()
    db.refresh(row)
    return {"sourcing": _out(row), "prId": pr_id}


@router.get("/api/prs/{pr_id}/sourcing")
def get_sourcing(pr_id: str, db: Session = Depends(get_db)) -> dict:
    s = _latest(db, pr_id)
    if s is None:
        raise HTTPException(404, "No sourcing run for this PR yet")
    return _out(s)


@router.post("/api/prs/{pr_id}/award")
def award(pr_id: str, supplier: str = Body("", embed=True), db: Session = Depends(get_db)) -> dict:
    s = _latest(db, pr_id)
    if s is None:
        raise HTTPException(409, "Run sourcing before awarding")
    chosen = supplier.strip() or s.recommended_supplier
    bid = next((b for b in (s.bids or []) if b["supplier"] == chosen), None)
    if bid is None:
        raise HTTPException(422, f"{chosen!r} is not one of the bids")

    s.awarded_supplier = chosen
    s.awarded_price = bid["unitPrice"]
    s.awarded_amount = bid["amount"]
    s.status = "awarded"
    pr = db.get(PurchaseRequisition, pr_id)
    if pr is not None:
        pr.status = "awarded"
    db.commit()
    db.refresh(s)
    return {"sourcing": _out(s), "prId": pr_id}
