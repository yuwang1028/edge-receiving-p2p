"""Control-plane API entrypoint (Cloud Run).

Run locally against the Firestore emulator:
    cd backend/services/api
    FIRESTORE_EMULATOR_HOST=localhost:8085 uvicorn main:app --port 8090
(or use backend/scripts/run_control_plane.sh which also starts the emulator)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router
from app.settings import settings

app = FastAPI(title="Edge Receiving — control plane")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root() -> dict:
    return {"service": "control-plane-api", "project": settings.gcp_project}
