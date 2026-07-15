#!/usr/bin/env bash
# P4.5 — deploy the control plane to Cloud Run + real Firestore (us-central1).
# Prereq (interactive, one time):  gcloud auth login
# Then:  bash backend/cloud/gcp/scripts/deploy_cloud_run.sh
#
# Cost-safe: min-instances=0 (scales to zero, ~$0 idle). All steps idempotent.
set -euo pipefail

PROJECT="${GCP_PROJECT:-just-site-493900-d9}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE:-edge-control-plane}"
SECRET="edge-sync-token"
# Reuse an existing token if set, else generate one.
SYNC_TOKEN="${SYNC_TOKEN:-$(openssl rand -hex 16)}"
SRC="$(cd "$(dirname "$0")/../../../services/api" && pwd)"   # backend/services/api

echo "▶ project=$PROJECT  region=$REGION  service=$SERVICE"
echo "▶ source=$SRC"
gcloud config set project "$PROJECT" >/dev/null

echo "▶ 1/6 enabling APIs …"
gcloud services enable \
  run.googleapis.com firestore.googleapis.com \
  artifactregistry.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com

echo "▶ 2/6 Firestore Native database (idempotent) …"
gcloud firestore databases create --location="$REGION" 2>/dev/null \
  || echo "  (Firestore DB already exists — skipping)"

echo "▶ 3/6 secret $SECRET …"
if gcloud secrets describe "$SECRET" >/dev/null 2>&1; then
  printf "%s" "$SYNC_TOKEN" | gcloud secrets versions add "$SECRET" --data-file=-
else
  printf "%s" "$SYNC_TOKEN" | gcloud secrets create "$SECRET" --data-file=-
fi

echo "▶ 4/6 IAM for the runtime service account …"
PNUM="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
SA="${PNUM}-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" --role="roles/datastore.user" --condition=None >/dev/null
gcloud secrets add-iam-policy-binding "$SECRET" \
  --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor" --condition=None >/dev/null

echo "▶ 5/6 deploy to Cloud Run (Cloud Build builds the Dockerfile) …"
gcloud run deploy "$SERVICE" \
  --source "$SRC" \
  --region "$REGION" \
  --allow-unauthenticated \
  --min-instances=0 \
  --set-env-vars "GCP_PROJECT=${PROJECT},GCP_LOCATION=${REGION}" \
  --update-secrets "SYNC_TOKEN=${SECRET}:latest"

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"

echo "▶ 6/6 smoke test …"
curl -s "$URL/health" && echo

cat <<EOF

✅ Deployed: $URL
   SYNC_TOKEN: $SYNC_TOKEN

Point the edge at it (backend/services/edge-runtime/.env):
   CONTROL_PLANE_URL=$URL
   SYNC_TOKEN=$SYNC_TOKEN

Point the cloud dashboard at it (frontend):
   VITE_CONTROL_PLANE=$URL   (e.g. in frontend/.env.local, then restart vite)

NOTE: if your org policy blocks --allow-unauthenticated, the deploy will warn.
Then either grant roles/run.invoker to the caller, or have the edge send an
identity token. Ask and I'll switch the edge client to authenticated calls.
EOF
