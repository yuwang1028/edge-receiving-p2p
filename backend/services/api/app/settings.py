"""Control-plane configuration. Local-first: with FIRESTORE_EMULATOR_HOST set
(see run_control_plane.sh) it talks to the local emulator — no cloud, no cost."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gcp_project: str = "just-site-493900-d9"
    gcp_location: str = "us-central1"
    # Shared bearer token edge→cloud. Empty = open (dev only).
    sync_token: str = ""
    # CORS for a cloud dashboard / the operator console.
    frontend_origin: str = "http://localhost:5173"


settings = Settings()
