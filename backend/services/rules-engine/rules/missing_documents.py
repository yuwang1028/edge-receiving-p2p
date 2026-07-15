"""Required document missing (e.g. batch certificate / CoA) → invoice hold until
the supplier provides it."""

from __future__ import annotations

from rule_context import RuleContext
from rule_result import RuleResult


def check(ctx: RuleContext) -> RuleResult:
    missing = ctx.missing_docs
    if not missing:
        return RuleResult(code="missing_documents", triggered=False)
    docs = ", ".join(missing)
    return RuleResult(
        code="missing_documents",
        triggered=True,
        severity="high",
        title="Missing document",
        detail=f"Required document(s) not present at receiving: {docs}.",
        action=f"Request missing document(s) from supplier: {docs}",
        hold="invoice",
        decision_hint="partial_receipt",
    )
