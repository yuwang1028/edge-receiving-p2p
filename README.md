# Edge Receiving — agentic procure-to-pay

An **edge-first** agentic procure-to-pay demo. A team of agents handles the busy
work end to end — turning a plant need into a requisition, running the tender,
drafting the purchase order, reading the receiving dock, and running the invoice
match — while a **human approves every decision**.

> **Core principle: AI only extracts and assists. The *decisions* are a
> deterministic rules engine + a human — never a model.**
> And the receiving loop is **edge-first**: it runs on-device, offline; evidence
> photos never leave the dock — only structured events and hashes sync to the cloud.

## The whole flow

```
PR intake ──▶ Sourcing ──▶ PO management ──▶ Edge receiving ──▶ Invoice resolution ──▶ Payment
 (NL→PR)     (spot tender)  (PO + supplier    (on-device OCR/    (four-way match:      (payable vs
             + AI rec)       email + invoice)   damage → rules)    contract·PO·GR·inv)   blocked)
```

One order runs the length of the demo. At every stage an **agent does the work and
recommends**; a **person clicks the decision**; and the console shows the *source of
truth* the decision was made against. Each step hands off to the next with the item
pre-selected. We follow the reference case: BASF · Heidelberg · PO 45009281.

### 1 · PR intake — a need becomes a requisition
`IntakeConsole` · agent: PR processing

A plant need arrives in plain language (chat or an email in the inbox). The PR agent
turns that one sentence into a structured, compliant purchase requisition — material
+ material code, quantity, UOM, estimated value, cost center, G/L account, budget
check — and auto-fills the form (you watch the fields populate). The buyer reviews,
edits if needed, and **approves**. It hands off to Sourcing with the requisition
pre-selected. *Model only turns NL → structured fields; the human approves.*

### 2 · Sourcing — spot tender + a reasoned recommendation
`SourcingConsole` · agent: Spot buying

For the approved requisition the sourcing agent runs a spot tender and returns a
prominent **AI recommendation**: the winning supplier and *why*, scored on a weighted
rubric (price · lead time · risk · contract fit) with the runner-up gap called out.
The buyer keeps the pick and **awards**. Hands off to PO management. *The rubric is
deterministic from the bids; the recommendation explains, the human awards.*

### 3 · PO management — PO, supplier email, and the invoice
`POConsole` · agent: PO management

The agent turns the award into a real purchase order (PO number, contract terms, and
the **receiving controls** the edge device will later verify: expected quantity ±2%
tolerance, required documents). It then drafts the supplier confirmation email — and
you watch the agent type it. The buyer **sends** it; the supplier replies with the
invoice (a brief wait, then a centered email pops up); the buyer **confirms & uploads**
it. Hands off to Edge receiving. *Deterministic PO + a drafted email; the human sends
and confirms.*

### 4 · Edge receiving — on-device, offline, images stay on the dock
`EdgeReceivingLive` · agent: Edge receiving  ·  **the differentiator**

The delivery arrives. At the dock, evidence is captured (packing list, carton label,
damage photo — real phone photos, HEIC/JPEG). **On-device AI reads it** — classical
OCR + barcode + damage detection — entirely offline; the photos never leave the
device, only hashes do. Then the **deterministic rules engine** (not a model) makes
the call against the PO's controls: 40 ordered, **42 received (+2 over)**, **2 cartons
damaged**, and the **batch certificate missing** from the box → it computes the payment
exposure and recommends a **partial receipt**. The receiver **approves**; a real goods
receipt is posted. Hands off to Invoice resolution. *AI extracts evidence; rules + a
human decide whether to receive.*

### 5 · Invoice resolution — the four-way match
`InvoiceConsole` · agent: Invoice resolution

AP brings in the supplier invoice (scanned → IDP, or EDI) and runs the **four-way
match**, step by step, each leg validated against its source of truth: **contract ·
purchase order · goods receipt · invoice**. Each row shows a ✓/✗ as the sources line
up. The invoice is **held** with the verdict split out: what is payable vs what is
blocked. *The match is deterministic; the copilot explains, never executes.*

### 6 · Payment — release the payable, block the overpay
`InvoiceConsole` payment run

"Release payment" opens an AP payment run, pre-filled but editable (vendor, house bank
+ IBAN, method, Incoterms, amounts, terms, due date, remittance ref, cost center,
G/L). The analyst **confirms**: **$16,840 released** for the goods truly accepted,
**$842 blocked** — the overpay on the 2 damaged + over-shipped cartons, prevented.

