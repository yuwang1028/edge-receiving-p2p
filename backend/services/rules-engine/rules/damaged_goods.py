"""Damaged packaging detected → quality hold on the affected units."""

from __future__ import annotations

from rule_context import RuleContext
from rule_result import RuleResult


def check(ctx: RuleContext) -> RuleResult:
    if ctx.damaged <= 0:
        return RuleResult(code="damaged_goods", triggered=False)
    return RuleResult(
        code="damaged_goods",
        triggered=True,
        severity="high",
        title="Damaged goods",
        detail=f"{ctx.damaged} {ctx.unit} show packaging damage at the dock.",
        action=f"Hold {ctx.damaged} {ctx.unit} for quality review",
        hold="quality",
        decision_hint="partial_receipt",
    )
