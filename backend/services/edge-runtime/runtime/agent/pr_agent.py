"""PR-processing agent — read the human's natural-language need and turn it into
a structured, catalogued purchase requisition via the shared agent loop (reason →
call tool → observe). The model's ONLY job is the unstructured part: understand
the need and match it to a catalog material + quantity. Everything money-related
(estimated value, budget check) is reconciled deterministically against the
catalog. The PR says WHAT is needed — it does NOT pick a supplier; that happens
downstream in sourcing.

A deterministic matcher validates / backstops the LLM so the loop can never break
the flow (parse failure or Ollama down → rules still produce a valid PR)."""

from __future__ import annotations

import json
import re

from ..agent.loop import run_ollama_agent, run_vertex_agent
from ..connectors.erp import load_cost_centers, load_gl_accounts, load_materials
from ..mode import use_vertex_assist

PURCH_ORG = "1000 · Central Procurement"
PURCH_GROUP = {"Chemicals": "210 · Chemicals", "MRO": "200 · MRO / Maintenance"}

_SYSTEM = (
    "You are the PR (purchase requisition) processing agent for procurement. Read the buyer's "
    "natural-language need and turn it into ONE structured purchase requisition.\n"
    "Your job is ONLY to understand the need and match it to a catalog material + quantity — "
    "use the catalog tool, never guess a code. Do NOT choose a supplier or a price; supplier "
    "selection happens later in sourcing.\n"
    "When done, reply with ONLY a JSON object (no prose, no code fence):\n"
    '{"material": str, "material_code": str, "category": str, "quantity": int, "unit": str, '
    '"justification": str}'
)


def _spec(name: str, desc: str) -> dict:
    return {"type": "function", "function": {"name": name, "description": desc, "parameters": {"type": "object", "properties": {}}}}


def _best_material(text: str, catalog: list[dict]) -> dict | None:
    low = text.lower()
    best, score = None, 0
    for m in catalog:
        words = [w for w in re.split(r"\W+", m["name"].lower()) if len(w) > 2]
        hits = sum(1 for w in words if w in low)
        if m["material_code"].lower() in low:
            hits += 5
        if hits > score:
            best, score = m, hits
    return best if score else None


def _deterministic(text: str) -> dict:
    """Rules-only PR — also used to validate/backfill the LLM output."""
    catalog = load_materials()
    mat = _best_material(text, catalog) or (catalog[0] if catalog else {})
    qty_m = re.search(r"(\d[\d,]*)", text)
    qty = int(qty_m.group(1).replace(",", "")) if qty_m else 1
    return {
        "material": mat.get("name", ""),
        "material_code": mat.get("material_code", ""),
        "category": mat.get("category", ""),
        "quantity": qty,
        "unit": mat.get("unit", ""),
        "justification": text.strip(),
    }


def _assign_accounts(plant: str, category: str) -> dict:
    """Deterministic requisition header + account assignment from ERP master data."""
    ccs = load_cost_centers()
    gls = load_gl_accounts()
    cc = next((c for c in ccs if c["plant"] == plant and c["category"] == category), None) \
        or next((c for c in ccs if c["category"] == category), None)
    gl = next((g for g in gls if g["category"] == category), None)
    return {
        "pr_type": "NB · Standard requisition",
        "purch_org": PURCH_ORG,
        "purch_group": PURCH_GROUP.get(category, "200 · MRO / Maintenance"),
        "cost_center": f"{cc['cost_center']} · {cc['description']}" if cc else "",
        "cost_center_code": cc["cost_center"] if cc else "",
        "gl_account": f"{gl['gl']} · {gl['description']}" if gl else "",
        "gl_code": gl["gl"] if gl else "",
    }


def _parse_json(reply: str) -> dict | None:
    m = re.search(r"\{.*\}", reply, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return None


def create_pr(request: str, plant: str = "Heidelberg") -> dict:
    """Run the agent loop; validate against the catalog; backstop with rules.
    Returns the structured PR fields (no supplier) + the agent's reasoning."""
    catalog = load_materials()
    specs = {
        "get_material_catalog": _spec("get_material_catalog", "The material catalog: code, name, category, unit, indicative price."),
    }
    impls = {"get_material_catalog": lambda: catalog}
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": f"Need: {request}"},
    ]

    reply = ""
    try:
        if use_vertex_assist():
            reply = run_vertex_agent(_SYSTEM, messages, list(impls.values()))
        else:
            reply = run_ollama_agent(messages, list(specs.values()), impls)
    except Exception:
        try:
            reply = run_ollama_agent(messages, list(specs.values()), impls)
        except Exception:
            reply = ""

    rules = _deterministic(request)
    llm = _parse_json(reply) or {}
    codes = {m["material_code"] for m in catalog}
    pr = rules.copy()
    if llm.get("material_code") in codes:
        pr.update({k: llm[k] for k in ("material", "material_code", "category", "unit") if llm.get(k)})
        if isinstance(llm.get("quantity"), int) and llm["quantity"] > 0:
            pr["quantity"] = llm["quantity"]
        if llm.get("justification"):
            pr["justification"] = llm["justification"]
        source = "agent-loop (LLM matched the catalog material)"
    else:
        source = "rules fallback (LLM unavailable or off-catalog)"

    # Estimated value comes from the catalog (a budget figure, NOT a quoted price).
    mat = next((m for m in catalog if m["material_code"] == pr["material_code"]), None)
    matched = mat is not None
    if mat:
        pr["unit_price"] = mat["indicative_price"]
        pr["category"] = mat["category"]
        pr["unit"] = mat["unit"]
    else:
        pr["unit_price"] = 0.0
    pr["amount"] = round(pr["quantity"] * pr["unit_price"], 2)
    pr["budget_ok"] = pr["amount"] <= 500_000

    # Requisition header + account assignment from master data (deterministic).
    pr.update(_assign_accounts(plant, pr["category"]))

    # Confidence + gaps the human should confirm.
    qty_explicit = bool(re.search(r"\d", request))
    flags = []
    if not qty_explicit:
        flags.append("Quantity assumed (1) — confirm with the requester")
    if not matched:
        flags.append("No exact catalog match — material needs review")
    confidence = 0.86 if (matched and qty_explicit) else 0.62 if matched else 0.4

    pr["reasoning"] = (reply or "").strip()[:1200]
    pr["source"] = source
    pr["confidence"] = confidence
    pr["flags"] = flags
    pr["master_data"] = {
        "materials": catalog,
        "costCenters": load_cost_centers(),
        "glAccounts": load_gl_accounts(),
    }
    pr["matched_codes"] = {
        "materialCode": pr["material_code"],
        "costCenter": pr.get("cost_center_code", ""),
        "gl": pr.get("gl_code", ""),
    }
    return pr