### Then · Control tower
`CloudControlTower` · every site, every decision — synced to the cloud as structured
events + evidence **hashes only**, never the raw images.

---

Throughout, a per-console **copilot** (a grounded agent loop) can explain *why* — it
answers only from the real records via tool calls and an intent-gate blocks any action
the user didn't explicitly ask for, so it never fires a payment on its own.

## Quickstart

Two processes: the edge runtime (backend, port 8077) and the operator console
(frontend, port 5173).

```bash
# 1) Backend — the on-device edge runtime (FastAPI). Runs fully offline, no cloud creds.
PORT=8077 backend/scripts/run_edge_runtime.sh        # docs at http://localhost:8077/docs

# 2) Frontend — the operator console (Vite + React)
cd frontend && npm install && npm run dev            # http://localhost:5173
```

The live receiving/invoice pages hit the edge runtime at `:8077`; the rest of the
consoles are backend-driven too.

## Architecture

```
frontend/                     Vite 8 + React 19 + TS + Tailwind v4 — the operator console
  src/views/                  IntakeConsole · SourcingConsole · POConsole ·
                              EdgeReceivingLive · InvoiceConsole · CloudControlTower · Cockpit
  src/lib/edgeApi.ts          typed client for the edge runtime

backend/
  services/
    edge-runtime/             the on-device closed loop (capture → extract → rules →
                              approve → local audit → offline sync queue). SQLite local store.
    rules-engine/             deterministic receiving-risk detectors (the decision layer)
    audit/                    immutable audit package builder
    api/                      cloud control plane (FastAPI) — reads a Firestore-backed
                              fleet view; edge syncs structured events + evidence hashes
    connectors/ vertex-ai-worker/
  evals/                      metrics/eval harness (see below)
  cloud/ infra/ configs/      GCP (Cloud Run + Firestore), Terraform, model configs
  scripts/                    run_edge_runtime.sh · run_control_plane.sh · seed · simulate
```

### Extraction providers (pluggable)

The extractor is swappable via `INFER_PROVIDER` — decisions and UI are unchanged
across all of them:

| provider | what it is | notes |
|---|---|---|
| `mock` | instant canned extraction | fastest for UI work |
| `classical` | **Tesseract OCR + barcode + damage detector** | the Jetson target; offline, ~sub-second, no tokens |
| `vertex` | Gemini via `google-genai` | most accurate; needs GCP ADC |
| `local` | local VLM via Ollama | fully offline VLM; slower, less accurate |

Damage detection currently falls back to a caption/pinned count — **a trained YOLO
is not yet wired** (scaffold in `backend/data/model_training/`).

### Modes

`EDGE_MODE=offline|gcp` gates only the cloud layer. Extraction is on-device in
**both**; `offline` queues sync events locally, `gcp` syncs to the Cloud Run
control plane + Firestore. Runtime-switchable via the console or `POST /api/mode`.

## Eval harness

`backend/evals/` measures the pipeline the way a buyer judges it — per-step
extraction accuracy, end-to-end decision accuracy, and above all the
**false-auto-accept rate** (should-stop deliveries that slipped through) — per
provider. Synthetic evidence + gold labels are generated together, so cases ship
with free ground truth.

```bash
cd backend/services/edge-runtime
./.venv/bin/python ../../evals/tools/gen_docs.py --tier hero          # generate synthetic cases
./.venv/bin/python ../../evals/runners/run_eval.py --tier hero --provider classical
```

Data tiers favor coverage over volume: **hero** (10–20, smoke) → **benchmark**
(50–100, real accuracy + provider comparison) → **regression** (500–1000, stress).
See [backend/evals/README.md](backend/evals/README.md).

## Cloud control plane

Deployed on Cloud Run (`us-central1`) with a Firestore-backed fleet view. The edge
syncs `decisions/` (immutable audit events), `cases/` (latest state), and
`devices/` (heartbeat) — **evidence sha256 hashes only, never raw images**. The
"Control tower · cloud" console reads it. Deploy: `backend/cloud/gcp/scripts/`.

## Notes

- Local secrets live in `.env` / `.env.local` (git-ignored); copy the `.env.example`
  files to start.
- The frontend is the sole operator UI; older narrative/mock consoles remain for the
  scripted pitch walkthrough.
