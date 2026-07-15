"""Backoff schedule for sync retries. Bounded so a long offline spell doesn't
hammer the network the moment it returns."""

from __future__ import annotations


def backoff_seconds(attempt: int) -> int:
    return min(300, 2 ** max(attempt, 0))
