"""Edge-local SQLite store — the audit-grade record of the whole loop:
PO → case → evidence → extraction → decision → audit record, plus an offline
sync-event queue that drains to the cloud control plane when online. JSON columns
keep the schema portable so it also seeds a Postgres control plane later."""

from __future__ import annotations

import datetime as dt
from collections.abc import Iterator

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    relationship,
    sessionmaker,
)
from sqlalchemy.types import JSON, DateTime

from ..settings import settings
from ..utils.local_time import utcnow

_connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)
engine = create_engine(settings.database_url, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    po_number: Mapped[str] = mapped_column(String, primary_key=True)
    supplier: Mapped[str] = mapped_column(String)
    material: Mapped[str] = mapped_column(String)
    expected_quantity: Mapped[int] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String)
    unit_price: Mapped[float] = mapped_column(Float)
    plant: Mapped[str] = mapped_column(String)
    required_documents: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String, default="open")
    pr_id: Mapped[str] = mapped_column(String, default="")
    source: Mapped[str] = mapped_column(String, default="erp")
    # PO lifecycle the PO agent drives:
    #   po_created → email_drafted → email_sent → supplier_confirmed
    po_state: Mapped[str] = mapped_column(String, default="po_created")
    supplier_email: Mapped[str] = mapped_column(Text, default="")
    # Parsed supplier confirmation (qty, delivery, documents confirmed/pending, risk).
    confirmation: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PurchaseRequisition(Base):
    """A purchase requisition — what is NEEDED, not who supplies it. The PR agent
    only reads the human's natural-language need and turns it into a structured,
    catalogued requisition (material, quantity, estimated value, budget check).
    Supplier selection happens downstream in sourcing. Upstream of sourcing → PO."""

    __tablename__ = "purchase_requisitions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    raw_request: Mapped[str] = mapped_column(Text, default="")
    requester: Mapped[str] = mapped_column(String, default="")
    plant: Mapped[str] = mapped_column(String, default="")
    material: Mapped[str] = mapped_column(String, default="")
    material_code: Mapped[str] = mapped_column(String, default="")
    category: Mapped[str] = mapped_column(String, default="")
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str] = mapped_column(String, default="")
    # Estimated value from the catalog (for the budget check) — NOT a quoted price.
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    budget_ok: Mapped[bool] = mapped_column(Boolean, default=True)
    # Requisition header + account assignment (from ERP master data, deterministic).
    pr_type: Mapped[str] = mapped_column(String, default="NB · Standard requisition")
    purch_org: Mapped[str] = mapped_column(String, default="")
    purch_group: Mapped[str] = mapped_column(String, default="")
    cost_center: Mapped[str] = mapped_column(String, default="")
    gl_account: Mapped[str] = mapped_column(String, default="")
    justification: Mapped[str] = mapped_column(Text, default="")
    reasoning: Mapped[str] = mapped_column(Text, default="")
    # draft | approved | sourced | awarded | ordered
    status: Mapped[str] = mapped_column(String, default="draft")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SourcingResult(Base):
    """Spot-buy / sourcing outcome for a PR — a deterministic 3-bid comparison
    (price · lead · risk · contract) with a recommended winner; a human awards it.
    Rules only, no model. Between PR approval and PO creation."""

    __tablename__ = "sourcing_results"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    pr_id: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String, default="")
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    bids: Mapped[list] = mapped_column(JSON, default=list)
    recommended_supplier: Mapped[str] = mapped_column(String, default="")
    recommended_price: Mapped[float] = mapped_column(Float, default=0.0)
    recommended_amount: Mapped[float] = mapped_column(Float, default=0.0)
    awarded_supplier: Mapped[str] = mapped_column(String, default="")
    awarded_price: Mapped[float] = mapped_column(Float, default=0.0)
    awarded_amount: Mapped[float] = mapped_column(Float, default=0.0)
    rationale: Mapped[str] = mapped_column(Text, default="")
    # recommended | awarded
    status: Mapped[str] = mapped_column(String, default="recommended")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ReceivingCase(Base):
    __tablename__ = "receiving_cases"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    po_number: Mapped[str] = mapped_column(ForeignKey("purchase_orders.po_number"))
    plant: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    summary: Mapped[str] = mapped_column(Text, default="")
    # received | extracted | evaluated | approved | rejected | clean
    status: Mapped[str] = mapped_column(String, default="received")
    # Cached latest evaluation (rules-engine output) for dashboard reads.
    evaluation: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    po: Mapped[PurchaseOrder] = relationship()
    evidence: Mapped[list[Evidence]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("receiving_cases.id"))
    # packing-list | carton-label | pallet | damage | delivery-note | coa
    kind: Mapped[str] = mapped_column(String)
    filename: Mapped[str] = mapped_column(String)
    # Local path on the device — the image NEVER leaves; only the hash syncs.
    uri: Mapped[str] = mapped_column(String)
    sha256: Mapped[str] = mapped_column(String, default="")
    content_type: Mapped[str] = mapped_column(String, default="")
    # Filesystem paths for serving/inference: original + normalized JPEG derivative.
    orig_path: Mapped[str] = mapped_column(String, default="")
    norm_path: Mapped[str] = mapped_column(String, default="")
    # Ingestion metadata (real phone photos): dimensions, source format, device.
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_format: Mapped[str] = mapped_column(String, default="")
    device: Mapped[str] = mapped_column(String, default="")
    captured_at: Mapped[str] = mapped_column(String, default="")
    uploaded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    case: Mapped[ReceivingCase] = relationship(back_populates="evidence")


