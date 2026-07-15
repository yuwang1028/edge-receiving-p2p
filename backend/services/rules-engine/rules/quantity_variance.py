"""Received quantity ≠ ordered quantity → over/short delivery exception. An
over-delivery blocks the invoice difference; a shortage chases the supplier."""

from __future__ import annotations

from rule_context import RuleContext
from rule_result import RuleResult


def check(ctx: RuleContext) -> RuleResult:
    if ctx.po is None or ctx.variance == 0:
        return RuleResult(code="quantity_variance", triggered=False)
    over = ctx.variance > 0
    n = abs(ctx.variance)
    return RuleResult(
        code="quantity_variance",
        triggered=True,
        severity="high",
        title="Over-delivery" if over else "Short delivery",
        detail=f"Detected {ctx.detected} {ctx.unit} against {ctx.expected} ordered ({ctx.variance:+d}).",
        action=(
            f"Block the invoice difference on {n} over-delivered {ctx.unit}"
            if over
            else f"Chase the supplier for {n} short {ctx.unit}"
        ),
        hold="invoice" if over else "none",
        decision_hint="partial_receipt",
    )
