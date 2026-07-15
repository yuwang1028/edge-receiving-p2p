"""Evidence extractor — the swappable AI layer.

A provider reads the dock evidence and returns a NORMALIZED extraction (snake_case
internal form). The provider is chosen by `settings.infer_provider`, so the rest
of the loop never changes when we move mock → Vertex (P3) → local VLM (P5) →
Jetson. The decision is NEVER made here — extraction is evidence only; the
rules engine + human make the call.

Normalized extraction shape:
    {
      "provider", "po_number", "supplier", "material", "detected_quantity",
      "unit", "damaged_cartons", "lot_number", "documents_found",
      "documents_missing", "confidence"
    }
"""

from __future__ import annotations

import json
import pathlib
from abc import ABC, abstractmethod

from ..settings import settings


class Extractor(ABC):
    name: str

    @abstractmethod
    def extract(self, po: dict, evidence: list[dict], model: str | None = None) -> dict:
        """po: the matched PurchaseOrder as a dict; evidence: [{kind, path, ...}].
        `model` optionally overrides the provider's model (used for tiered escalation)."""


# ── Shared, network-free helpers (unit-tested) ──────────────────────────────

def _norm_doc(s: str) -> str:
    return "".join(ch for ch in str(s).lower() if ch.isalnum())


def to_extraction(raw: dict, po: dict, provider: str) -> dict:
    """Map a model's raw JSON onto the normalized extraction, reconciling the
    documents against the PO's required list (so found/missing stay authoritative
    even if the model phrases a name slightly differently)."""
    required = list(po.get("required_documents", []))
    present = {_norm_doc(x) for x in (raw.get("documents_present") or [])}
    found = [d for d in required if _norm_doc(d) in present]
    missing = [d for d in required if d not in found]
    try:
        conf = max(0.0, min(1.0, float(raw.get("confidence", 0) or 0)))
    except (TypeError, ValueError):
        conf = 0.0
    return {
        "provider": provider,
        "po_number": (raw.get("po_number") or po.get("po_number", "")).strip(),
        "supplier": (raw.get("supplier") or po.get("supplier", "")).strip(),
        "material": (raw.get("material") or po.get("material", "")).strip(),
        "detected_quantity": int(raw.get("detected_quantity") or 0),
        "unit": (raw.get("unit") or po.get("unit", "")).strip(),
        "damaged_cartons": int(raw.get("damaged_cartons") or 0),
        "lot_number": (raw.get("lot_number") or "").strip(),
        "documents_found": found,
        "documents_missing": missing,
        "confidence": conf,
    }


def merge_raws(raws: list[dict]) -> dict:
    """Merge per-image VLM reads into one raw extraction. Single-image vision
    models (e.g. llama3.2-vision) only take one image per call, so each evidence
    photo is read separately: the packing list yields PO/qty/lot/docs, the damage
    photo yields damaged count. Take first non-empty identity fields, max damaged,
    union of documents, min confidence."""
    merged: dict = {"documents_present": [], "damaged_cartons": 0}
    conf = []
    for raw in raws:
        for k in ("po_number", "supplier", "material", "unit", "lot_number"):
            if not merged.get(k) and raw.get(k):
                merged[k] = raw[k]
        if not merged.get("detected_quantity") and raw.get("detected_quantity"):
            merged["detected_quantity"] = raw["detected_quantity"]
        try:
            merged["damaged_cartons"] = max(merged["damaged_cartons"], int(raw.get("damaged_cartons") or 0))
        except (TypeError, ValueError):
            pass
        for doc in raw.get("documents_present") or []:
            if doc not in merged["documents_present"]:
                merged["documents_present"].append(doc)
        if raw.get("confidence") is not None:
            try:
                conf.append(float(raw["confidence"]))
            except (TypeError, ValueError):
                pass
    merged["confidence"] = min(conf) if conf else 0.0
    return merged