class Extraction(Base):
    __tablename__ = "extractions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("receiving_cases.id"))
    provider: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String, default="")
    escalated_from: Mapped[str] = mapped_column(String, default="")
    po_number: Mapped[str] = mapped_column(String, default="")
    supplier: Mapped[str] = mapped_column(String, default="")
    material: Mapped[str] = mapped_column(String, default="")
    detected_quantity: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str] = mapped_column(String, default="")
    damaged_cartons: Mapped[int] = mapped_column(Integer, default=0)
    damage_summary: Mapped[str] = mapped_column(Text, default="")
    lot_number: Mapped[str] = mapped_column(String, default="")
    documents_found: Mapped[list] = mapped_column(JSON, default=list)
    documents_missing: Mapped[list] = mapped_column(JSON, default=list)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    # Display-ready field list for the UI (label/value/confidence/source/flag).
    fields: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("receiving_cases.id"))
    # Snapshot of the evaluation the human acted on.
    recommended: Mapped[dict] = mapped_column(JSON, default=dict)
    # approved | rejected | escalated | held
    human_decision: Mapped[str] = mapped_column(String, default="")
    approver: Mapped[str] = mapped_column(String, default="")
    auto_actions: Mapped[list] = mapped_column(JSON, default=list)
    approved_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditRecord(Base):
    __tablename__ = "audit_records"

    decision_id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String)
    package_uri: Mapped[str] = mapped_column(String)
    package: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Contract(Base):
    """Framework contract terms for a PO — the 4th leg of the four-way match."""

    __tablename__ = "contracts"

    po_number: Mapped[str] = mapped_column(String, primary_key=True)
    supplier: Mapped[str] = mapped_column(String)
    unit_price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String, default="USD")
    payment_terms: Mapped[str] = mapped_column(String, default="Net 30")
    price_tolerance_pct: Mapped[float] = mapped_column(Float, default=2.0)
    required_documents: Mapped[list] = mapped_column(JSON, default=list)


class Invoice(Base):
    """Supplier invoice (mock — stands in for the AP/EDI feed)."""

    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    po_number: Mapped[str] = mapped_column(String)
    supplier: Mapped[str] = mapped_column(String)
    billed_quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Float)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String, default="USD")
    # received | held | partial | paid
    status: Mapped[str] = mapped_column(String, default="received")
    # Local path to the ingested invoice document (so the operator can view it).
    doc_path: Mapped[str] = mapped_column(String, default="")
    received_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class GoodsReceipt(Base):
    """The goods receipt posted from a human-approved receiving decision — REAL
    output of the edge loop, fed into the four-way match."""

    __tablename__ = "goods_receipts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String)
    po_number: Mapped[str] = mapped_column(String)
    decision_id: Mapped[str] = mapped_column(String, default="")
    ordered_quantity: Mapped[int] = mapped_column(Integer, default=0)
    received_quantity: Mapped[int] = mapped_column(Integer, default=0)
    accepted_quantity: Mapped[int] = mapped_column(Integer, default=0)
    damaged_quantity: Mapped[int] = mapped_column(Integer, default=0)
    over_quantity: Mapped[int] = mapped_column(Integer, default=0)
    documents_missing: Mapped[list] = mapped_column(JSON, default=list)
    posted_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MatchResult(Base):
    """Four-way match: contract + PO + goods receipt + invoice."""

    __tablename__ = "match_results"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String)
    po_number: Mapped[str] = mapped_column(String)
    invoice_id: Mapped[str] = mapped_column(String)
    gr_id: Mapped[str] = mapped_column(String)
    # matched | hold
    status: Mapped[str] = mapped_column(String, default="hold")
    checks: Mapped[list] = mapped_column(JSON, default=list)
    payable_amount: Mapped[float] = mapped_column(Float, default=0.0)
    blocked_amount: Mapped[float] = mapped_column(Float, default=0.0)
    recommended: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Payment(Base):
    """Payment decision/state for an invoice after the match + human approval."""

    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    case_id: Mapped[str] = mapped_column(String)
    po_number: Mapped[str] = mapped_column(String)
    invoice_id: Mapped[str] = mapped_column(String)
    # blocked | partial | scheduled | paid
    status: Mapped[str] = mapped_column(String, default="blocked")
    released_amount: Mapped[float] = mapped_column(Float, default=0.0)
    blocked_amount: Mapped[float] = mapped_column(Float, default=0.0)
    decided_by: Mapped[str] = mapped_column(String, default="")
    decided_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SyncEvent(Base):
    __tablename__ = "sync_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_type: Mapped[str] = mapped_column(String)
    # Structured payload only — extracted fields, scores, decision, hashes.
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    # pending | sent | failed
    status: Mapped[str] = mapped_column(String, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    sent_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


def init_db() -> None:
    Base.metadata.create_all(engine)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
