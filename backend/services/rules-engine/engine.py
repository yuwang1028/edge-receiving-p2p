"""Deterministic receiving-risk engine. Runs every detector rule over the PO +
extraction, then aggregates the triggered findings into the evaluation the
operator console renders and the human approves:

    poMatchScore, quantityVariance, damagedCartons, paymentExposure,
    decision, qualityHold, invoiceHold, matchLines[], exceptionCase, recommendedActions[]

NOTE: extraction is evidence only. This engine + the human make the call — no AI
"reasoning" decides whether to receive goods."""

from __future__ import annotations

from rule_context import RuleContext
from rule_registry import RULES
from rule_result import SEVERITY_ORDER
from rules import invoice_hold, quality_hold


def _po_match_score(ctx: RuleContext, supplier_ok: bool) -> int:
    if ctx.po is None:
        return 0
    qty_pen = round(min(10, abs(ctx.variance) / max(ctx.expected, 1) * 100))
    base = 100 if supplier_ok else 60
    return max(0, base - qty_pen)


def _match_lines(ctx: RuleContext) -> list[dict]:
    if ctx.po is None:
        return []
    if ctx.variance > 0:
        status = "over"
    elif ctx.variance < 0:
        status = "short"
    elif ctx.damaged > 0:
        status = "damaged"
    else:
        status = "match"
    return [
        {
            "line": "10",
            "item": f"{ctx.po.get('material', '')}",
            "ordered": ctx.expected,
            "received": ctx.detected,
            "damaged": ctx.damaged,
            "unit": ctx.unit,
            "status": status,
        }
    ]


def evaluate(po: dict | None, extraction: dict, threshold: float = 0.85, case_id: str = "") -> dict:
    ctx = RuleContext(po=po, extraction=extraction, confidence_threshold=threshold)
    findings = [r for r in (rule(ctx) for rule in RULES) if r.triggered]

    q_hold = quality_hold.applies(findings)
    i_hold = invoice_hold.applies(findings)
    supplier_ok = not any(f.code == "supplier_mismatch" for f in findings)

    # Decision precedence: manual review > partial receipt > accept.
    if any(f.decision_hint == "manual_review" for f in findings):
        decision = "manual_review"
    elif findings:
        decision = "partial_receipt"
    else:
        decision = "accept"

    expected = ctx.expected
    detected = ctx.detected
    damaged = ctx.damaged
    unit = ctx.unit
    unit_price = float(po.get("unit_price", 0.0)) if po else 0.0
    usable = max(detected - damaged, 0)
    # Exposure = what we risk over-paying: everything received minus what is
    # actually payable (usable, capped at the ordered quantity). Over-delivery and
    # damage overlap — the excess cartons ARE the damaged/unaccepted ones — so this
    # must NOT add the two separately or it double-counts (e.g. +2 over & 2 damaged
    # on a 40-carton order is 2 cartons of exposure, not 4).
    payable = min(usable, expected)
    payment_exposure = round((detected - payable) * unit_price, 2)

    # Recommended actions — lead with the accept, then each finding's action.
    actions: list[str] = []
    if po and decision != "manual_review":
        receive_qty = min(usable, expected)
        actions.append(f"Accept {receive_qty} {unit} into inventory")
    for f in findings:
        if f.action:
            actions.append(f.action)

    severity = "info"
    for f in findings:
        if SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[severity]:
            severity = f.severity

    exception_case = None
    if findings:
        suffix = case_id.split("_")[-1] if case_id else "NEW"
        exception_case = {
            "id": f"EXC-{suffix}",
            "type": " + ".join(f.title for f in findings),
            "severity": severity.capitalize(),
            "po": po.get("po_number", "") if po else "",
            "supplier": extraction.get("supplier", ""),
            "detected": "Edge AI · receiving dock",
            "damageSummary": extraction.get("damage_summary", ""),
            "rootCause": " ".join(f.detail for f in findings),
            "impact": (
                f"${payment_exposure:,.0f} of receipt value affected"
                + (f" · {damaged} {unit} on quality hold" if damaged else "")
                + (" · invoice blocked" if i_hold else "")
            ),
            "recommended": actions,
        }

    return {
        "poMatchScore": _po_match_score(ctx, supplier_ok),
        "quantityVariance": ctx.variance,
        "damagedCartons": damaged,
        "paymentExposure": payment_exposure,
        "decision": decision,
        "qualityHold": q_hold,
        "invoiceHold": i_hold,
        "matchLines": _match_lines(ctx),
        "exceptionCase": exception_case,
        "recommendedActions": actions,
        "findings": [
            {"code": f.code, "severity": f.severity, "title": f.title, "detail": f.detail}
            for f in findings
        ],
        "fields": extraction.get("fields", []),
    }
