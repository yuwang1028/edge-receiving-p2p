"""Cloud read API for edge devices — fleet heartbeat + counters."""

from fastapi import APIRouter, Depends
from google.cloud import firestore

from ..database import get_db

router = APIRouter()


@router.get("/devices")
def list_devices(db: firestore.Client = Depends(get_db)) -> list[dict]:
    return [{**d.to_dict(), "id": d.id} for d in db.collection("devices").stream()]
