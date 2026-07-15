"""Deployment mode — held in runtime state so it can be flipped live
(POST /api/mode) without a restart.

Two INDEPENDENT dimensions, exposed as three named presets:
  - sync   : do approved structured events sync to the GCP control plane?
  - assist : which engine runs the AI extract/assist tasks — on-device | Vertex?

  offline      sync off · assist local   — fully on-device, nothing leaves
  cloud-sync   sync on  · assist local   — events sync, AI still on-device
  vertex       sync on  · assist Vertex  — Vertex enhances summaries/Q&A/drafts

In EVERY mode the receiving extraction stays on-device (classical pipeline) and
the DECISIONS are the rules engine + human — Vertex is never required, never in
the decision path. Raw images never leave the device in any mode."""

from __future__ import annotations

from .settings import settings

PROFILES: dict[str, dict] = {
    "offline": {"sync": False, "assist": "local", "label": "Offline · on-device"},
    "cloud-sync": {"sync": True, "assist": "local", "label": "Cloud sync · local AI"},
    "vertex": {"sync": True, "assist": "vertex", "label": "Vertex-enhanced"},
}
# Back-compat: the old two-mode switch called Mode 3 "gcp".
_ALIASES = {"gcp": "vertex"}


def _canon(m: str) -> str:
    m = (m or "").strip().lower()
    return _ALIASES.get(m, m)


def _init() -> str:
    m = _canon(settings.edge_mode)
    if m in PROFILES:
        return m
    return "vertex" if settings.control_plane_url else "offline"


_state = {"mode": _init()}


def get_mode() -> str:
    return _state["mode"]


def set_mode(m: str) -> str:
    m = _canon(m)
    if m not in PROFILES:
        raise ValueError(f"unknown mode {m!r}; expected one of {list(PROFILES)}")
    _state["mode"] = m
    return m


def sync_enabled() -> bool:
    return PROFILES[_state["mode"]]["sync"]


def assist_engine() -> str:
    """'local' (on-device Ollama) | 'vertex' (Vertex AI) for extract/assist tasks."""
    return PROFILES[_state["mode"]]["assist"]


def use_vertex_assist() -> bool:
    return assist_engine() == "vertex"


def label() -> str:
    return PROFILES[_state["mode"]]["label"]


def list_modes() -> list[dict]:
    return [
        {"id": k, "label": v["label"], "sync": v["sync"], "assist": v["assist"]}
        for k, v in PROFILES.items()
    ]
