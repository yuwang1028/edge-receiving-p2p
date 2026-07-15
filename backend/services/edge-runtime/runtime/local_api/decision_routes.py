"""Human approval → executed actions → sealed audit package → queued sync event.
This is the governance core: the person decides, the edge records an immutable
local audit record, and only a slim structured event is queued for the cloud."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..local_store import sync_queue
from ..sync import sync_worker
from ..local_store.local_database import (
    AuditRecord,
    Decision,
    Extraction,
    GoodsReceipt,
    PurchaseOrder,
    ReceivingCase,
    get_db,
)
from ..settings import settings
from ..utils.id_generator import gen_id
from ..utils.local_time import now_iso, utcnow
from . import extraction_to_internal, po_to_internal

router = APIRouter()


class ApproveIn(BaseModel):
    decision: str = "approved"  # approved | rejected | escalated | held
    approver: str = "Receiving supervisor"


def _auto_actions(decision: str, po, x: Extraction, evaluation: dict) -> list[str]:
    if decision != "approved":
        return [f"Delivery {decision} — no goods receipt posted"]
    unit = x.unit or (po.unit if po else "")
    usable = max(x.detected_quantity - x.damaged_cartons, 0)
    expected = po.expected_quantity if po else usable
    receive_qty = min(usable, expected)
    actions = [f"Created goods receipt for {receive_qty} {unit}"]
    if evaluation.get("qualityHold") and x.damaged_cartons:
        actions.append(f"Moved {x.damaged_cartons} {unit} to quality hold")
    if evaluation.get("invoiceHold"):
        actions.append("Blocked the invoice difference")
    if x.documents_missing:
        actions.append("Requested missing document(s): " + ", ".join(x.documents_missing))
    actions.append("Created supplier exception package")
    actions.append("Notified finance and procurement")
    return actions


@router.post("/api/cases/{case_id}/approve")
def approve(case_id: str, body: ApproveIn, db: Session = Depends(get_db)) -> dict:
    import audit_event_builder
    import audit_package_generator
    import local_audit_store

    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    x = (
        db.query(Extraction)
        .filter(Extraction.case_id == case_id)
        .order_by(Extraction.created_at.desc())
        .first()
    )
    if x is None or not case.evaluation:
        raise HTTPException(409, "Run extraction + evaluation before approval")

    po = db.get(PurchaseOrder, case.po_number)
    evaluation = case.evaluation
    actions = _auto_actions(body.decision, po, x, evaluation)
    approved_at = now_iso()

    decision_id = gen_id("dec")
    decision_row = Decision(
        id=decision_id,
        case_id=case_id,
        recommended=evaluation,
        human_decision=body.decision,
        approver=body.approver,
        auto_actions=actions,
        approved_at=utcnow(),
    )
    db.add(decision_row)

    package = audit_package_generator.build_package(
        decision_id=decision_id,
        case={"id": case.id, "title": case.title},
        po=po_to_internal(po),
        evidence=[
            {"kind": e.kind, "filename": e.filename, "sha256": e.sha256} for e in case.evidence
        ],
        extraction=extraction_to_internal(x),
        evaluation=evaluation,
        decision={
            "human_decision": body.decision,
            "approver": body.approver,
            "auto_actions": actions,
            "approved_at": approved_at,
        },
        device_id=settings.device_id,
        site_id=settings.site_id,
        generated_at=approved_at,
    )

    package_uri = local_audit_store.save_package(package, settings.storage_dir)
    db.add(AuditRecord(decision_id=decision_id, case_id=case_id, package_uri=package_uri, package=package))

    sync_event = audit_event_builder.build_sync_event(package)
    queued = sync_queue.enqueue(db, sync_event["event_type"], sync_event)

    # Post the REAL goods receipt — the input to the downstream four-way match.
    if body.decision == "approved":
        ordered = po.expected_quantity if po else 0
        received = x.detected_quantity
        damaged = x.damaged_cartons
        accepted = max(min(received - damaged, ordered) if ordered else received - damaged, 0)
        gr = db.query(GoodsReceipt).filter(GoodsReceipt.case_id == case_id).first()
        if gr is None:
            gr = GoodsReceipt(id=gen_id("gr"), case_id=case_id)
            db.add(gr)
        gr.po_number = case.po_number
        gr.decision_id = decision_id
        gr.ordered_quantity = ordered
        gr.received_quantity = received
        gr.accepted_quantity = accepted
        gr.damaged_quantity = damaged
        gr.over_quantity = max(received - ordered, 0) if ordered else 0
        gr.documents_missing = x.documents_missing or []

    case.status = "approved" if body.decision == "approved" else body.decision
    db.commit()

    # Best-effort immediate sync: if a control plane is reachable, push now;
    # otherwise it stays queued and the background flusher drains it later.
    try:
        sync_result = sync_worker.flush(db)
    except Exception:
        sync_result = {"online": False, "error": True}

    return {
        "decisionId": decision_id,
        "caseId": case_id,
        "humanDecision": body.decision,
        "approver": body.approver,
        "autoActions": actions,
        "auditUri": package_uri,
        "syncEventId": queued.id,
        "sync": sync_result,
        "mode": settings.mode,
    }
