"""Orchestrates on-device extraction: pick the provider, read the evidence,
return the normalized extraction plus the display fields.

Tiered escalation (vertex only): the cheap/fast model runs every delivery; if its
confidence lands below the threshold, the stronger (pricier) model re-reads ONCE
before the loop falls back to a human. So the expensive model is only spent on the
hard minority. (Still-low reads are caught downstream: the rules engine's
low_confidence rule routes them to manual review.)"""

from __future__ import annotations

from ..mode import use_vertex_assist
from ..settings import settings
from .damage_summary import summarize
from .field_normalizer import build_display_fields
from .vlm_extractor import get_extractor


def run_extraction(po: dict, evidence: list[dict]) -> dict:
    extractor = get_extractor()
    result = extractor.extract(po, evidence)

    if (
        settings.infer_provider == "vertex"
        and settings.vertex_escalate
        and settings.vertex_escalation_model != settings.vertex_model
        and float(result.get("confidence", 0.0)) < settings.confidence_threshold
    ):
        try:
            hi = extractor.extract(po, evidence, model=settings.vertex_escalation_model)
            if float(hi.get("confidence", 0.0)) >= float(result.get("confidence", 0.0)):
                hi["escalated_from"] = result.get("model", settings.vertex_model)
                result = hi
        except Exception:
            pass  # escalation is best-effort; keep the flash read (human will catch low conf)

    # Damage summary — only when damage was found. A deterministic baseline is
    # ALWAYS set (instant, correct); the VLM only enriches it when it's available
    # AND doesn't contradict the detection (so a flaky/expired model can't make the
    # audit say "no damage" while N cartons are flagged).
    n = int(result.get("damaged_cartons", 0))
    if settings.damage_summary and n > 0:
        unit = result.get("unit") or "cartons"
        result["damage_summary"] = f"{n} {unit} flagged with packaging damage at the dock."
        imgs = [e.get("path") for e in evidence if e.get("kind") == "damage" and e.get("path")]
        imgs = imgs or [e.get("path") for e in evidence if e.get("path")]
        if imgs:
            s = summarize(imgs[0], online=use_vertex_assist())
            if s and "no damage" not in s.lower() and "no visible damage" not in s.lower():
                result["damage_summary"] = s

    result["fields"] = build_display_fields(result, po)
    return result