def build_prompt(po: dict) -> str:
    req = ", ".join(po.get("required_documents", [])) or "(none)"
    return (
        "You are an edge AI on a factory receiving dock. You are given photos of an "
        "inbound delivery (packing list, carton/shipping-mark labels, pallet, and any "
        "damage photos). Read them and extract the goods-receipt facts as JSON.\n\n"
        "Purchase order context (for matching, do NOT just copy it — report what the "
        "EVIDENCE actually shows):\n"
        f"- po_number: {po.get('po_number','')}\n"
        f"- supplier: {po.get('supplier','')}\n"
        f"- material: {po.get('material','')}\n"
        f"- expected_quantity: {po.get('expected_quantity','')} {po.get('unit','')}\n"
        f"- required_documents: [{req}]\n\n"
        "Extract:\n"
        "- po_number, supplier, material, lot_number — as printed on the evidence\n"
        "- detected_quantity — the quantity actually delivered per the evidence "
        "(carton/unit count from the packing list and/or pallet), as an integer\n"
        "- unit — e.g. cartons, bags\n"
        "- damaged_cartons — count of cartons/units showing packaging damage in the "
        "photos (0 if none)\n"
        "- documents_present — the subset of the required_documents list above that is "
        "actually visible in the evidence (use the EXACT strings from that list)\n"
        "- confidence — your overall confidence 0..1\n"
        "Return ONLY the JSON object."
    )


# Pydantic schema → forces structured JSON out of Gemini.
def _response_model():
    from pydantic import BaseModel

    class VertexFields(BaseModel):
        po_number: str = ""
        supplier: str = ""
        material: str = ""
        detected_quantity: int = 0
        unit: str = ""
        damaged_cartons: int = 0
        lot_number: str = ""
        documents_present: list[str] = []
        confidence: float = 0.0

    return VertexFields


_MIME = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
}


# ── Providers ───────────────────────────────────────────────────────────────

class MockExtractor(Extractor):
    """Canned-but-PO-derived result, zero deps. Reproduces the hero case:
    over-delivery by 2, 2 damaged cartons, missing batch certificate."""

    name = "mock"

    def extract(self, po: dict, evidence: list[dict], model: str | None = None) -> dict:
        required = list(po.get("required_documents", []))
        found = [d for d in required if d.lower() != "batch certificate"]
        missing = [d for d in required if d not in found]
        expected = int(po.get("expected_quantity", 0))
        return {
            "provider": self.name,
            "model": "mock",
            "po_number": po.get("po_number", ""),
            "supplier": po.get("supplier", ""),
            "material": po.get("material", ""),
            "detected_quantity": expected + 2,
            "unit": po.get("unit", ""),
            "damaged_cartons": 2,
            "lot_number": "LOT-2026-0617",
            "documents_found": found,
            "documents_missing": missing,
            "confidence": 0.94,
        }


class VertexExtractor(Extractor):
    """Vertex AI Gemini multimodal — reads the actual evidence images. Bootstrap
    extraction before a local model exists. Needs google-genai + GCP ADC creds
    (see requirements-vertex.txt and .env.example)."""

    name = "vertex"

    def extract(self, po: dict, evidence: list[dict], model: str | None = None) -> dict:
        mdl = model or settings.vertex_model
        try:
            from google import genai
            from google.genai import types
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "google-genai not installed — `pip install -r requirements-vertex.txt`"
            ) from e

        if not settings.gcp_project:
            raise RuntimeError("GCP_PROJECT is not set — required for INFER_PROVIDER=vertex")

        parts = []
        for ev in evidence:
            path = ev.get("path") or ""
            mime = _MIME.get(pathlib.Path(path).suffix.lower())
            if not path or not mime or not pathlib.Path(path).exists():
                continue
            parts.append(types.Part.from_bytes(data=pathlib.Path(path).read_bytes(), mime_type=mime))
        if not parts:
            raise RuntimeError("No readable image evidence for Vertex extraction")

        client = genai.Client(
            vertexai=True, project=settings.gcp_project, location=settings.gcp_location
        )
        resp = client.models.generate_content(
            model=mdl,
            contents=[build_prompt(po), *parts],
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
                response_schema=_response_model(),
            ),
        )
        raw = json.loads(resp.text)
        out = to_extraction(raw, po, self.name)
        out["model"] = mdl
        return out


