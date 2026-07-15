"""Drains the offline sync queue to the control plane. Offline → events stay
pending and the loop is unaffected (edge-first). Online → each pending event is
posted and marked sent."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..local_store import sync_queue
from . import cloud_sync_client
from .offline_guard import is_online


def flush(db: Session) -> dict:
    pending = sync_queue.list_pending(db)
    if not is_online():
        return {"online": False, "pending": len(pending), "sent": 0}

    sent = 0
    for ev in pending:
        try:
            cloud_sync_client.send_event(ev.payload)
            sync_queue.mark_sent(db, ev.id)
            sent += 1
        except Exception:
            sync_queue.mark_failed(db, ev.id)
    remaining = len(sync_queue.list_pending(db))
    return {"online": True, "sent": sent, "pending": remaining}
