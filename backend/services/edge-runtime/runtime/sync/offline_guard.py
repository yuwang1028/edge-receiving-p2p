"""Decides whether the edge can reach the cloud control plane right now. Config
gates it (no URL = offline by design); a fast health ping confirms reachability,
so a configured-but-unreachable control plane still leaves events queued."""

from __future__ import annotations

import httpx

from ..settings import settings


def control_plane_configured() -> bool:
    return bool(settings.control_plane_url)


def is_online() -> bool:
    from ..mode import sync_enabled

    # Offline mode: never sync, even if a control plane URL is configured.
    if not sync_enabled() or not settings.control_plane_url:
        return False
    try:
        r = httpx.get(settings.control_plane_url.rstrip("/") + "/health", timeout=2.0)
        return r.status_code == 200
    except Exception:
        return False
