"""The structured event the edge POSTs to /edge/events. Mirrors the edge's
audit_event_builder output. `extra="allow"` keeps it forward-compatible if the
edge adds fields. NOTE: contains evidence HASHES only — never image bytes."""

from pydantic import BaseModel, ConfigDict


class EdgeEvent(BaseModel):
    model_config = ConfigDict(extra="allow")

    event_type: str = "receiving_decision_created"
    edge_device_id: str
    site_id: str = ""
    case_id: str
    decision_id: str
    generated_at: str = ""
    local_processing: bool = True
    evidence_hashes: list[str] = []
    extracted_fields: dict = {}
    risk_result: dict = {}
    decision: dict = {}
