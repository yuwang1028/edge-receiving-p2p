"""The money loop — downstream of the receiving decision: four-way match →
invoice hold/release → payment. Uses the REAL goods receipt posted on approval.

  POST /api/cases/{id}/match    run the four-way match (needs an approved GR)
  POST /api/cases/{id}/pay      human releases payment per the match
  GET  /api/cases/{id}/p2p      aggregate: GR + invoice + match + payment
"""

from __future__ import annotations

import pathlib

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..inference.invoice_idp import extract_invoice
from ..local_store.local_database import (
    Contract,
    Evidence,
    GoodsReceipt,
    Invoice,
    MatchResult,
    Payment,
    PurchaseOrder,
    ReceivingCase,
    get_db,
)
from ..p2p.match_engine import four_way
from ..settings import settings
from ..utils.id_generator import gen_id

router = APIRouter()


def _gr_out(g: GoodsReceipt) -> dict:
    return {
        "id": g.id, "poNumber": g.po_number, "decisionId": g.decision_id,
        "ordered": g.ordered_quantity, "received": g.received_quantity,
        "accepted": g.accepted_quantity, "damaged": g.damaged_quantity,
        "over": g.over_quantity, "documentsMissing": g.documents_missing or [],
    }


def _inv_out(i: Invoice) -> dict:
    return {
        "id": i.id, "poNumber": i.po_number, "supplier": i.supplier,
        "billedQuantity": i.billed_quantity, "unitPrice": i.unit_price,
        "amount": i.amount, "currency": i.currency, "status": i.status,
    }


def _match_out(m: MatchResult) -> dict:
    return {
        "id": m.id, "status": m.status, "checks": m.checks or [],
        "payableAmount": m.payable_amount, "blockedAmount": m.blocked_amount,
        "recommended": m.recommended or [],
    }


def _pay_out(p: Payment) -> dict:
    return {
        "id": p.id, "status": p.status, "releasedAmount": p.released_amount,
        "blockedAmount": p.blocked_amount, "decidedBy": p.decided_by,
    }


def _latest(db, model, case_id):
    ts = getattr(model, "created_at", None)
    if ts is None:
        ts = getattr(model, "decided_at")
    return db.query(model).filter(model.case_id == case_id).order_by(ts.desc()).first()


