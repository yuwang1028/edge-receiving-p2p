"""Builds the SLIM sync event from a full audit package — the only thing that
goes to the cloud. Metadata + evidence hashes + the decision; NO raw images.
This is the core differentiator: factory images stay local, only approved
business events sync."""

from __future__ import annotations


def build_sync_event(package: dict) -> dict:
    ev = package.get("evaluation", {})
    extraction = package.get("extraction", {})
    return {
        "event_type": "receiving_decision_created",
        "edge_device_id": package.get("device"),
        "site_id": package.get("site"),
        "case_id": package.get("caseId"),
        "decision_id": package.get("decisionId"),
        "generated_at": package.get("generatedAt"),
        "local_processing": True,
        "evidence_hashes": [e.get("sha256") for e in package.get("evidence", [])],
        "extracted_fields": {
            "po_number": package.get("purchaseOrder", {}).get("poNumber"),
            "supplier": package.get("purchaseOrder", {}).get("supplier"),
            "detected_quantity": extraction.get("detectedQuantity"),
            "lot_number": extraction.get("lotNumber"),
            "confidence": extraction.get("confidence"),
        },
        "risk_result": {
            "quantity_variance": ev.get("quantityVariance"),
            "damaged_cartons": ev.get("damagedCartons"),
            "documents_missing": extraction.get("documentsMissing"),
            "payment_exposure": ev.get("paymentExposure"),
            "po_match_score": ev.get("poMatchScore"),
            "quality_hold": ev.get("qualityHold"),
            "invoice_hold": ev.get("invoiceHold"),
        },
        "decision": {
            "recommendation": ev.get("decision"),
            "human_decision": package.get("decision", {}).get("humanDecision"),
            "approved_by": package.get("decision", {}).get("approver"),
            "approved_at": package.get("decision", {}).get("approvedAt"),
        },
    }
