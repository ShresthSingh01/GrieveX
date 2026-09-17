import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey
from ..core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    complaint_text = Column(Text, nullable=False)
    citizen_name = Column(String(100), default="Anonymous Citizen")
    location = Column(String(255), default="City Ward")
    category = Column(String(100), default="civic_infrastructure")
    goal = Column(Text, nullable=True)
    status = Column(String(50), default="NEW") # NEW, ANALYZING, ANALYZED, IN_PROGRESS, WAITING_FOR_CITIZEN, WAITING_FOR_AUTHORITY, WAITING_FOR_APPROVAL, REPLANNING, READY_FOR_CLOSURE, CLOSED, FAILED
    assumed_authority = Column(String(100), nullable=True)
    workflow_name = Column(String(200), nullable=True)
    version = Column(Integer, default=1) # Optimistic concurrency version
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

class ClaimModel(Base):
    __tablename__ = "claims"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    text = Column(Text, nullable=False)
    category = Column(String(50), default="factual_claim")
    confidence = Column(Float, default=0.95)

class AuthorityModel(Base):
    __tablename__ = "authorities"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    name = Column(String(150), nullable=False)
    role = Column(String(200), nullable=False)
    department = Column(String(150), nullable=False)
    confidence = Column(Float, default=0.90)

class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    key = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    authority = Column(String(150), nullable=False)
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH
    requires_human_approval = Column(Boolean, default=False)
    approval_rule_id = Column(String(50), nullable=True)
    approval_authority_required = Column(String(200), nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, BLOCKED, READY, IN_PROGRESS, HUMAN_APPROVAL_REQUIRED, COMPLETED, INVALIDATED, FAILED
    dependencies_json = Column(Text, default="[]")
    required_evidence_json = Column(Text, default="[]")
    submitted_evidence_json = Column(Text, default="[]")
    is_replanned = Column(Boolean, default=False)
    invalidated = Column(Boolean, default=False)
    invalidated_reason = Column(Text, nullable=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    order_index = Column(Integer, default=0)
    version = Column(Integer, default=1) # Optimistic locking counter

    @property
    def dependencies(self):
        return json.loads(self.dependencies_json or "[]")

    @dependencies.setter
    def dependencies(self, val):
        self.dependencies_json = json.dumps(val)

    @property
    def required_evidence(self):
        return json.loads(self.required_evidence_json or "[]")

    @required_evidence.setter
    def required_evidence(self, val):
        self.required_evidence_json = json.dumps(val)

    @property
    def submitted_evidence(self):
        return json.loads(self.submitted_evidence_json or "[]")

    @submitted_evidence.setter
    def submitted_evidence(self, val):
        self.submitted_evidence_json = json.dumps(val)

class EvidenceModel(Base):
    __tablename__ = "evidence"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    task_id = Column(String(50), nullable=True)
    evidence_type = Column(String(100), default="DOCUMENT")
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    sha256 = Column(String(64), nullable=True) # Cryptographic hash of content/payload
    mime_type = Column(String(100), default="text/plain")
    storage_key = Column(String(500), nullable=True) # Reference to local file or S3 object
    source_type = Column(String(50), default="TEXT") # TEXT, PDF, IMAGE, FORM, EXTERNAL_REPORT
    extracted_text = Column(Text, nullable=True)
    submitted_by = Column(String(150), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class EvidenceLinkModel(Base):
    __tablename__ = "evidence_links"

    id = Column(String(50), primary_key=True, index=True)
    evidence_id = Column(String(50), ForeignKey("evidence.id", ondelete="CASCADE"), index=True)
    entity_type = Column(String(50), nullable=False) # CLAIM, ASSUMPTION, OBLIGATION, TASK
    entity_id = Column(String(50), nullable=False)
    relationship = Column(String(50), nullable=False) # supports, invalidates, triggers
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class AssumptionModel(Base):
    __tablename__ = "assumptions"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    statement = Column(Text, nullable=False)
    source = Column(String(100), default="AI_EXTRACTION")
    confidence = Column(Float, default=0.85)
    status = Column(String(50), default="ACTIVE") # ACTIVE, CONFIRMED, INVALIDATED, UNKNOWN
    created_at = Column(DateTime(timezone=True), default=utc_now)
    invalidated_at = Column(DateTime(timezone=True), nullable=True)
    invalidated_by_evidence_id = Column(String(50), nullable=True)

class PlanVersionModel(Base):
    __tablename__ = "plan_versions"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    version_number = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    trigger_evidence_id = Column(String(50), nullable=True)
    created_by = Column(String(100), default="SYSTEM")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    status = Column(String(50), default="ACTIVE") # ACTIVE, SUPERSEDED
    graph_json = Column(Text, default="{}")
    task_diff_json = Column(Text, default="{}") # {changed: [], preserved: [], added: [], removed: []}

class ConflictModel(Base):
    __tablename__ = "conflicts"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    claim_text = Column(Text, nullable=False)
    party_a = Column(String(150), nullable=False)
    party_b = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="UNRESOLVED") # UNRESOLVED, RESOLVED
    resolution_notes = Column(Text, nullable=True)

class MissingInfoModel(Base):
    __tablename__ = "missing_info"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    field_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    importance = Column(String(50), default="BLOCKING")
    action_required = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, PROVIDED
    provided_value = Column(Text, nullable=True)

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(50), ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    event_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, nullable=True)
    actor = Column(String(100), default="SYSTEM")
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now)
