"""Week-1 eval harness — drives the REAL edge pipeline (run_extraction → rules
engine) in-process over gold cases, scores every field with the right matcher, and
writes a Markdown scorecard. No cloud, no HTTP, no DB.

    cd backend/services/edge-runtime && ./.venv/bin/python \
        ../../evals/runners/run_eval.py --tier hero --provider classical

Adding a case = drop a gold JSON in evals/cases/<tier>/ (see schema in an existing
one). Comparing providers = run again with --provider vertex|local.
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
EDGE = REPO / "backend" / "services" / "edge-runtime"
EVALS = REPO / "backend" / "evals"
sys.path.insert(0, str(EVALS))  # so `metrics.*` imports work

from metrics import calibration, decision_metrics as dm  # noqa: E402
from metrics.field_matchers import char_error_rate, match_numeric, match_set, match_string  # noqa: E402
from metrics.scorecard import render  # noqa: E402

# Which extraction fields to score, and how. `vision` = damage/YOLO step (currently
# a caption/pinned fallback, NOT real CV) — scored but flagged N/A for vision.
FIELD_SPEC = [
    ("po_number", "string", {}),
    ("supplier", "string", {"fuzzy_threshold": 0.85}),
    ("material", "string", {"fuzzy_threshold": 0.8}),
    ("detected_quantity", "numeric", {"tol_abs": 0}),
    ("unit", "string", {}),
    ("lot_number", "string", {}),
    ("documents_found", "set", {}),
    ("documents_missing", "set", {"critical": True}),
    ("damaged_cartons", "numeric", {"tol_abs": 0, "vision": True}),
]


def _bootstrap(provider: str, enrichment: bool):
    os.environ["INFER_PROVIDER"] = provider
    # Damage-summary is an OPTIONAL VLM enrichment (~15s local) that does NOT feed the
    # decision — the damaged COUNT comes from the extractor's damage_detector. Off by
    # default so extraction latency reflects the real core path, not the enrichment.
    os.environ["DAMAGE_SUMMARY"] = "1" if enrichment else "0"
    os.chdir(EDGE)  # match how the server runs (settings/.env, sys.path bootstrap)
    sys.path.insert(0, str(EDGE))
    import runtime  # noqa: F401 — __init__ adds rules-engine/ to sys.path
    from runtime.inference import run_extraction  # noqa: E402
    import engine  # noqa: E402  (rules-engine)

    return run_extraction, engine


def _score_fields(pred: dict, gold: dict) -> list[dict]:
    out = []
    for field, ftype, opts in FIELD_SPEC:
        if field not in gold:
            continue
        pv, gv = pred.get(field), gold[field]
        row = {"field": field, "type": ftype, "vision": opts.get("vision", False),
               "critical": opts.get("critical", False)}
        if ftype == "string":
            r = match_string(pv, gv, opts.get("fuzzy_threshold", 0.9))
            row.update(correct=r["correct"], pred=pv, gold=gv,
                       cer=None if r["correct"] else char_error_rate(pv, gv))
        elif ftype == "numeric":
            r = match_numeric(pv, gv, opts.get("tol_abs", 0.0), opts.get("tol_pct", 0.0))
            row.update(correct=r["correct"], pred=pv, gold=gv, abs_err=r["abs_err"])
        elif ftype == "set":
            r = match_set(pv or [], gv or [])
            row.update(correct=r["correct"], pred=pv, gold=gv, prf=r)
        out.append(row)
    return out


def evaluate_case(case: dict, run_extraction, engine) -> dict:
    po = case["po"]
    evidence = [{"kind": e["kind"], "path": str(REPO / e["path"])} for e in case["evidence"]]
    for e in evidence:
        if not Path(e["path"]).exists():
            raise FileNotFoundError(e["path"])

    t0 = time.perf_counter()
    pred = run_extraction(po, evidence)
    t_extract = (time.perf_counter() - t0) * 1000

    t1 = time.perf_counter()
    ev = engine.evaluate(po, pred, threshold=0.85, case_id=case["case_id"])
    t_rules = (time.perf_counter() - t1) * 1000

    fields = _score_fields(pred, case["gold_extraction"])
    non_vision_ok = all(f["correct"] for f in fields if not f["vision"])
    gold_dec = case["gold_decision"]["decision"]
    dec = dm.decision_row(case["case_id"], case.get("scenario", "?"), gold_dec, ev.get("decision", "?"))
    return {
        "case_id": case["case_id"],
        "scenario": case.get("scenario", "?"),
        "fields": fields,
        "extraction_all_correct": non_vision_ok,
        "decision": dec,
        "decision_correct": dec["correct"],
        "confidence": float(pred.get("confidence", 0.0)),
        "t_extract_ms": round(t_extract, 1),
        "t_rules_ms": round(t_rules, 2),
        "exposure_pred": ev.get("paymentExposure"),
    }


def build_report(results: list[dict], provider: str, tier: str) -> dict:
    # A · per-field accuracy (macro over cases)
    field_names = [f[0] for f in FIELD_SPEC]
    field_rows = []
    for name in field_names:
        cells = [f for r in results for f in r["fields"] if f["field"] == name]
        if not cells:
            continue
        acc = round(100 * sum(c["correct"] for c in cells) / len(cells), 1)
        spec = next(f for f in FIELD_SPEC if f[0] == name)
        detail = ""
        if spec[1] == "numeric":
            errs = [c["abs_err"] for c in cells if c.get("abs_err") is not None]
            if errs:
                detail = f"MAE {round(statistics.mean(errs), 2)}"
            if spec[2].get("vision"):
                detail = (detail + " · " if detail else "") + "caption/pinned fallback — NOT vision"
        elif spec[1] == "set":
            detail = f"P {round(100*statistics.mean(c['prf']['precision'] for c in cells))}% · R {round(100*statistics.mean(c['prf']['recall'] for c in cells))}%"
        field_rows.append({"field": name, "type": spec[1], "accuracy": acc, "detail": detail or "—"})

    # B · document completeness (micro over missing-doc sets)
    miss = [f for r in results for f in r["fields"] if f["field"] == "documents_missing"]
    req_f1 = [f for r in results for f in r["fields"] if f["field"] == "documents_found"]
    tp = sum(f["prf"]["tp"] for f in miss)
    pred_n = sum(f["prf"]["pred_n"] for f in miss)
    gold_n = sum(f["prf"]["gold_n"] for f in miss)
    documents = {
        "missing_recall": None if gold_n == 0 else round(100 * tp / gold_n, 1),
        "missing_precision": None if pred_n == 0 else round(100 * tp / pred_n, 1),
        "f1": round(100 * statistics.mean(f["prf"]["f1"] for f in req_f1), 1) if req_f1 else None,
    }

    # D+E · decisions
    dec_rows = [r["decision"] for r in results]
    decisions = dm.aggregate_decisions(dec_rows)
    absorption = dm.error_absorption([
        {"extraction_all_correct": r["extraction_all_correct"], "decision_correct": r["decision_correct"]}
        for r in results
    ])

    # F · latency
    ex = [r["t_extract_ms"] for r in results]
    ru = [r["t_rules_ms"] for r in results]
    latency = {
        "extract_p50_ms": round(statistics.median(ex), 1),
        "extract_p95_ms": round(_p95(ex), 1),
        "rules_p50_ms": round(statistics.median(ru), 2),
    }

    # G · calibration (case-level: overall confidence vs all-fields-correct)
    pairs = [(r["confidence"], r["extraction_all_correct"]) for r in results]
    cal = calibration.expected_calibration_error(pairs)

    return {
        "provider": provider,
        "dataset": f"{tier} ({len(results)} cases)",
        "tier": tier,
        "n_cases": len(results),
        "fields": field_rows,
        "documents": documents,
        "damage": {
            "status": "N/A — YOLO not trained",
            "note": "damage count comes from a caption/pinned fallback, not visual detection; "
                    "train a YOLO on labelled dock photos to report mAP + count error.",
        },
        "decisions": decisions,
        "absorption": absorption,
        "latency": latency,
        "cost": {"tokens_note": "0 (classical: no tokens; record cpu_ms). vertex/local: instrument usage_metadata / eval_count."},
        "calibration": cal,
    }


def _p95(xs: list[float]) -> float:
    if not xs:
        return 0.0
    s = sorted(xs)
    return s[min(len(s) - 1, int(0.95 * len(s)))]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tier", default="hero")
    ap.add_argument("--provider", default="classical")
    ap.add_argument("--enrichment", action="store_true",
                    help="include the optional damage-summary VLM call in extraction latency (~15s local)")
    args = ap.parse_args()

    case_dir = EVALS / "cases" / args.tier
    case_files = sorted(case_dir.glob("*.json"))
    if not case_files:
        sys.exit(f"no gold cases in {case_dir}")

    run_extraction, engine = _bootstrap(args.provider, args.enrichment)
    results = []
    for cf in case_files:
        case = json.loads(cf.read_text())
        print(f"· {case['case_id']} …", flush=True)
        results.append(evaluate_case(case, run_extraction, engine))

    report = build_report(results, args.provider, args.tier)
    report["latency"]["enrichment_included"] = args.enrichment
    md = render(report)
    out = EVALS / "reports" / f"scorecard_{args.tier}_{args.provider}.md"
    out.write_text(md)
    print("\n" + md)
    print(f"\n→ written {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
