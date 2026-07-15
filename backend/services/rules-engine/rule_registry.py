"""The ordered list of detector rules the engine runs. Add a rule module with a
`check(ctx) -> RuleResult` and register it here."""

from __future__ import annotations

from rules import (
    damaged_goods,
    low_confidence,
    missing_documents,
    po_not_found,
    quantity_variance,
    supplier_mismatch,
)

RULES = [
    po_not_found.check,
    supplier_mismatch.check,
    quantity_variance.check,
    damaged_goods.check,
    missing_documents.check,
    low_confidence.check,
]
