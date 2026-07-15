"""Everything a rule needs to fire: the matched PO (or None), the normalized
extraction, and the confidence threshold."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RuleContext:
    po: dict | None
    extraction: dict
    confidence_threshold: float = 0.85

    @property
    def expected(self) -> int:
        return int(self.po.get("expected_quantity", 0)) if self.po else 0

    @property
    def detected(self) -> int:
        return int(self.extraction.get("detected_quantity", 0))

    @property
    def variance(self) -> int:
        return self.detected - self.expected

    @property
    def damaged(self) -> int:
        return int(self.extraction.get("damaged_cartons", 0))

    @property
    def unit(self) -> str:
        return self.extraction.get("unit", "") or (self.po.get("unit", "") if self.po else "")

    @property
    def confidence(self) -> float:
        return float(self.extraction.get("confidence", 0.0))

    @property
    def missing_docs(self) -> list[str]:
        return list(self.extraction.get("documents_missing", []))
