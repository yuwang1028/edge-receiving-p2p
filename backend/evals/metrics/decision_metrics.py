"""End-to-end business-decision metrics — the numbers the enterprise buyer cares
about. NOT "is the OCR right", but: did we accept/hold/escalate correctly, and
above all did we ever wave through something we should have stopped?

Decision space (engine.evaluate → `decision`): accept | partial_receipt | manual_review.
Anything other than `accept` is a controlled exception (goods held / routed to human).
"""

from __future__ import annotations

ACCEPT = "accept"


def is_exception(decision: str) -> bool:
    return decision != ACCEPT


def decision_row(case_id: str, scenario: str, gold: str, sys: str) -> dict:
    gold_exc = is_exception(gold)
    sys_accept = sys == ACCEPT
    return {
        "case_id": case_id,
        "scenario": scenario,
        "gold": gold,
        "sys": sys,
        "correct": gold == sys,
        "gold_exception": gold_exc,
        # THE risk metric: gold says stop, system auto-accepted.
        "false_auto_accept": gold_exc and sys_accept,
        # Caught it (any non-accept counts as "controlled"), even if not the exact class.
        "caught_exception": gold_exc and not sys_accept,
        # Opposite failure: stopped a clean receipt (annoying, not dangerous).
        "false_hold": (not gold_exc) and (not sys_accept),
    }


def aggregate_decisions(rows: list[dict]) -> dict:
    n = len(rows)
    exc = [r for r in rows if r["gold_exception"]]
    clean = [r for r in rows if not r["gold_exception"]]
    faa = [r for r in exc if r["false_auto_accept"]]
    return {
        "n_cases": n,
        "e2e_decision_accuracy": _pct(sum(r["correct"] for r in rows), n),
        # ↓ the one to optimize: of all cases that SHOULD be stopped, how many slipped through
        "false_auto_accept_rate": _pct(len(faa), len(exc)),
        "critical_exception_recall": _pct(sum(r["caught_exception"] for r in exc), len(exc)),
        "false_hold_rate": _pct(sum(r["false_hold"] for r in clean), len(clean)),
        "false_auto_accepts": [r["case_id"] for r in faa],
        # per-scenario false-auto-accept — a high-freq low-risk scenario must not
        # dilute a rare high-risk one, so never report only the global number.
        "false_auto_accept_by_scenario": _group_faa(exc),
    }


def error_absorption(rows: list[dict]) -> dict:
    """The edge-first thesis, quantified: when extraction was wrong, did the
    deterministic rules still reach the right decision (absorbed) or did the error
    flip the outcome? `rows` need keys: extraction_all_correct(bool), decision_correct(bool)."""
    wrong = [r for r in rows if not r["extraction_all_correct"]]
    absorbed = [r for r in wrong if r["decision_correct"]]
    flipped = [r for r in wrong if not r["decision_correct"]]
    return {
        "cases_with_extraction_error": len(wrong),
        "error_absorbed_by_rules": len(absorbed),
        "error_flipped_decision": len(flipped),
        "absorption_rate": _pct(len(absorbed), len(wrong)),
    }


def exposure_error(pred: float | None, gold: float | None) -> float | None:
    if pred is None or gold is None:
        return None
    return abs(float(pred) - float(gold))


def _group_faa(exc_rows: list[dict]) -> dict:
    out: dict[str, dict] = {}
    for r in exc_rows:
        b = out.setdefault(r["scenario"], {"n": 0, "faa": 0})
        b["n"] += 1
        b["faa"] += int(r["false_auto_accept"])
    return {k: {**v, "rate": _pct(v["faa"], v["n"])} for k, v in out.items()}


def _pct(num: int, den: int) -> float | None:
    return None if den == 0 else round(100 * num / den, 1)
