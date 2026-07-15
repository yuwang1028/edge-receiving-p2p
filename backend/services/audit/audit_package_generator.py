"""Assembles the full, self-contained audit package for one decision — the
artifact that makes this product governable, not just an image recognizer.
Contains evidence HASHES (never images), the extraction, the rules evaluation,
the human decision, the executed actions, and the ordered trace."""

from __future__ import annotations

import decision_trace


def build_package(
    *,
    decision_id: str,
    case: dict,
    po: dict | None,
    evidence: list[dict],
    extraction: dict,
    evaluation: dict,
    decision: dict,
    device_id: str,
    site_id: str,
    generated_at: str,
) -> dict:
    return {
        "decisionId": decision_id,
        "caseId": case.get("id"),
        "title": case.get("title"),
        "device": device_id,
        "site": site_id,
        "generatedAt": generated_at,
        "localProcessing": True,
        "purchaseOrder": {
            "poNumber": po.get("po_number") if po else None,
            "supplier": po.get("supplier") if po else None,
            "material": po.get("material") if po else None,
            "expectedQuantity": po.get("expected_quantity") if po else None,
            "unit": po.get("unit") if po else None,
            "requiredDocuments": po.get("required_documents") if po else [],
        },
        "evidence": [
            {"kind": e.get("kind"), "filename": e.get("filename"), "sha256": e.get("sha256")}
            for e in evidence
        ],
        "extraction": {
            "provider": extraction.get("provider"),
            "model": extraction.get("model"),
            "escalatedFrom": extraction.get("escalated_from"),
            "detectedQuantity": extraction.get("detected_quantity"),
            "damagedCartons": extraction.get("damaged_cartons"),
            "damageSummary": extraction.get("damage_summary"),
            "lotNumber": extraction.get("lot_number"),
            "documentsFound": extraction.get("documents_found"),
            "documentsMissing": extraction.get("documents_missing"),
            "confidence": extraction.get("confidence"),
            "fields": extraction.get("fields", []),
        },
        "evaluation": evaluation,
        "decision": {
            "humanDecision": decision.get("human_decision"),
            "approver": decision.get("approver"),
            "autoActions": decision.get("auto_actions", []),
            "approvedAt": decision.get("approved_at"),
        },
        "trace": decision_trace.build_trace(
            evidence=evidence,
            extraction=extraction,
            evaluation=evaluation,
            decision=decision,
            generated_at=generated_at,
        ),
    }
