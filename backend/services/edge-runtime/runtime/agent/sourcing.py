"""Sourcing / spot-buy — a DETERMINISTIC 3-bid comparison over the approved
supplier pool. No model: bids are scored on a transparent weighted rubric
(price · lead time · risk · on-contract) and the top score is recommended; a
human awards it. This is the kind of structured decision that belongs to rules,
not an LLM."""

from __future__ import annotations

from ..connectors.erp import load_suppliers

# Weighted rubric (sums to 1.0) — surfaced in the rationale so it's auditable.
W_PRICE, W_LEAD, W_RISK, W_CONTRACT = 0.45, 0.25, 0.15, 0.15
_RISK = {"low": 1.0, "medium": 0.6, "high": 0.2}


def source(category: str, quantity: int, base_price: float = 0.0) -> dict:
    pool = [s for s in load_suppliers() if s["category"] == category] or load_suppliers()
    if not pool:
        return {"bids": [], "recommended_supplier": "", "recommended_price": 0.0, "recommended_amount": 0.0, "rationale": "No approved suppliers for this category."}

    # The pool's quote_price encodes RELATIVE competitiveness within a category;
    # each supplier's bid for THIS material = the material's catalog price scaled by
    # how the supplier ranks vs the cheapest (so prices are per-material, not flat).
    qmin = min(s["quote_price"] for s in pool)
    base = base_price if base_price > 0 else qmin
    for s in pool:
        s["_unit"] = round(base * s["quote_price"] / qmin, 2)

    units = [s["_unit"] for s in pool]
    leads = [s["lead_days"] for s in pool]
    pmin, pmax = min(units), max(units)
    lmin, lmax = min(leads), max(leads)

    bids = []
    for s in pool:
        price_score = 1.0 if pmax == pmin else (pmax - s["_unit"]) / (pmax - pmin)
        lead_score = 1.0 if lmax == lmin else (lmax - s["lead_days"]) / (lmax - lmin)
        risk_score = _RISK.get(s["risk"], 0.5)
        contract_score = 1.0 if s["contracted"] else 0.0
        score = round(100 * (W_PRICE * price_score + W_LEAD * lead_score + W_RISK * risk_score + W_CONTRACT * contract_score), 1)
        bids.append({
            "supplier": s["supplier"], "unitPrice": s["_unit"],
            "amount": round(quantity * s["_unit"], 2), "leadDays": s["lead_days"],
            "risk": s["risk"], "contracted": s["contracted"], "score": score,
        })

    bids.sort(key=lambda b: (b["score"], b["contracted"], -b["unitPrice"]), reverse=True)
    winner = bids[0]
    for b in bids:
        b["recommended"] = b["supplier"] == winner["supplier"]

    rationale = (
        f"{winner['supplier']} wins on the weighted score "
        f"(price 45% · lead 25% · risk 15% · contract 15%): "
        f"${winner['unitPrice']:.0f}/unit, {winner['leadDays']}d lead, {winner['risk']} risk"
        f"{', on contract' if winner['contracted'] else ', off contract'}. "
        f"{len(bids)} bid(s) compared."
    )
    return {
        "bids": bids,
        "recommended_supplier": winner["supplier"],
        "recommended_price": winner["unitPrice"],
        "recommended_amount": winner["amount"],
        "rationale": rationale,
    }
