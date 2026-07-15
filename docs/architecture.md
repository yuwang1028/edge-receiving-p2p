# Architecture — Edge Receiving Control Agent

> Local AI turns dock evidence into governed, auditable P2P decisions.
> **Edge-first: the cloud is an optional path.** No network → the edge still
> recognizes, decides, approves, and keeps an audit record. With network → only
> structured events + evidence **hashes** sync up; raw images never leave the device.

**Legend:** 🟢 green = built (P1, runs today) · ⬜ dashed = planned (P3–P8).

---

## 1. System architecture

```mermaid
flowchart TB
  classDef built fill:#d4f4dd,stroke:#2f8f4e,color:#0b3d1f
  classDef planned fill:#eef1f5,stroke:#9aa6b2,color:#55606b,stroke-dasharray:5 3

  subgraph CAP["Receiving dock — capture"]
    EV["Packing list · carton label<br/>pallet · damage photo"]
  end

  subgraph EDGE["EDGE DEVICE (Jetson / local runtime) — runs fully offline"]
    INF["Inference pipeline<br/>OCR · VLM extractor · damage detector · barcode"]
    PROV["Extractor provider — swap by env<br/>mock → Vertex(boot) → local VLM → Jetson"]
    POC[("Local PO cache<br/>SQLite")]
    RULES["Rules engine (deterministic)<br/>qty · damage · missing docs · PO match · confidence"]
    DEC["Recommended decision<br/>+ human approval"]
    AUD[("Local audit store<br/>+ offline sync queue")]
    INF --- PROV
    EV --> INF --> RULES
    POC --> RULES --> DEC --> AUD
  end

  subgraph UI["Frontends"]
    OC["Operator console — dashboard · approval · audit"]
    KIOSK["Edge kiosk — on-device touchscreen"]
  end
  OC <--> DEC
  KIOSK <--> DEC

  AUD -. "structured events + hashes<br/>(only when online)" .-> API

  subgraph CLOUD["GCP control plane — governance (OPTIONAL path)"]
    API["Cloud Run: control-plane-api<br/>POST /edge/events"]
    FS[("Firestore<br/>cases · decisions · audit_events · devices")]
    GCS[("Cloud Storage<br/>audit packages")]
    SW["Pub/Sub → sync-worker"]
    VX["Vertex AI worker — OFF main path<br/>summary · rationale · supplier email · policy QA"]
    API --> FS
    API --> GCS
    API --> SW --> FS
    VX -.-> FS
  end

  subgraph ERP["ERP / WMS connectors (mock first)"]
    SAP["SAP MM · Oracle · Coupa · WMS<br/>goods receipt · quality hold · invoice hold"]
  end
  API -. "approved events" .-> SAP

  class EV,INF,PROV,POC,RULES,DEC,AUD,OC built
  class KIOSK,API,FS,GCS,SW,VX,SAP planned
```

---

## 2. The closed loop (one receiving case)

```mermaid
flowchart LR
  A["1 · Capture evidence<br/>local + hashed"] --> B["2 · Extract fields<br/>on-device AI"]
  B --> C["3 · Match purchase order<br/>local PO cache"]
  C --> D["4 · Evaluate receiving risk<br/>rules engine"]
  D --> E["5 · Human approval"]
  E --> F["6 · Execute actions<br/>GR · quality hold · invoice hold"]
  F --> G["7 · Audit package<br/>+ queue sync event"]
```

Hero case (built, verified): BASF · Heidelberg · PO 45009281 · ordered 40 ·
detected 42 · 2 damaged · missing batch certificate → **partial receipt + invoice
hold** (PO-match 95, exception EXC-0041).

---

## 3. Operating modes

| Mode | Network | Extraction | Decision | What syncs to cloud |
|------|---------|------------|----------|---------------------|
| **Offline edge** | none | on-device | local rules + human | nothing (queued) |
| **Cloud sync** | online | on-device | local rules + human | structured events + hashes |
| **Vertex enhanced** | online | on-device | local rules + human | events + optional Vertex summaries/email |

The decision path is identical in all three modes. Vertex AI only ever *explains*
— it never decides whether to receive goods.

---

## 4. Pluggable extractor — same interface, four backends

| Phase | Provider | Where it runs | Status |
|-------|----------|---------------|--------|
| P1 | `mock` | edge, no deps | ✅ built |
| P3 | `vertex` | Vertex AI Gemini (bootstrap) | ⬜ planned |
| P5 | `local` | on-device VLM (Ollama / Qwen2-VL) | ⬜ planned |
| P7 | `jetson` | Jetson TensorRT (OCR + YOLO damage) | ⬜ planned |

Set `INFER_PROVIDER`; nothing else in the loop changes.

---

## 5. Build status (roadmap)

| Phase | Scope | Status |
|-------|-------|--------|
| P1 | Edge-runtime closed loop (mock) + rules-engine + audit | ✅ done |
| P2 | Wire `frontend/` to the edge API | next |
| P3 | Vertex bootstrap extractor | planned |
| P4 | GCP control plane (Cloud Run + Firestore + `/edge/events` sync) | planned |
| P5 | Local VLM extractor (offline extraction) | planned |
| P6 | Vertex enhancement worker | planned |
| P7 | Jetson + camera + TensorRT | planned |
| P8 | Mock ERP connector (SAP MM) | planned |

---

## 6. Repo map

```
frontend/                      Vite + React operator console
backend/
  services/
    edge-runtime/   ✅ runtime/{inference, local_store, local_api, sync, utils}
    rules-engine/   ✅ deterministic findings → evaluation
    audit/          ✅ hashing · decision trace · package · slim sync event
    api/            ⬜ control-plane-api (Cloud Run + Firestore)
    vertex-ai-worker/ ⬜ enhancement layer
    connectors/     ⬜ mock SAP/Oracle/Coupa/WMS
  cloud/gcp/        ⬜ terraform · cloud-run · firestore · storage · vertex
  infra/            ⬜ docker · systemd · jetson
docs/               this file + product/demo/roi/api specs
```
