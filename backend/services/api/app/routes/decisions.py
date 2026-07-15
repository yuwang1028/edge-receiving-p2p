"""Cloud read API for a single decision — the synced audit event."""

from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore

from ..database import get_db

router = APIRouter()


@router.get("/decisions/{decision_id}")
def get_decision(decision_id: str, db: firestore.Client = Depends(get_db)) -> dict:
    doc = db.collection("decisions").document(decision_id).get()
    if not doc.exists:
        raise HTTPException(404, f"decision {decision_id} not found")
    return {**doc.to_dict(), "id": doc.id}
