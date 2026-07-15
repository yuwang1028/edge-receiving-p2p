"""Extraction confidence below threshold → route to a human; never auto-post."""

from __future__ import annotations

from rule_context import RuleContext
from rule_result import RuleResult


def check(ctx: RuleContext) -> RuleResult:
    triggered = ctx.confidence < ctx.confidence_threshold
    return RuleResult(
        code="low_confidence",
        triggered=triggered,
        severity="low",
        title="Low extraction confidence",
        detail=f"Confidence {ctx.confidence:.2f} is below the {ctx.confidence_threshold:.2f} threshold.",
        action="Have a person confirm the extracted fields",
        decision_hint="manual_review",
    )
