"""Confidence calibration — does a stated 0.93 actually mean ~93% right?

This is what makes the human-in-the-loop split defensible: the rules engine routes
reads below CONFIDENCE_THRESHOLD (0.85) to a person. If confidence is miscalibrated
you either bury people in false escalations or wave real errors through. ECE needs a
population — meaningless on 1 case, informative at the benchmark tier (50–100).
"""

from __future__ import annotations


def expected_calibration_error(pairs: list[tuple[float, bool]], n_bins: int = 10) -> dict:
    """pairs: [(confidence, is_correct)]. Returns ECE + a reliability table."""
    if not pairs:
        return {"ece": None, "n": 0, "bins": []}
    bins: list[dict] = [{"lo": i / n_bins, "hi": (i + 1) / n_bins, "conf": [], "correct": []} for i in range(n_bins)]
    for conf, correct in pairs:
        idx = min(n_bins - 1, max(0, int(conf * n_bins)))
        bins[idx]["conf"].append(conf)
        bins[idx]["correct"].append(1 if correct else 0)

    total = len(pairs)
    ece = 0.0
    table = []
    for b in bins:
        cnt = len(b["conf"])
        if not cnt:
            continue
        avg_conf = sum(b["conf"]) / cnt
        acc = sum(b["correct"]) / cnt
        ece += (cnt / total) * abs(avg_conf - acc)
        table.append({
            "range": f"{b['lo']:.1f}-{b['hi']:.1f}",
            "n": cnt,
            "avg_confidence": round(avg_conf, 3),
            "accuracy": round(acc, 3),
            "gap": round(avg_conf - acc, 3),
        })
    return {"ece": round(ece, 4), "n": total, "bins": table}
