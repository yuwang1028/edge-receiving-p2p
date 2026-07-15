"""Confidence helpers shared by extractor + rules engine."""

from __future__ import annotations


def is_low_confidence(confidence: float, threshold: float) -> bool:
    return float(confidence) < float(threshold)
