"""HTTP client that pushes one structured event to the cloud control plane's
POST /edge/events. Raises OfflineError when no control plane is configured so the
worker leaves the event queued. (The control-plane endpoint itself lands in P4.)"""

from __future__ import annotations

import httpx

from ..settings import settings


class OfflineError(RuntimeError):
    pass


def send_event(event: dict) -> dict:
    if not settings.control_plane_url:
        raise OfflineError("No control plane configured — staying offline.")
    headers = {"Authorization": f"Bearer {settings.sync_token}"} if settings.sync_token else {}
    url = settings.control_plane_url.rstrip("/") + "/edge/events"
    resp = httpx.post(url, json=event, headers=headers, timeout=10.0)
    resp.raise_for_status()
    return resp.json() if resp.content else {"status": "accepted"}
