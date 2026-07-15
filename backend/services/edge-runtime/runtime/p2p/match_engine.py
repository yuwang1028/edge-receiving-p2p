"""Four-way match — contract + PO + goods receipt + invoice.

This is the money loop: the REAL goods receipt from the edge receiving decision
is matched against the supplier invoice and the contract. Discrepancies (over-
billing vs accepted qty, price out of tolerance, missing required documents) hold
the invoice and compute exactly what is payable vs blocked — so a dock exception
prevents the wrong payment before it reaches finance.

Pure function over dicts (no DB), so it's trivially testable."""

from __future__ import annotations


def four_way(contract: dict, po: dict, gr: dict, invoice: dict) -> dict:
    accepted = int(gr.get("accepted_quantity", 0))
    billed = int(invoice.get("billed_quantity", 0))
    inv_price = float(invoice.get("unit_price", 0.0))
    contract_price = float(contract.get("unit_price", po.get("unit_price", 0.0)))
    tol = float(contract.get("price_tolerance_pct", 0.0)) / 100.0
    missing_docs = list(gr.get("documents_missing", []))

    checks = []

    # 1) Price vs contract (within tolerance).
    price_ok = contract_price == 0 or abs(inv_price - contract_price) <= contract_price * tol
    checks.append({
        "name": "Price vs contract",
        "ok": price_ok,
        "detail": f"invoice {inv_price:.2f} vs contract {contract_price:.2f} (±{tol*100:.0f}%)",
    })

    # 2) Quantity: invoice billed vs goods-receipt accepted.
    qty_ok = billed <= accepted
    over = max(billed - accepted, 0)
    checks.append({
        "name": "Quantity (billed vs accepted)",
        "ok": qty_ok,
        "detail": f"billed {billed} vs accepted {accepted}" + (f" · {over} over-billed" if over else " · ok"),
    })

    # 3) Required documents present.
    docs_ok = not missing_docs
    checks.append({
        "name": "Required documents",
        "ok": docs_ok,
        "detail": "all present" if docs_ok else f"missing: {', '.join(missing_docs)}",
    })

    payable = round(accepted * inv_price, 2)
    blocked = round(over * inv_price, 2)
    status = "matched" if all(c["ok"] for c in checks) else "hold"

    recommended = []
    if status == "hold":
        recommended.append(f"Release payment for {accepted} accepted cartons (${payable:,.0f})")
        if over:
            recommended.append(f"Block {over} over-billed/damaged cartons (${blocked:,.0f}) · open supplier credit")
        if missing_docs:
            recommended.append(f"Hold release until supplier provides: {', '.join(missing_docs)}")
    else:
        recommended.append(f"Release ${payable:,.0f} to AP on {contract.get('payment_terms', 'terms')}")

    return {
        "status": status,
        "checks": checks,
        "payable_amount": payable,
        "blocked_amount": blocked,
        "recommended": recommended,
    }
