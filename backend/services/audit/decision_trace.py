"""Builds the ordered, human-readable trace of the whole loop — the spine of the
audit package: evidence captured → extracted → compared → risk → human approval →
actions executed. This is the governance story, not just an OCR result."""

from __future__ import annotations


def build_trace(
    *,
    evidence: list[dict],
    extraction: dict,
    evaluation: dict,
    decision: dict,
    generated_at: str,
) -> list[dict]:
    n_evidence = len(evidence)
    detected = extraction.get("detected_quantity", "—")
    unit = extraction.get("unit", "")
    return [
        {
            "step": "Evidence captured locally",
            "detail": f"{n_evidence} item(s) photographed and hashed on the device — no image left the device.",
        },
        {
            "step": "Fields extracted on-device",
            "detail": f"Provider '{extraction.get('provider', '')}' read PO, supplier, quantity, lot "
            f"(confidence {extraction.get('confidence', 0):.2f}).",
        },
        {
            "step": "Compared against purchase order",
            "detail": f"Detected {detected} {unit}; PO-match score {evaluation.get('poMatchScore', '—')}%.",
        },
        {
            "step": "Receiving risk evaluated",
            "detail": "Findings: "
            + (", ".join(f["title"] for f in evaluation.get("findings", [])) or "none")
            + f" → recommended '{evaluation.get('decision', '')}'.",
        },
        {
            "step": "Human approval captured",
            "detail": f"{decision.get('approver', '')} decided '{decision.get('human_decision', '')}'.",
        },
        {
            "step": "Actions executed",
            "detail": "; ".join(decision.get("auto_actions", [])) or "—",
        },
        {
            "step": "Audit package generated",
            "detail": f"Sealed at {generated_at}.",
        },
    ]
