"""Edge→cloud ingest. The edge's sync worker POSTs structured events here when
online; we land them in Firestore. Auth via shared bearer token."""

from fastapi import APIRouter, Depends
from google.cloud import firestore

from ..auth import require_token
from ..database import get_db
from ..schemas.sync_event import EdgeEvent
from ..services.sync_service import ingest_event

router = APIRouter()


@router.post("/edge/events")
def edge_events(
    ev: EdgeEvent,
    db: firestore.Client = Depends(get_db),
    _: None = Depends(require_token),
) -> dict:
    ingest_event(db, ev.model_dump())
    return {"status": "accepted", "decisionId": ev.decision_id}
