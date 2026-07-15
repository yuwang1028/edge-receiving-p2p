"""Document type + enclosed-documents resolution from OCR text. This replaces the
VLM's unreliable checklist reading (which inverted CoA/Batch cert): we read the
'ENCLOSED DOCUMENTS' lines literally and honour 'not enclosed' markers."""

from __future__ import annotations

# Canonical required-doc name -> substrings that mean the same thing in print.
_ALIASES: dict[str, list[str]] = {
    "coa": ["coa", "certificate of analysis"],
    "batch certificate": ["batch certificate", "batch cert"],
    "packing list": ["packing list", "packing slip"],
    "delivery note": ["delivery note", "delivery slip"],
}

# Markers that, near a document name, mean it is NOT present.
_ABSENT = ("not enclosed", "not present", "missing", "absent", "n/a")

_DOC_TYPE_HINTS = [
    ("packing_list", ["packing list"]),
    ("carton_label", ["shipping marks", "carton", "this way up"]),
    ("damage_photo", ["damage detected", "crushed", "torn", "wet package"]),
    ("certificate_of_analysis", ["certificate of analysis"]),
    ("batch_certificate", ["batch certificate"]),
    ("purchase_order", ["purchase order"]),
]


def _aliases_for(doc: str) -> list[str]:
    return _ALIASES.get(doc.strip().lower(), [doc.strip().lower()])


def classify(text: str) -> str:
    low = text.lower()
    for dtype, hints in _DOC_TYPE_HINTS:
        if any(h in low for h in hints):
            return dtype
    return "unknown"


def enclosed_documents(text: str, required: list[str]) -> tuple[list[str], list[str]]:
    """Line-based: a doc is MISSING if a line that names it also carries an
    'absent' marker (e.g. 'Batch certificate — not enclosed'); present if named on
    a line with no such marker; missing if never named. Line scope avoids one
    doc's 'not enclosed' bleeding onto the next."""
    lines = [ln for ln in text.lower().splitlines() if ln.strip()]
    found: list[str] = []
    missing: list[str] = []
    for doc in required:
        aliases = _aliases_for(doc)
        doc_lines = [ln for ln in lines if any(a in ln for a in aliases)]
        if not doc_lines:
            missing.append(doc)
        elif any(any(mk in ln for mk in _ABSENT) for ln in doc_lines):
            missing.append(doc)
        else:
            found.append(doc)
    return found, missing
