"""Top-level router: composes the loop sub-routers (health · capture · inference ·
decision) and adds read endpoints (POs, cases, audit) plus the offline sync
queue inspection/flush."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from fastapi import Body

from ..local_store import sync_queue
from ..local_store.local_database import (
    AuditRecord,
    Evidence,
    PurchaseOrder,
    ReceivingCase,
    get_db,
)
from ..mode import get_mode, label as mode_label, list_modes, set_mode, sync_enabled, use_vertex_assist
from ..settings import settings
from ..sync import sync_worker
from ..utils.id_generator import gen_id
from . import capture_routes, chat_routes, decision_routes, health_routes, inference_routes, p2p_routes, po_routes, pr_routes, sourcing_routes
from . import case_to_out, evidence_to_out, po_to_out

router = APIRouter()

router.include_router(health_routes.router)
router.include_router(capture_routes.router)
router.include_router(inference_routes.router)
router.include_router(decision_routes.router)
router.include_router(p2p_routes.router)
router.include_router(pr_routes.router)
router.include_router(sourcing_routes.router)
router.include_router(po_routes.router)
router.include_router(chat_routes.router)


def _evidence_count(db: Session, case_id: str) -> int:
    return db.query(Evidence).filter(Evidence.case_id == case_id).count()


@router.get("/api/pos")
def list_pos(db: Session = Depends(get_db)) -> list[dict]:
    return [po_to_out(p) for p in db.query(PurchaseOrder).all()]


@router.get("/api/pos/{po_number}")
def get_po(po_number: str, db: Session = Depends(get_db)) -> dict:
    po = db.get(PurchaseOrder, po_number)
    if po is None:
        raise HTTPException(404, f"PO {po_number} not found")
    return po_to_out(po)


@router.get("/api/cases")
def list_cases(db: Session = Depends(get_db)) -> list[dict]:
    cases = db.query(ReceivingCase).order_by(ReceivingCase.created_at.desc()).all()
    return [case_to_out(c, _evidence_count(db, c.id)) for c in cases]


@router.post("/api/cases")
def create_case(poNumber: str = Body(..., embed=True), db: Session = Depends(get_db)) -> dict:
    """Open a new receiving case (an inbound delivery) against a PO — the seam
    that lets a PO created upstream (PR → sourcing → PO) be received at the dock."""
    po = db.get(PurchaseOrder, poNumber)
    if po is None:
        raise HTTPException(404, f"PO {poNumber} not found")
    case = ReceivingCase(
        id=gen_id("rc"), po_number=poNumber, plant=po.plant,
        title=f"{po.supplier} delivery · {po.material}",
        summary=f"Inbound against PO {poNumber} — awaiting edge analysis.",
        status="received",
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case_to_out(case, 0)


@router.get("/api/cases/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    out = case_to_out(case, _evidence_count(db, case_id))
    out["evidence"] = [evidence_to_out(e) for e in case.evidence]
    return out


@router.get("/api/cases/{case_id}/audit")
def get_audit(case_id: str, db: Session = Depends(get_db)) -> dict:
    rec = (
        db.query(AuditRecord)
        .filter(AuditRecord.case_id == case_id)
        .order_by(AuditRecord.created_at.desc())
        .first()
    )
    if rec is None:
        raise HTTPException(404, "No audit package for this case yet")
    return rec.package


@router.get("/api/sync/queue")
def sync_queue_status(db: Session = Depends(get_db)) -> dict:
    pending = sync_queue.list_pending(db)
    return {
        "pending": len(pending),
        "events": [
            {"id": e.id, "type": e.event_type, "status": e.status, "createdAt": e.created_at.isoformat()}
            for e in pending
        ],
    }


@router.post("/api/sync/flush")
def sync_flush(db: Session = Depends(get_db)) -> dict:
    return sync_worker.flush(db)


@router.get("/api/engines")
def engines() -> dict:
    """Which engine/model runs each step RIGHT NOW — the architecture made visible.

    Principle: AI only EXTRACTS evidence or ASSISTS; the DECISIONS (match, hold,
    pay) are a deterministic rules engine + human approval — never a model. Vertex
    is optional (enhances assist tasks); the loop stands without it."""
    vertex = use_vertex_assist()
    # The assist/extract LLM: Vertex when the mode opts in, else on-device Ollama.
    a_engine, a_model = ("Vertex AI", settings.vertex_model) if vertex else ("Ollama · on-device", settings.local_chat_model)

    prov = settings.infer_provider
    extract = {
        "classical": ("Classical pipeline · on-device", "OCR · barcode · YOLO"),
        "vertex": ("Vertex AI", settings.vertex_model),
        "local": ("Local VLM · on-device", settings.local_llm_model),
    }.get(prov, ("Mock", "canned"))

    steps = [
        {"step": "pr_processing", "label": "PR processing", "engine": a_engine, "model": a_model,
         "kind": "ai-extract", "status": "live", "note": "LLM reads the NL need → catalog material + quantity. No supplier (that's sourcing); value is a catalog estimate."},
        {"step": "sourcing", "label": "Sourcing / spot buy", "engine": "Rules engine", "model": None,
         "kind": "rules", "status": "live", "note": "3-bid comparison scored on price·lead·risk·contract (deterministic)."},
        {"step": "po", "label": "PO management", "engine": "Rules engine", "model": None,
         "kind": "rules", "status": "live", "note": "PO + framework contract created from the awarded PR (deterministic)."},
        {"step": "receiving", "label": "Receiving extraction", "engine": extract[0], "model": extract[1],
         "kind": "ai-extract", "status": "live", "note": "Extracts evidence only (qty, lot, damage, docs). Images never leave the device."},
        {"step": "invoice_idp", "label": "Invoice IDP", "engine": "Classical OCR · on-device", "model": "Tesseract + regex",
         "kind": "ai-extract", "status": "live", "note": "Reads billed qty / unit price / amount from the invoice document."},
        {"step": "match", "label": "Four-way match", "engine": "Rules engine", "model": None,
         "kind": "rules", "status": "live", "note": "THE decision (payable vs blocked) — deterministic, no model."},
        {"step": "payment", "label": "Payment", "engine": "Rules + human approval", "model": None,
         "kind": "rules", "status": "live", "note": "Released by a human per the match — no model decides to pay."},
        {"step": "copilot", "label": "Per-console copilot", "engine": a_engine, "model": a_model,
         "kind": "ai-assist", "status": "live", "note": "Explains / summarizes / recommends. Proposes, never executes."},
    ]
    return {"mode": get_mode(), "syncEnabled": sync_enabled(), "vertexAssist": vertex, "vertexRequired": False, "steps": steps}


@router.get("/api/mode")
def read_mode() -> dict:
    return {"mode": get_mode(), "label": mode_label(), "syncEnabled": sync_enabled(), "vertexAssist": use_vertex_assist(), "modes": list_modes()}


@router.post("/api/mode")
def write_mode(mode: str = Body(..., embed=True), db: Session = Depends(get_db)) -> dict:
    """Flip offline ⇄ gcp at runtime. Switching to gcp triggers a flush of any
    events queued while offline."""
    try:
        set_mode(mode)
    except ValueError as e:
        raise HTTPException(400, str(e))
    result = {"mode": get_mode(), "syncEnabled": sync_enabled()}
    if sync_enabled():
        try:
            result["flushed"] = sync_worker.flush(db)
        except Exception:
            result["flushed"] = {"error": True}
    return result
