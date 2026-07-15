"""Cloud read API for cases — what a control-tower dashboard reads."""

from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore

from ..database import get_db

router = APIRouter()


@router.get("/cases")
def list_cases(db: firestore.Client = Depends(get_db)) -> list[dict]:
    return [{**d.to_dict(), "id": d.id} for d in db.collection("cases").stream()]


@router.get("/cases/{case_id}")
def get_case(case_id: str, db: firestore.Client = Depends(get_db)) -> dict:
    doc = db.collection("cases").document(case_id).get()
    if not doc.exists:
        raise HTTPException(404, f"case {case_id} not found")
    return {**doc.to_dict(), "id": doc.id}
