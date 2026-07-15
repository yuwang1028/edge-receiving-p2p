"""PR processing — upstream of sourcing/PO. A natural-language need is turned into
a structured, compliant purchase requisition by the PR agent loop (catalog +
supplier-pool + contract tool lookups), then a human approves it.

  POST /api/prs              create a PR from a NL need (runs the agent loop)
  GET  /api/prs              list requisitions
  GET  /api/prs/{id}         one requisition
  POST /api/prs/{id}/approve human approves → status 'approved' (ready to source)
"""

from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..agent.pr_agent import create_pr
from ..local_store.local_database import PurchaseRequisition, get_db
from ..utils.id_generator import gen_id

router = APIRouter()


def _pr_out(pr: PurchaseRequisition) -> dict:
    return {
        "id": pr.id, "rawRequest": pr.raw_request, "requester": pr.requester, "plant": pr.plant,
        "material": pr.material, "materialCode": pr.material_code, "category": pr.category,
        "quantity": pr.quantity, "unit": pr.unit, "estUnitPrice": pr.unit_price, "estValue": pr.amount,
        "budgetOk": pr.budget_ok, "prType": pr.pr_type, "purchOrg": pr.purch_org,
        "purchGroup": pr.purch_group, "costCenter": pr.cost_center, "glAccount": pr.gl_account,
        "justification": pr.justification, "reasoning": pr.reasoning, "status": pr.status,
    }


class PRIn(BaseModel):
    request: str
    requester: str = "Plant requester"
    plant: str = "Heidelberg"


@router.post("/api/prs")
def create(body: PRIn, db: Session = Depends(get_db)) -> dict:
    if not body.request.strip():
        raise HTTPException(422, "request (the need) is required")
    fields = create_pr(body.request, body.plant)
    pr = PurchaseRequisition(
        id=gen_id("pr"), raw_request=body.request, requester=body.requester, plant=body.plant,
        material=fields["material"], material_code=fields["material_code"], category=fields["category"],
        quantity=fields["quantity"], unit=fields["unit"], unit_price=fields["unit_price"], amount=fields["amount"],
        budget_ok=fields["budget_ok"], pr_type=fields["pr_type"], purch_org=fields["purch_org"],
        purch_group=fields["purch_group"], cost_center=fields["cost_center"], gl_account=fields["gl_account"],
        justification=fields["justification"], reasoning=fields["reasoning"], status="draft",
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return {
        "pr": _pr_out(pr),
        "source": fields.get("source", ""),
        "confidence": fields.get("confidence", 0.0),
        "flags": fields.get("flags", []),
        "masterData": fields.get("master_data", {}),
        "matchedCodes": fields.get("matched_codes", {}),
    }


@router.get("/api/prs")
def list_prs(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(PurchaseRequisition).order_by(PurchaseRequisition.created_at.desc()).all()
    return [_pr_out(p) for p in rows]


@router.get("/api/prs/{pr_id}")
def get_pr(pr_id: str, db: Session = Depends(get_db)) -> dict:
    pr = db.get(PurchaseRequisition, pr_id)
    if pr is None:
        raise HTTPException(404, f"PR {pr_id} not found")
    return _pr_out(pr)


@router.post("/api/prs/{pr_id}/approve")
def approve_pr(pr_id: str, approver: str = Body("Procurement lead", embed=True), db: Session = Depends(get_db)) -> dict:
    pr = db.get(PurchaseRequisition, pr_id)
    if pr is None:
        raise HTTPException(404, f"PR {pr_id} not found")
    pr.status = "approved"
    db.commit()
    db.refresh(pr)
    return {"pr": _pr_out(pr), "approver": approver}


@router.delete("/api/prs/{pr_id}")
def delete_pr(pr_id: str, db: Session = Depends(get_db)) -> dict:
    pr = db.get(PurchaseRequisition, pr_id)
    if pr is None:
        raise HTTPException(404, f"PR {pr_id} not found")
    db.delete(pr)
    db.commit()
    return {"deleted": pr_id}
