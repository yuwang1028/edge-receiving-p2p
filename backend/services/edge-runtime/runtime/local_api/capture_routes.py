"""Evidence capture — accepts ANY image from the operator console or a camera:
iPhone HEIC/HEIF, Samsung/Android JPEG, webcam/CSI camera frames, PNG/WEBP/TIFF.

For each upload we keep the ORIGINAL (hashed for audit) and a NORMALIZED JPEG
(EXIF-rotation fixed, RGB, downscaled) for browser preview + inference. Two
entry points share the same pipeline:
  POST /api/cases/{id}/evidence   multipart upload (console / phone library)
  POST /api/cases/{id}/frame      raw image body (live camera / Jetson)
'Processed locally — only the hash leaves the device.'"""

from __future__ import annotations

import pathlib

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..local_store.local_database import Evidence, ReceivingCase, get_db
from ..settings import settings
from ..utils.file_hash import sha256_bytes
from ..utils.id_generator import gen_id
from ..utils.image_ingest import ingest
from . import evidence_to_out

router = APIRouter()


def _infer_kind(filename: str) -> str:
    n = filename.lower()
    if "pack" in n:
        return "packing-list"
    if "damage" in n or "broken" in n:  # before carton: "damaged_cartons" is damage
        return "damage"
    if "label" in n or "carton" in n or "mark" in n:
        return "carton-label"
    if "pallet" in n:
        return "pallet"
    if "coa" in n or "cert" in n:
        return "coa"
    if "frame" in n or "cam" in n:
        return "frame"
    return "delivery-note"


def _store(case_id: str, filename: str, data: bytes, db: Session, kind: str | None) -> Evidence:
    """Shared ingest pipeline: normalize, persist original + derivative, record."""
    base = pathlib.Path(settings.storage_dir) / "evidence" / case_id
    (base / "orig").mkdir(parents=True, exist_ok=True)

    orig_path = base / "orig" / filename
    orig_path.write_bytes(data)

    ing = ingest(data)
    norm_path = ""
    if ing.normalized_bytes is not None:
        (base / "norm").mkdir(parents=True, exist_ok=True)
        npath = base / "norm" / (pathlib.Path(filename).stem + ".jpg")
        npath.write_bytes(ing.normalized_bytes)
        norm_path = str(npath.resolve())

    ev = Evidence(
        id=gen_id("ev"),
        case_id=case_id,
        kind=kind or _infer_kind(filename),
        filename=filename,
        uri=orig_path.resolve().as_uri(),
        sha256=sha256_bytes(data),  # hash of the ORIGINAL bytes — audit integrity
        content_type="image/jpeg" if norm_path else "application/octet-stream",
        orig_path=str(orig_path.resolve()),
        norm_path=norm_path,
        width=ing.width,
        height=ing.height,
        image_format=ing.image_format,
        device=ing.device,
        captured_at=ing.captured_at,
    )
    db.add(ev)
    return ev


@router.post("/api/cases/{case_id}/evidence")
async def upload_evidence(
    case_id: str,
    files: list[UploadFile] = File(...),
    kind: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> dict:
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")

    saved = [_store(case_id, f.filename or "evidence", await f.read(), db, kind) for f in files]
    case.summary = f"{len(saved)} evidence item(s) captured locally at the dock."
    db.commit()
    for ev in saved:
        db.refresh(ev)
    return {"caseId": case_id, "evidence": [evidence_to_out(e) for e in saved]}


@router.post("/api/cases/{case_id}/frame")
async def capture_frame(
    case_id: str,
    request: Request,
    kind: str = "frame",
    db: Session = Depends(get_db),
) -> dict:
    """Raw image body (Content-Type: image/jpeg) — for a live camera / Jetson that
    POSTs captured frames directly rather than a multipart form."""
    case = db.get(ReceivingCase, case_id)
    if case is None:
        raise HTTPException(404, f"Case {case_id} not found")
    data = await request.body()
    if not data:
        raise HTTPException(400, "Empty frame body")
    ev = _store(case_id, gen_id("frame") + ".jpg", data, db, kind)
    db.commit()
    db.refresh(ev)
    return {"caseId": case_id, "evidence": [evidence_to_out(ev)]}


@router.get("/api/evidence/{evidence_id}/image")
def evidence_image(evidence_id: str, db: Session = Depends(get_db)):
    """Serve the normalized JPEG (so HEIC/large phone photos render in the browser),
    falling back to the original for non-raster files (e.g. an SVG)."""
    ev = db.get(Evidence, evidence_id)
    if ev is None:
        raise HTTPException(404, "Evidence not found")
    if ev.norm_path:
        return FileResponse(ev.norm_path, media_type="image/jpeg")
    media = "image/svg+xml" if ev.filename.lower().endswith(".svg") else "application/octet-stream"
    return FileResponse(ev.orig_path, media_type=media)
