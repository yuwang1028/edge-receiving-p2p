"""Offline-first sync queue. Every approved decision enqueues ONE structured
event here. When the device is offline the rows just accumulate; the sync worker
drains them once a control plane is reachable. Raw evidence is never enqueued —
only extracted fields, scores, the decision, and evidence hashes."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..utils.id_generator import gen_id
from ..utils.local_time import utcnow
from .local_database import SyncEvent


def enqueue(db: Session, event_type: str, payload: dict) -> SyncEvent:
    ev = SyncEvent(id=gen_id("evt"), event_type=event_type, payload=payload, status="pending")
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


def list_pending(db: Session) -> list[SyncEvent]:
    return db.query(SyncEvent).filter(SyncEvent.status == "pending").order_by(SyncEvent.created_at).all()


def mark_sent(db: Session, event_id: str) -> None:
    ev = db.get(SyncEvent, event_id)
    if ev:
        ev.status = "sent"
        ev.attempts += 1
        ev.sent_at = utcnow()
        db.commit()


def mark_failed(db: Session, event_id: str) -> None:
    ev = db.get(SyncEvent, event_id)
    if ev:
        ev.status = "pending"  # stays pending for retry
        ev.attempts += 1
        db.commit()
