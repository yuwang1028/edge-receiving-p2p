"""Ingest one edge event into Firestore. Idempotent by decision_id (re-sent
events don't duplicate). Writes three collections:
  decisions/{decision_id}  — the immutable audit event (append-once, idempotent)
  cases/{case_id}          — latest state of the receiving case
  devices/{device_id}      — device heartbeat + counters"""

from __future__ import annotations

from google.cloud import firestore


def ingest_event(db: firestore.Client, ev: dict) -> None:
    decision_id = ev["decision_id"]
    case_id = ev["case_id"]
    device_id = ev["edge_device_id"]
    fields = ev.get("extracted_fields", {}) or {}
    decision = ev.get("decision", {}) or {}

    db.collection("decisions").document(decision_id).set(
        {**ev, "received_at": firestore.SERVER_TIMESTAMP}, merge=True
    )

    db.collection("cases").document(case_id).set(
        {
            "case_id": case_id,
            "po_number": fields.get("po_number"),
            "supplier": fields.get("supplier"),
            "site_id": ev.get("site_id"),
            "device_id": device_id,
            "status": decision.get("human_decision") or decision.get("recommendation"),
            "latest_decision_id": decision_id,
            "risk_result": ev.get("risk_result", {}),
            "updated_at": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )

    db.collection("devices").document(device_id).set(
        {
            "device_id": device_id,
            "site_id": ev.get("site_id"),
            "last_seen": firestore.SERVER_TIMESTAMP,
            "last_decision_id": decision_id,
            "events_total": firestore.Increment(1),
        },
        merge=True,
    )
