"""Aggregate router for the control-plane API."""

from fastapi import APIRouter

from . import decisions, devices, health, receiving_cases, sync

router = APIRouter()
for _m in (health, sync, receiving_cases, devices, decisions):
    router.include_router(_m.router)
