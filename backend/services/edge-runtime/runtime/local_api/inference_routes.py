"""On-device extraction + rules evaluation. `extract` runs the inference provider
over the case's evidence; `evaluate` runs the deterministic rules engine. Both
persist so the dashboard and the eventual audit package read consistent state."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..inference import run_extraction
from ..local_store.local_database import Extraction, PurchaseOrder, ReceivingCase, get_db
from ..settings import settings
from ..utils.id_generator import gen_id
from . import (
    evidence_to_internal,
    extraction_to_internal,
    extraction_to_out,
    po_to_internal,
)

router = APIRouter()


def _latest_extraction(db: Session, case_id: str) -> Extraction | None:
    return (
        db.query(Extraction)
        .filter(Extraction.case_id == case_id)
        .order_by(Extraction.created_at.desc())
        .first()
    )


@router.post("/api/cases/{case_id}/extract")
def extract(case_id: str, db: Session = Depends(get_db)) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    po = db.get(PurchaseOrder, case.po_number)
    po_internal = po_to_internal(po)
    if po_internal is None:
        raise HTTPException(409, f"No PO {case.po_number} in local cache")

    evidence = [evidence_to_internal(e) for e in case.evidence]
    result = run_extraction(po_internal, evidence)

    row = Extraction(
        id=gen_id("xtr"),
        case_id=case_id,
        provider=result.get("provider", settings.infer_provider),
        model=result.get("model", ""),
        escalated_from=result.get("escalated_from", ""),
        po_number=result.get("po_number", ""),
        supplier=result.get("supplier", ""),
        material=result.get("material", ""),
        detected_quantity=result.get("detected_quantity", 0),
        unit=result.get("unit", ""),
        damaged_cartons=result.get("damaged_cartons", 0),
        damage_summary=result.get("damage_summary", ""),
        lot_number=result.get("lot_number", ""),
        documents_found=result.get("documents_found", []),
        documents_missing=result.get("documents_missing", []),
        confidence=result.get("confidence", 0.0),
        fields=result.get("fields", []),
    )
    db.add(row)
    case.status = "extracted"
    db.commit()
    db.refresh(row)
    return extraction_to_out(row)


@router.post("/api/cases/{case_id}/evaluate")
def evaluate(case_id: str, db: Session = Depends(get_db)) -> dict:
    import engine  # rules-engine (on sys.path via runtime bootstrap)

    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    x = _latest_extraction(db, case_id)
    if x is None:
        raise HTTPException(409, "Run extraction before evaluation")

    po = db.get(PurchaseOrder, case.po_number)
    result = engine.evaluate(
        po_to_internal(po),
        extraction_to_internal(x),
        threshold=settings.confidence_threshold,
        case_id=case_id,
    )
    case.evaluation = result
    case.status = "evaluated"
    db.commit()
    return result
