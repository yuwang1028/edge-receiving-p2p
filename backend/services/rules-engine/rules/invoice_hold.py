"""Derived: should the invoice be blocked? Summarizes the holds the detector
rules raised (over-delivery difference, missing documents, etc.)."""

from __future__ import annotations


def applies(findings: list) -> bool:
    return any(f.hold in ("invoice", "both") for f in findings)