class LocalVLMExtractor(Extractor):
    """On-device VLM via an Ollama-compatible server — the OFFLINE edge route, so
    evidence never leaves the device. Sends the normalized JPEGs as base64 with
    the SAME prompt + JSON parsing as the Vertex provider, so the rest of the loop
    is identical.

    This is the fastest local route (P5) and is ONE provider, not the only choice:
    on Jetson, production goes to a classical OCR + barcode + YOLO-damage pipeline
    with a small VLM only as fallback, TensorRT-optimized (P7). The VLM extracts
    EVIDENCE; the rules engine + human still make the decision."""

    name = "local"

    def extract(self, po: dict, evidence: list[dict], model: str | None = None) -> dict:
        import base64

        import httpx

        mdl = model or settings.local_llm_model
        images = []
        for ev in evidence:
            p = pathlib.Path(ev.get("path") or "")
            if p.suffix.lower() in _MIME and p.exists():
                images.append(base64.b64encode(p.read_bytes()).decode("ascii"))
        if not images:
            raise RuntimeError("No readable image evidence for local VLM extraction")

        url = settings.local_llm_url.rstrip("/") + "/api/generate"
        prompt = build_prompt(po)
        raws = []
        # One call per image — single-image vision models reject multi-image requests.
        for img in images:
            payload = {
                "model": mdl,
                "prompt": prompt,
                "images": [img],
                "stream": False,
                "format": "json",
                "options": {"temperature": 0},
            }
            try:
                resp = httpx.post(url, json=payload, timeout=300.0)
                resp.raise_for_status()
            except Exception as e:
                raise RuntimeError(
                    f"Local VLM (Ollama) call failed at {settings.local_llm_url} — is `ollama serve` "
                    f"running and a VISION model pulled (`ollama pull {mdl}`)? {e}"
                ) from e
            try:
                raws.append(json.loads(resp.json().get("response", "{}")))
            except json.JSONDecodeError:
                pass  # skip an image whose JSON didn't parse; others still count

        out = to_extraction(merge_raws(raws), po, self.name)
        out["model"] = mdl
        return out


class ClassicalPipelineExtractor(Extractor):
    """The Jetson-target form: OCR + barcode + YOLO-damage, NO large VLM. Reads the
    structured fields with Tesseract (steady on printed text), confirms IDs with a
    barcode decode, and counts damaged cartons with the damage detector. Fixes the
    local VLM's weak spots (it read the document checklist reliably and counts via
    OCR/CV, not free-form guessing). Output shape is identical to the other
    providers, so rules engine + UI are unchanged."""

    name = "classical"

    def extract(self, po: dict, evidence: list[dict], model: str | None = None) -> dict:
        from . import barcode_reader, damage_detector, document_classifier, field_normalizer, ocr_engine

        texts, barcodes = [], []
        damaged, dmg_method = 0, "none"
        for ev in evidence:
            p = pathlib.Path(ev.get("path") or "")
            if p.suffix.lower() not in _MIME or not p.exists():
                continue
            text = ocr_engine.ocr_text(str(p))
            texts.append(text)
            barcodes += barcode_reader.read_barcodes(str(p))
            dmg = damage_detector.detect_damage(str(p), text, ev.get("kind", ""))
            if dmg["damaged_cartons"] > damaged:
                damaged, dmg_method = dmg["damaged_cartons"], dmg["method"]

        if not texts:
            raise RuntimeError("No readable image evidence for the classical pipeline")

        full = "\n".join(texts)
        fields = field_normalizer.parse_fields_from_text(full, po)
        found, _missing = document_classifier.enclosed_documents(full, po.get("required_documents", []))

        # You can't damage more units than were received — cap it.
        if fields.get("detected_quantity"):
            damaged = min(damaged, fields["detected_quantity"])

        got = sum(1 for k in ("po_number", "detected_quantity", "lot_number") if fields.get(k))
        confidence = round(0.90 + 0.03 * got / 3, 2)  # ~0.93 when all three read

        raw = {
            "po_number": fields["po_number"],
            "supplier": fields["supplier"] or po.get("supplier", ""),
            "material": fields["material"] or po.get("material", ""),
            "detected_quantity": fields["detected_quantity"],
            "unit": fields["unit"],
            "damaged_cartons": damaged,
            "lot_number": fields["lot_number"],
            "documents_present": found,
            "confidence": confidence,
        }
        out = to_extraction(raw, po, self.name)
        out["model"] = f"ocr+barcode+damage({dmg_method})"
        if barcodes:
            out["model"] += f" · barcode:{barcodes[0]}"
        return out


_PROVIDERS = {
    p.name: p
    for p in (MockExtractor(), VertexExtractor(), LocalVLMExtractor(), ClassicalPipelineExtractor())
}


def get_extractor() -> Extractor:
    provider = _PROVIDERS.get(settings.infer_provider)
    if provider is None:
        raise ValueError(f"Unknown INFER_PROVIDER: {settings.infer_provider!r}")
    return provider
