"""Per-console copilots — built on the shared agent loop (runtime/agent/loop.py).

Each console gets a persona = a system prompt + a tool set; everything else (the
reason→tool→observe loop, mode-aware local/Vertex, propose-not-execute) is shared.
Adding a copilot to another console = one entry in PERSONAS. Tools are read/propose
only; the actual money action goes through the guarded /pay endpoint + confirm."""

from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..agent.loop import run_ollama_agent, run_vertex_agent
from ..local_store.local_database import (
    Contract,
    Extraction,
    GoodsReceipt,
    Invoice,
    MatchResult,
    Payment,
    PurchaseOrder,
    ReceivingCase,
    get_db,
)
from ..mode import use_vertex_assist

router = APIRouter()

# ── Read helpers (the tools query these) ────────────────────────────────────

def _receiving_facts(db: Session, case: ReceivingCase) -> dict:
    po = db.get(PurchaseOrder, case.po_number)
    x = db.query(Extraction).filter(Extraction.case_id == case.id).order_by(Extraction.created_at.desc()).first()
    gr = db.query(GoodsReceipt).filter(GoodsReceipt.case_id == case.id).first()
    return {
        "case": {"id": case.id, "status": case.status, "plant": case.plant, "po_number": case.po_number},
        "purchase_order": ({"ordered": po.expected_quantity, "unit": po.unit, "material": po.material, "supplier": po.supplier, "unit_price": po.unit_price, "required_documents": po.required_documents} if po else None),
        "extraction": ({"provider": x.provider, "detected_quantity": x.detected_quantity, "damaged_cartons": x.damaged_cartons, "lot_number": x.lot_number, "documents_found": x.documents_found, "documents_missing": x.documents_missing, "confidence": x.confidence} if x else None),
        "evaluation": case.evaluation or None,
        "goods_receipt": ({"ordered": gr.ordered_quantity, "received": gr.received_quantity, "accepted": gr.accepted_quantity, "damaged": gr.damaged_quantity, "over": gr.over_quantity, "documents_missing": gr.documents_missing} if gr else None),
    }


def _invoice_match(db: Session, case: ReceivingCase) -> dict:
    inv = db.query(Invoice).filter(Invoice.po_number == case.po_number).first()
    m = db.query(MatchResult).filter(MatchResult.case_id == case.id).order_by(MatchResult.created_at.desc()).first()
    p = db.query(Payment).filter(Payment.case_id == case.id).order_by(Payment.decided_at.desc()).first()
    return {
        "invoice": ({"id": inv.id, "billed_quantity": inv.billed_quantity, "unit_price": inv.unit_price, "amount": inv.amount, "status": inv.status} if inv else None),
        "four_way_match": ({"status": m.status, "payable_amount": m.payable_amount, "blocked_amount": m.blocked_amount, "checks": m.checks, "recommended": m.recommended} if m else "not run yet"),
        "payment": ({"status": p.status, "released_amount": p.released_amount, "blocked_amount": p.blocked_amount} if p else "not released yet"),
    }


def _contract_terms(db: Session, case: ReceivingCase) -> dict:
    c = db.get(Contract, case.po_number)
    if not c:
        return {"contract": None}
    return {"contract": {"supplier": c.supplier, "unit_price": c.unit_price, "currency": c.currency, "payment_terms": c.payment_terms, "price_tolerance_pct": c.price_tolerance_pct, "required_documents": c.required_documents}}


# ── Tool specs (defined once; personas pick a subset) ───────────────────────

def _spec(name: str, desc: str) -> dict:
    return {"type": "function", "function": {"name": name, "description": desc, "parameters": {"type": "object", "properties": {}}}}

TOOL_SPECS = {
    "get_receiving_facts": _spec("get_receiving_facts", "Goods-receipt facts: PO, AI-extracted fields, risk evaluation, accepted/damaged/over quantities, missing documents."),
    "get_invoice_and_match": _spec("get_invoice_and_match", "Supplier invoice, four-way match (checks, payable vs blocked), and payment status."),
    "get_contract_terms": _spec("get_contract_terms", "Contract terms for the PO: unit price, payment terms, price tolerance, required documents."),
    "propose_release_payment": _spec("propose_release_payment", "Propose releasing payment per the four-way match. Does NOT execute — a human confirms."),
}

# ── Personas (system prompt + tool set) ─────────────────────────────────────

_RULES = (
    " Use the tools to look up real numbers before answering — never guess. Be concise (1-3 "
    "sentences) and cite the numbers. You explain and recommend only; you never execute. Call "
    "propose_release_payment ONLY when the user explicitly asks to release/approve/pay — never for "
    "'why/what/how much' questions (a human confirms the action)."
)
PERSONAS = {
    "receiving": {
        "system": "You are the receiving copilot for a goods-receipt desk, helping the operator with THIS receiving case." + _RULES,
        "tools": ["get_receiving_facts", "get_invoice_and_match", "propose_release_payment"],
    },
    "invoice": {
        "system": (
            "You are the invoice-resolution copilot for AP/finance, helping the controller resolve THIS "
            "supplier invoice via the four-way match (contract vs PO vs goods receipt vs invoice). Focus on "
            "over-billing, price-vs-contract, payment terms, and missing documents." + _RULES
        ),
        "tools": ["get_invoice_and_match", "get_contract_terms", "get_receiving_facts", "propose_release_payment"],
    },
}


class ChatIn(BaseModel):
    messages: list[dict]
    agent: str = "receiving"


@router.post("/api/cases/{case_id}/chat")
def case_chat(case_id: str, body: ChatIn, db: Session = Depends(get_db)) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")

    persona = PERSONAS.get(body.agent, PERSONAS["receiving"])
    proposed = {"value": None}

    def get_receiving_facts() -> dict:
        """Goods-receipt facts for this case."""
        return _receiving_facts(db, case)

    def get_invoice_and_match() -> dict:
        """Supplier invoice, four-way match, payment status."""
        return _invoice_match(db, case)

    def get_contract_terms() -> dict:
        """Contract terms for the PO."""
        return _contract_terms(db, case)

    def propose_release_payment() -> str:
        """Propose releasing payment per the match. Does not execute; a human confirms."""
        proposed["value"] = "release_payment"
        return "Payment release proposed — awaiting human confirmation."

    all_impls = {
        "get_receiving_facts": get_receiving_facts,
        "get_invoice_and_match": get_invoice_and_match,
        "get_contract_terms": get_contract_terms,
        "propose_release_payment": propose_release_payment,
    }
    specs = [TOOL_SPECS[t] for t in persona["tools"]]
    impls = {t: all_impls[t] for t in persona["tools"]}
    system = persona["system"]
    messages = [{"role": "system", "content": system}] + [
        {"role": m.get("role", "user"), "content": m.get("content", "")} for m in body.messages
    ]

    try:
        if use_vertex_assist():
            reply = run_vertex_agent(system, messages, list(impls.values()))
        else:
            reply = run_ollama_agent(messages, specs, impls)
    except Exception:
        reply = run_ollama_agent(messages, specs, impls)

    # Surface the action only when the model proposed it AND the user actually asked
    # to act — a deterministic guard against the small model's over-eager tool calls.
    last_user = next((m.get("content", "") for m in reversed(body.messages) if m.get("role") == "user"), "")
    wants = bool(re.search(r"\b(release|approve|settle|pay)\b", last_user.lower()) or "go ahead" in last_user.lower())
    action = (
        {"action": "release_payment", "label": "Release payment per match"}
        if proposed["value"] == "release_payment" and wants else None
    )
    return {"reply": reply, "proposedAction": action}
