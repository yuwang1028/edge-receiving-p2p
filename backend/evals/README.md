# Edge Receiving — eval harness

Measures the receiving pipeline the way the buyer judges it: **did we extract the
right facts, make the right controlled decision, and never wave through something we
should have stopped** — per step and end-to-end, per provider.

## Layout

```
evals/
├── cases/{hero,benchmark,regression}/*.json   # gold cases (one per business scenario)
├── assets/<case_id>/*.png                      # generated evidence images
├── tools/gen_docs.py                           # synthetic evidence + gold generator
├── metrics/                                     # field / decision / calibration matchers
├── runners/run_eval.py                          # drives run_extraction -> rules, scores, writes scorecard
└── reports/scorecard_<tier>_<provider>.md
```

## Run

Always use the edge-runtime venv (has Tesseract + the runtime package):

```bash
cd backend/services/edge-runtime
./.venv/bin/python ../../evals/tools/gen_docs.py --tier hero          # (re)generate synthetic cases
./.venv/bin/python ../../evals/runners/run_eval.py --tier hero --provider classical
```

`--provider classical|vertex|local` · `--enrichment` includes the optional
damage-summary VLM in latency (off by default; it does not affect the decision).

## Metric families (see scorecard sections A–G)

- **A Field extraction** — string (normalized/fuzzy), numeric (exact + MAE), set (P/R/F1 for the doc checklist).
- **B Document completeness** — missing-doc recall is the critical false-negative.
- **C Visual damage** — **N/A until a YOLO is trained**; count is a caption/pinned fallback, not vision.
- **D E2E decision** — accuracy + **false-auto-accept rate** (the number to optimize), by scenario.
- **E Error absorption** — extraction errors absorbed by rules vs flipped the decision (the edge-first thesis).
- **F Latency/cost** — core-path timing; tokens=0 for classical.
- **G Calibration (ECE)** — needs the benchmark tier (50–100) to be meaningful.

## Data tiers (coverage over volume)

- **hero** (10–20): smoke / every-commit; must stay 100%.
- **benchmark** (50–100): the real accuracy + provider comparison; covers the ~20 scenario types.
- **regression** (500–1000): stress — layouts, fonts, noise, image quality. Only after the above.

Add a case = add a dict to `SCENARIOS` in `gen_docs.py` (auto evidence + gold), or drop a
hand-authored gold JSON referencing real evidence (like `cases/hero/basf_over_missing_batch.json`).
