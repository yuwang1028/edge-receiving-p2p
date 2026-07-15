"""Render a run's results as a Markdown scorecard — one provider, one dataset."""

from __future__ import annotations


def _p(v: float | None, suffix: str = "%") -> str:
    return "—" if v is None else f"{v}{suffix}"


def render(report: dict) -> str:
    L: list[str] = []
    L.append(f"# Scorecard · {report['provider']} · {report['dataset']}")
    L.append("")
    L.append(f"- cases: **{report['n_cases']}**  ·  tier: {report['tier']}")
    L.append(f"- run: extraction + rules engine, in-process (no cloud)")
    L.append("")

    # A · Field extraction
    L.append("## A · Field extraction")
    L.append("")
    L.append("| field | type | accuracy | detail |")
    L.append("|---|---|---:|---|")
    for f in report["fields"]:
        L.append(f"| {f['field']} | {f['type']} | {_p(f['accuracy'])} | {f['detail']} |")
    L.append("")

    # B · Document completeness (the false-negative that scares buyers)
    d = report["documents"]
    L.append("## B · Document completeness")
    L.append("")
    L.append(f"- required-docs F1: **{_p(d['f1'], '')}**")
    L.append(f"- **missing-document recall: {_p(d['missing_recall'])}**  <- of docs truly missing, how many were caught (the critical false-negative metric)")
    L.append(f"- missing-document precision: {_p(d['missing_precision'])}")
    L.append("")

    # C · Visual exception (YOLO) — honest N/A
    L.append("## C · Visual damage detection")
    L.append("")
    L.append(f"- **status: {report['damage']['status']}**")
    L.append(f"- {report['damage']['note']}")
    L.append("")

    # D+E · Decision / business outcome
    dec = report["decisions"]
    L.append("## D · End-to-end business decision")
    L.append("")
    L.append(f"- E2E decision accuracy: **{_p(dec['e2e_decision_accuracy'])}**")
    L.append(f"- **false-auto-accept rate: {_p(dec['false_auto_accept_rate'])}**  <- should-stop but auto-accepted (drive this to zero)")
    L.append(f"- critical-exception recall: {_p(dec['critical_exception_recall'])}")
    L.append(f"- false-hold rate: {_p(dec['false_hold_rate'])}")
    if dec["false_auto_accept_by_scenario"]:
        L.append("")
        L.append("| scenario | cases | false-auto-accept |")
        L.append("|---|---:|---:|")
        for sc, v in dec["false_auto_accept_by_scenario"].items():
            L.append(f"| {sc} | {v['n']} | {_p(v['rate'])} |")
    L.append("")

    # Error absorption — the edge-first thesis
    ea = report["absorption"]
    L.append("## E · Extraction error → decision (edge-first thesis)")
    L.append("")
    L.append(f"- cases with an extraction error: {ea['cases_with_extraction_error']}")
    L.append(f"- **absorbed by rules (decision still correct): {ea['error_absorbed_by_rules']}**")
    L.append(f"- flipped the decision: {ea['error_flipped_decision']}")
    L.append(f"- absorption rate: {_p(ea['absorption_rate'])}")
    L.append("")

    # F · Latency / cost
    lat = report["latency"]
    L.append("## F · Latency & cost")
    L.append("")
    scope = "includes optional damage-summary enrichment" if lat.get("enrichment_included") else "core decision path (OCR + rules; optional damage-summary enrichment excluded)"
    L.append(f"- timing scope: {scope}")
    L.append(f"- extraction p50: {lat['extract_p50_ms']} ms  ·  p95: {lat['extract_p95_ms']} ms")
    L.append(f"- rules p50: {lat['rules_p50_ms']} ms")
    L.append(f"- tokens / case: {report['cost']['tokens_note']}")
    L.append("")

    # G · Calibration
    cal = report["calibration"]
    L.append("## G · Confidence calibration (ECE)")
    L.append("")
    if cal["ece"] is None or cal["n"] < 20:
        L.append(f"- ECE: {_p(cal['ece'], '')} (n={cal['n']}) — needs the benchmark tier (50-100 cases) to be meaningful")
    else:
        L.append(f"- ECE: **{cal['ece']}** (n={cal['n']}) — lower is better calibrated")
    L.append("")

    return "\n".join(L)
