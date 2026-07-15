"""Natural-language damage summary — the one spot a VLM adds value beyond the
deterministic pipeline (a human-readable sentence for the exception + audit).

Mode-aware:
  gcp / online  -> Vertex Gemini (cloud)
  offline       -> local Ollama vision model (on-device)

Best-effort: any failure returns None and the loop is unaffected. Only called
when damage was actually detected, so it doesn't slow clean receipts."""

from __future__ import annotations

import base64
import pathlib

from ..settings import settings

_PROMPT = (
    "You are inspecting a receiving-dock photo of a delivered shipment. In ONE short "
    "sentence, describe the visible packaging damage (what is damaged and how, e.g. "
    "'crushed top-right corner on a pallet of cartons'). If no damage is visible, "
    "reply exactly 'No visible damage.' Plain text only, no preamble."
)


def _vertex(image_path: str) -> str | None:
    try:
        from google import genai
        from google.genai import types

        if not settings.gcp_project:
            return None
        client = genai.Client(vertexai=True, project=settings.gcp_project, location=settings.gcp_location)
        resp = client.models.generate_content(
            model=settings.vertex_model,
            contents=[
                _PROMPT,
                types.Part.from_bytes(data=pathlib.Path(image_path).read_bytes(), mime_type="image/jpeg"),
            ],
            config=types.GenerateContentConfig(temperature=0),
        )
        return (resp.text or "").strip() or None
    except Exception:
        return None


def _ollama(image_path: str) -> str | None:
    try:
        import httpx

        img = base64.b64encode(pathlib.Path(image_path).read_bytes()).decode("ascii")
        r = httpx.post(
            settings.local_llm_url.rstrip("/") + "/api/generate",
            json={
                "model": settings.local_llm_model,
                "prompt": _PROMPT,
                "images": [img],
                "stream": False,
                "options": {"temperature": 0},
            },
            timeout=180.0,
        )
        r.raise_for_status()
        return (r.json().get("response", "") or "").strip() or None
    except Exception:
        return None


def summarize(image_path: str, *, online: bool) -> str | None:
    if not image_path or not pathlib.Path(image_path).exists():
        return None
    return _vertex(image_path) if online else _ollama(image_path)
