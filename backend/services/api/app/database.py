"""Firestore client. The google-cloud-firestore SDK auto-detects the emulator
when FIRESTORE_EMULATOR_HOST is set, so this same code runs locally and on
Cloud Run with zero changes."""

from google.cloud import firestore

from .settings import settings

_client: firestore.Client | None = None


def get_db() -> firestore.Client:
    global _client
    if _client is None:
        _client = firestore.Client(project=settings.gcp_project)
    return _client
