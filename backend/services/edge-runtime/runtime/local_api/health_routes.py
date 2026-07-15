"""Liveness + edge identity/mode — what the dashboard's edge-status footer reads."""

from __future__ import annotations

from fastapi import APIRouter

from ..mode import get_mode, list_modes, sync_enabled, use_vertex_assist
from ..settings import settings

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "mode": get_mode(),            # offline | cloud-sync | vertex (switchable)
        "syncEnabled": sync_enabled(),
        "vertexAssist": use_vertex_assist(),
        "modes": list_modes(),
        "deviceId": settings.device_id,
        "siteId": settings.site_id,
        "provider": settings.infer_provider,
        "confidenceThreshold": settings.confidence_threshold,
    }
