"""PO number unreadable or no matching open PO → manual review."""

from __future__ import annotations

from rule_context import RuleContext
from rule_result import RuleResult


def check(ctx: RuleContext) -> RuleResult:
    triggered = ctx.po is None
    return RuleResult(
        code="po_not_found",
        triggered=triggered,
        severity="critical",
        title="No matching open PO",
        detail="The PO number could not be matched to an open purchase order.",
        action="Route to a buyer for manual review",
        decision_hint="manual_review",
    )
