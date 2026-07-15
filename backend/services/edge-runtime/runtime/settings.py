"""Edge-runtime configuration. EDGE-FIRST: the full receiving closed loop
(extraction → rules → human approval → local audit) runs locally with no
network. The cloud control plane is optional — when CONTROL_PLANE_URL is set,
approved *structured* events sync up; raw evidence images never leave the device.

Every field is env-overridable and local-first, so the loop runs with no .env at
all (mock extraction, SQLite, local-disk evidence)."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Device identity — stamped on every audit + sync event.
    device_id: str = "dock-3-jetson"
    site_id: str = "heidelberg-plant"

    # Local edge database (SQLite — stays on the device).
    database_url: str = "sqlite:///./edge.db"

    # Evidence storage (local disk — images NEVER leave the device).
    storage_dir: str = "./storage"

    # Extraction provider: mock | vertex | local
    #   mock   — canned, PO-derived result, zero deps (dev / demo)
    #   vertex — Vertex AI Gemini multimodal (bootstrap; wired in P3)
    #   local  — on-device VLM via Ollama-compatible server (the edge target; P5)
    infer_provider: str = "mock"
    confidence_threshold: float = 0.85

    # Vertex AI (bootstrap extraction only — NOT the production decision path)
    gcp_project: str = ""
    gcp_location: str = "us-central1"
    vertex_model: str = "gemini-2.5-flash"
    # Tiered escalation: a flash read below confidence_threshold is re-read once
    # with the stronger (pricier) model before falling back to a human.
    vertex_escalate: bool = True
    vertex_escalation_model: str = "gemini-2.5-pro"

    # Local VLM (Ollama-compatible). Must be a VISION model (sees images).
    # Fast dev route; Jetson production goes to a classical OCR/YOLO + small-VLM
    # + TensorRT pipeline (P7) — this is one provider, not the only choice.
    local_llm_url: str = "http://localhost:11434"
    local_llm_model: str = "llama3.2-vision:11b"
    # Text chat model for the per-console copilot (Ollama). qwen2.5:7b is a solid
    # local text model — better/faster than the vision model for Q&A.
    local_chat_model: str = "qwen2.5:7b"

    # Deployment mode: offline (all local, no cloud sync) | gcp (sync to control
    # plane). Extraction is the on-device classical pipeline in BOTH; the mode only
    # controls the cloud layer. Runtime-switchable via POST /api/mode. Empty =
    # derive from control_plane_url.
    edge_mode: str = ""
    # Generate a VLM damage summary when damage is detected (Vertex in gcp mode,
    # local Ollama offline). Adds ~15s on the local path; toggle off to skip.
    damage_summary: bool = True

    # Cloud control plane (OPTIONAL). Empty = fully offline mode.
    control_plane_url: str = ""
    sync_token: str = ""

    # CORS for the operator dashboard (the Vite React app).
    frontend_origin: str = "http://localhost:5173"

    @property
    def mode(self) -> str:
        return "cloud-sync" if self.control_plane_url else "offline-edge"


settings = Settings()
