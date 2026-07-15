"""Edge runtime entrypoint.

Run from this directory so `runtime` is the top package:
    cd backend/services/edge-runtime
    uvicorn main:app --reload --port 8000

Edge-first: works fully offline with the mock provider (no cloud creds). The
operator console (Vite app) talks to this on :8000.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from runtime.local_api.routes import router
from runtime.local_store.local_database import SessionLocal, init_db
from runtime.local_store.seed import seed_if_empty
from runtime.settings import settings
from runtime.sync.sync_worker import flush as _flush

# How often the background flusher tries to drain the offline queue (seconds).
_FLUSH_INTERVAL = 15


async def _background_flusher():
    """Reconnect drain: whenever a control plane is reachable, push queued
    events. Runs only if CONTROL_PLANE_URL is configured."""
    while True:
        await asyncio.sleep(_FLUSH_INTERVAL)
        if not settings.control_plane_url:
            continue
        try:
            db = SessionLocal()
            try:
                await asyncio.to_thread(_flush, db)
            finally:
                db.close()
        except Exception:
            pass  # best-effort; never crash the runtime over sync


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    task = asyncio.create_task(_background_flusher())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title="Edge Receiving Control Agent — edge runtime", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root() -> dict:
    return {
        "service": "edge-runtime",
        "mode": settings.mode,
        "device": settings.device_id,
        "site": settings.site_id,
        "docs": "/docs",
    }
