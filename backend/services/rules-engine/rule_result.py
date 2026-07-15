"""A single rule's verdict. The engine collects the triggered ones into the
exception case and the recommended actions."""

from __future__ import annotations

from dataclasses import dataclass

SEVERITY_ORDER = {"info": 0, "low": 1, "high": 2, "critical": 3}


@dataclass
class RuleResult:
    code: str
    triggered: bool
    severity: str = "info"          # info | low | high | critical
    title: str = ""
    detail: str = ""
    action: str = ""                # recommended human action text
    hold: str = "none"             # none | quality | invoice | both
    decision_hint: str = ""        # accept | partial_receipt | manual_review
