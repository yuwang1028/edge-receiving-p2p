#!/usr/bin/env bash
# Local control plane = Firestore emulator + control-plane-api. Zero cloud cost.
#   backend/scripts/run_control_plane.sh
# Emulator on :8085, API on :8090. Edge syncs here when CONTROL_PLANE_URL=http://localhost:8090.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/../services/api" && pwd)"
cd "$HERE"

# venv
[ -d .venv ] || python3 -m venv .venv
./.venv/bin/python -m pip install -q -r requirements.txt

# Firestore emulator (background)
echo "Starting Firestore emulator on :8085 …"
gcloud emulators firestore start --host-port=localhost:8085 >/tmp/firestore_emu.log 2>&1 &
EMU_PID=$!
trap 'kill $EMU_PID 2>/dev/null' EXIT
sleep 6

export FIRESTORE_EMULATOR_HOST=localhost:8085
export SYNC_TOKEN=dev-sync-token
export GCP_PROJECT=just-site-493900-d9

echo "Control plane on http://localhost:8090  (emulator-backed, no cloud cost)"
exec ./.venv/bin/python -m uvicorn main:app --port 8090