@router.post("/api/cases/{case_id}/invoice")
async def upload_invoice(case_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict:
    """Ingest a supplier-invoice document → IDP-extract → create the real Invoice
    (no seed). Amounts come from the document, not a hardcoded dict."""
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")

    out_dir = pathlib.Path(settings.storage_dir) / "invoices" / case_id
    out_dir.mkdir(parents=True, exist_ok=True)
    dest = out_dir / (file.filename or "invoice")
    dest.write_bytes(await file.read())

    fields = extract_invoice(str(dest.resolve()))
    po_number = fields.get("po_number") or case.po_number

    inv = db.query(Invoice).filter(Invoice.po_number == po_number).first()
    if inv is None:
        inv = Invoice(id=fields.get("invoice_no") or gen_id("inv"))
        db.add(inv)
    inv.po_number = po_number
    inv.supplier = fields.get("supplier") or inv.supplier or ""
    inv.billed_quantity = fields.get("billed_quantity", 0)
    inv.unit_price = fields.get("unit_price", 0.0)
    inv.amount = fields.get("amount", 0.0)
    inv.currency = "USD"
    inv.status = "received"
    inv.doc_path = str(dest.resolve())
    db.commit()
    db.refresh(inv)
    return {"invoice": _inv_out(inv), "extracted": fields}


@router.post("/api/cases/{case_id}/invoice/simulate")
def simulate_invoice(case_id: str, db: Session = Depends(get_db)) -> dict:
    """Supplier invoice arrives via EDI (structured) rather than a scanned doc —
    creates the Invoice from the PO so any PO can complete the match. The hero PO
    keeps the scanned-document → IDP path on the Invoice console."""
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    po = db.get(PurchaseOrder, case.po_number)
    if po is None:
        raise HTTPException(404, f"PO {case.po_number} not found")

    inv = db.query(Invoice).filter(Invoice.po_number == case.po_number).first()
    if inv is None:
        import re as _re
        prefix = (_re.sub(r"[^A-Z]", "", po.supplier.upper())[:3]) or "SUP"
        inv = Invoice(id=f"INV-{prefix}-{case.po_number[-4:]}")
        db.add(inv)
    # The supplier invoices what they SHIPPED (the received qty), not the ordered qty —
    # so an over-delivery surfaces as over-billing vs the accepted goods.
    gr = db.query(GoodsReceipt).filter(GoodsReceipt.po_number == case.po_number).first()
    billed = gr.received_quantity if gr and gr.received_quantity else po.expected_quantity
    inv.po_number = case.po_number
    inv.supplier = po.supplier
    inv.billed_quantity = billed
    inv.unit_price = po.unit_price
    inv.amount = round(billed * po.unit_price, 2)
    inv.currency = "USD"
    inv.status = "received"
    db.commit()
    db.refresh(inv)
    return {"invoice": _inv_out(inv), "source": "edi"}


@router.post("/api/cases/{case_id}/damage/annotate")
def annotate_damage_route(case_id: str, force: bool = False, db: Session = Depends(get_db)) -> dict:
    """Box the damaged cartons on this case's damage photo. Deterministic — the boxes
    are pinned (a trained YOLO would replace them), so the demo always shows the same
    2 boxes. Result is cached per case; pass ?force=true to re-render."""
    import json as _json

    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")

    out_dir = pathlib.Path(settings.storage_dir) / "damage" / case_id
    out = out_dir / "boxed.png"
    meta = out_dir / "boxed.json"
    if out.exists() and meta.exists() and not force:
        cached = _json.loads(meta.read_text())
        return {"count": cached["count"], "model": cached["model"], "boxedUrl": f"/api/cases/{case_id}/damage/boxed", "cached": True}

    ev = (
        db.query(Evidence)
        .filter(Evidence.case_id == case_id, Evidence.kind == "damage")
        .order_by(Evidence.uploaded_at.desc())
        .first()
    )
    if ev is None or not (ev.orig_path or ev.norm_path):
        raise HTTPException(404, "No damage photo on this case")

    from ..inference.damage_boxes import annotate_damage
    from ..local_store.local_database import Extraction

    # Cap boxes at the received quantity (can't damage more than was received).
    x = db.query(Extraction).filter(Extraction.case_id == case_id).order_by(Extraction.created_at.desc()).first()
    cap = x.detected_quantity if x and x.detected_quantity else None

    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        res = annotate_damage(ev.orig_path or ev.norm_path, str(out), cap=cap)
    except Exception as e:
        raise HTTPException(502, f"VLM damage detection failed: {e}")
    meta.write_text(_json.dumps({"count": res["count"], "model": res["model"]}))
    return {"count": res["count"], "model": res["model"], "boxedUrl": f"/api/cases/{case_id}/damage/boxed", "cached": False}


@router.get("/api/cases/{case_id}/damage/boxed")
def damage_boxed(case_id: str):
    out = pathlib.Path(settings.storage_dir) / "damage" / case_id / "boxed.png"
    if not out.exists():
        raise HTTPException(404, "No boxed damage image — run annotate first")
    return FileResponse(str(out), media_type="image/png")


@router.get("/api/cases/{case_id}/invoice/image")
def invoice_image(case_id: str, db: Session = Depends(get_db)):
    """Serve the actual invoice document the IDP read, so it can be viewed."""
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    inv = db.query(Invoice).filter(Invoice.po_number == case.po_number).first()
    if inv is None or not inv.doc_path:
        raise HTTPException(404, "No invoice document on file")
    media = "image/svg+xml" if inv.doc_path.lower().endswith(".svg") else "application/octet-stream"
    if inv.doc_path.lower().endswith((".png", ".jpg", ".jpeg")):
        media = "image/png"
    return FileResponse(inv.doc_path, media_type=media)


@router.post("/api/cases/{case_id}/match")
def run_match(case_id: str, db: Session = Depends(get_db)) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    gr = db.query(GoodsReceipt).filter(GoodsReceipt.case_id == case_id).first()
    if gr is None:
        raise HTTPException(409, "Approve the receiving decision first (no goods receipt yet)")
    po = db.get(PurchaseOrder, case.po_number)
    contract = db.get(Contract, case.po_number)
    invoice = db.query(Invoice).filter(Invoice.po_number == case.po_number).first()
    if invoice is None or contract is None:
        raise HTTPException(409, "No invoice/contract on file for this PO")

    result = four_way(
        contract={"unit_price": contract.unit_price, "price_tolerance_pct": contract.price_tolerance_pct, "payment_terms": contract.payment_terms},
        po={"unit_price": po.unit_price if po else contract.unit_price},
        gr={"accepted_quantity": gr.accepted_quantity, "documents_missing": gr.documents_missing or []},
        invoice={"billed_quantity": invoice.billed_quantity, "unit_price": invoice.unit_price},
    )

    row = MatchResult(
        id=gen_id("mat"), case_id=case_id, po_number=case.po_number,
        invoice_id=invoice.id, gr_id=gr.id, status=result["status"],
        checks=result["checks"], payable_amount=result["payable_amount"],
        blocked_amount=result["blocked_amount"], recommended=result["recommended"],
    )
    db.add(row)
    invoice.status = "held" if result["status"] == "hold" else "matched"
    db.commit()
    db.refresh(row)
    return {"match": _match_out(row), "invoice": _inv_out(invoice), "goodsReceipt": _gr_out(gr)}


@router.post("/api/cases/{case_id}/pay")
def release_payment(
    case_id: str, decidedBy: str = Body("AP controller", embed=True), db: Session = Depends(get_db)
) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    match = _latest(db, MatchResult, case_id)
    if match is None:
        raise HTTPException(409, "Run the four-way match first")
    invoice = db.query(Invoice).filter(Invoice.po_number == case.po_number).first()

    # Soft-exception policy: pay for what was ACCEPTED, block only the over-billed
    # amount. Missing documents / price flags hold the invoice for review (status)
    # but don't stop the accepted-goods release. A clean match pays in full.
    blocked = match.blocked_amount
    released = match.payable_amount
    if blocked > 0:
        status, inv_status = "partial", "partial"
    elif match.status == "hold":
        # under review (e.g. missing document) but nothing over-billed to block
        status, inv_status = "partial", "held"
    else:
        status, inv_status = "scheduled", "paid"

    pay = Payment(
        id=gen_id("pay"), case_id=case_id, po_number=case.po_number,
        invoice_id=match.invoice_id, status=status,
        released_amount=released, blocked_amount=blocked, decided_by=decidedBy,
    )
    db.add(pay)
    if invoice is not None:
        invoice.status = inv_status
    db.commit()
    db.refresh(pay)
    return {"payment": _pay_out(pay), "invoice": _inv_out(invoice) if invoice else None}


@router.get("/api/cases/{case_id}/p2p")
def p2p_state(case_id: str, db: Session = Depends(get_db)) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    gr = db.query(GoodsReceipt).filter(GoodsReceipt.case_id == case_id).first()
    invoice = db.query(Invoice).filter(Invoice.po_number == case.po_number).first()
    match = _latest(db, MatchResult, case_id)
    pay = _latest(db, Payment, case_id)
    po = db.get(PurchaseOrder, case.po_number)
    contract = db.get(Contract, case.po_number)
    return {
        "caseId": case.id,
        "purchaseOrder": (
            {"poNumber": po.po_number, "supplier": po.supplier, "material": po.material,
             "ordered": po.expected_quantity, "unit": po.unit, "unitPrice": po.unit_price}
            if po else None
        ),
        "contract": (
            {"unitPrice": contract.unit_price, "currency": contract.currency,
             "paymentTerms": contract.payment_terms, "priceTolerancePct": contract.price_tolerance_pct,
             "requiredDocuments": contract.required_documents or []}
            if contract else None
        ),
        "goodsReceipt": _gr_out(gr) if gr else None,
        "invoice": _inv_out(invoice) if invoice else None,
        "match": _match_out(match) if match else None,
        "payment": _pay_out(pay) if pay else None,
    }
