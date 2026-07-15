"""Derived: does the receipt warrant a quality hold? Summarizes the holds the
detector rules raised (damaged goods, etc.)."""

from __future__ import annotations


def applies(findings: list) -> bool:
    return any(f.hold in ("quality", "both") for f in findings)
