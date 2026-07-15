"""Edge→cloud auth. MVP = shared bearer token (SYNC_TOKEN). If unset, the
endpoint is open (local dev only). Upgrade to service-to-service IAM later."""

from fastapi import Header, HTTPException

from .settings import settings


def require_token(authorization: str = Header(default="")) -> None:
    if not settings.sync_token:
        return  # open in dev
    if authorization != f"Bearer {settings.sync_token}":
        raise HTTPException(status_code=401, detail="invalid sync token")
