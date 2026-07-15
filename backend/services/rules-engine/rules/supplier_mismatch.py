"""Supplier read from the evidence doesn't match the PO's supplier → review."""

from __future__ import annotations

from rule_context import RuleContext
from rule_result import RuleResult


def _norm(s: str) -> str:
    return "".join(ch for ch in s.lower() if ch.isalnum())


def check(ctx: RuleContext) -> RuleResult:
    if ctx.po is None:
        return RuleResult(code="supplier_mismatch", triggered=False)
    po_sup = _norm(ctx.po.get("supplier", ""))
    ex_sup = _norm(ctx.extraction.get("supplier", ""))
    # Match if either contains the other (handles "BASF" vs "BASF SE").
    matched = bool(po_sup) and bool(ex_sup) and (po_sup in ex_sup or ex_sup in po_sup)
    return RuleResult(
        code="supplier_mismatch",
        triggered=not matched,
        severity="high",
        title="Supplier mismatch",
        detail=f"Evidence supplier '{ctx.extraction.get('supplier', '')}' "
        f"≠ PO supplier '{ctx.po.get('supplier', '')}'.",
        action="Confirm the supplier before posting the receipt",
        decision_hint="manual_review",
    )
