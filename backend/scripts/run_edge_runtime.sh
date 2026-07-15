#!/usr/bin/env bash
# Launch the edge runtime locally — offline, mock provider, no cloud creds.
#   PORT=8077 backend/scripts/run_edge_runtime.sh
# Then open http://localhost:8077/docs
set -euo pipefail
cd "$(dirname "$0")/../services/edge-runtime"
[ -d .venv ] || python3 -m venv .venv
./.venv/bin/python -m pip install -q --upgrade pip
./.venv/bin/python -m pip install -q -r requirements.txt
exec ./.venv/bin/python -m uvicorn main:app --reload --port "${PORT:-8077}"
