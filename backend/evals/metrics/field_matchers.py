"""Field-level match functions — the core of extraction accuracy.

Every field type gets the RIGHT comparison (a string is not a number is not a
set), so a wrong quantity and a swapped-document-checklist are measured for what
they actually are, not folded into one meaningless "accuracy %".
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher


def norm_str(s: object) -> str:
    """Uppercase-fold, drop non-alphanumerics — so 'BASF SE' == 'basf-se'."""
    return re.sub(r"[^a-z0-9]", "", str(s if s is not None else "").lower())


def match_string(pred: object, gold: object, fuzzy_threshold: float = 0.9) -> dict:
    """Normalized exact match, with a fuzzy ratio for near-misses (supplier names)."""
    p, g = norm_str(pred), norm_str(gold)
    exact = p == g
    ratio = 1.0 if exact else SequenceMatcher(None, p, g).ratio()
    return {"correct": bool(exact or ratio >= fuzzy_threshold), "exact": exact, "ratio": round(ratio, 4)}


def match_numeric(pred: object, gold: object, tol_abs: float = 0.0, tol_pct: float = 0.0) -> dict:
    """Exact-or-tolerance match; always reports absolute error for MAE aggregation."""
    try:
        p, g = float(pred), float(gold)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return {"correct": False, "abs_err": None, "parse_ok": False}
    err = abs(p - g)
    allowed = max(tol_abs, abs(g) * tol_pct)
    return {"correct": err <= allowed, "abs_err": err, "parse_ok": True}


def char_error_rate(pred: object, gold: object) -> float:
    """CER = Levenshtein(pred, gold) / len(gold). DIAGNOSTIC only — use on a failed
    field to tell an OCR-read error ('45O09281') from a parse error."""
    p, g = str(pred if pred is not None else ""), str(gold if gold is not None else "")
    if not g:
        return 0.0 if not p else 1.0
    dp = list(range(len(g) + 1))
    for i, pc in enumerate(p, 1):
        prev, dp[0] = dp[0], i
        for j, gc in enumerate(g, 1):
            prev, dp[j] = dp[j], min(dp[j] + 1, dp[j - 1] + 1, prev + (pc != gc))
    return round(dp[len(g)] / len(g), 4)


def match_set(pred: list, gold: list) -> dict:
    """Set precision/recall/F1 — the ONLY honest way to score list fields like the
    document checklist (a swapped 'present/missing' scores 0, exact-match can't)."""
    p = {norm_str(x) for x in (pred or [])}
    g = {norm_str(x) for x in (gold or [])}
    tp = len(p & g)
    precision = tp / len(p) if p else (1.0 if not g else 0.0)
    recall = tp / len(g) if g else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "pred_n": len(p),
        "gold_n": len(g),
        "correct": p == g,
    }
