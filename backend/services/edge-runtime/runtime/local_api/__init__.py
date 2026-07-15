"""Local API package. Serializer helpers shared by the route modules — they map
ORM rows to the camelCase JSON the operator console expects (same shapes as the
frontend's existing receiving types) and to the snake_case internal dicts the
extractor + rules engine consume."""

from __future__ import annotations


def po_to_out(po) -> dict:
    return {
        "poNumber": po.po_number,
        "supplier": po.supplier,
        "material": po.material,
        "expectedQuantity": po.expected_quantity,
        "unit": po.unit,
        "unitPrice": po.unit_price,
        "plant": po.plant,
        "requiredDocuments": po.required_documents or [],
        "status": getattr(po, "status", "open"),
        "source": getattr(po, "source", "erp"),
        "prId": getattr(po, "pr_id", ""),
        "poState": getattr(po, "po_state", "po_created"),
        "supplierEmail": getattr(po, "supplier_email", ""),
        "confirmation": getattr(po, "confirmation", None) or None,
    }


def po_to_internal(po) -> dict | None:
    if po is None:
        return None
    return {
        "po_number": po.po_number,
        "supplier": po.supplier,
        "material": po.material,
        "expected_quantity": po.expected_quantity,
        "unit": po.unit,
        "unit_price": po.unit_price,
        "plant": po.plant,
        "required_documents": po.required_documents or [],
    }


def evidence_to_out(e) -> dict:
    return {
        "id": e.id,
        "kind": e.kind,
        "filename": e.filename,
        "uri": e.uri,
        "sha256": e.sha256,
        # Served by the edge so the browser can render HEIC/large phone photos.
        "imageUrl": f"/api/evidence/{e.id}/image",
        "width": e.width,
        "height": e.height,
        "format": e.image_format,
        "device": e.device,
        "capturedAt": e.captured_at,
    }


def evidence_to_internal(e) -> dict:
    """For the extractor/VLM — includes the on-device file path (normalized JPEG
    if available, else original). Not exposed to the UI."""
    return {
        "kind": e.kind,
        "filename": e.filename,
        "path": e.norm_path or e.orig_path,
        "device": e.device,
    }


def extraction_to_out(x) -> dict:
    return {
        "provider": x.provider,
        "model": x.model,
        "escalatedFrom": x.escalated_from,
        "poNumber": x.po_number,
        "supplier": x.supplier,
        "material": x.material,
        "detectedQuantity": x.detected_quantity,
        "unit": x.unit,
        "damagedCartons": x.damaged_cartons,
        "damageSummary": x.damage_summary,
        "lotNumber": x.lot_number,
        "documentsFound": x.documents_found or [],
        "documentsMissing": x.documents_missing or [],
        "confidence": x.confidence,
        "fields": x.fields or [],
    }


def extraction_to_internal(x) -> dict:
    return {
        "provider": x.provider,
        "model": x.model,
        "escalated_from": x.escalated_from,
        "po_number": x.po_number,
        "supplier": x.supplier,
        "material": x.material,
        "detected_quantity": x.detected_quantity,
        "unit": x.unit,
        "damaged_cartons": x.damaged_cartons,
        "damage_summary": x.damage_summary,
        "lot_number": x.lot_number,
        "documents_found": x.documents_found or [],
        "documents_missing": x.documents_missing or [],
        "confidence": x.confidence,
        "fields": x.fields or [],
    }


def case_to_out(case, evidence_count: int = 0) -> dict:
    return {
        "id": case.id,
        "poNumber": case.po_number,
        "plant": case.plant,
        "title": case.title,
        "summary": case.summary,
        "status": case.status,
        "evaluation": case.evaluation or None,
        "createdAt": case.created_at.isoformat() if case.created_at else None,
        "evidenceCount": evidence_count,
    }
