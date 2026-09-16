import json
import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey
from ..core.database import Base

class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    complaint_text = Column(Text, nullable=False)
    citizen_name = Column(String(100), default="Anonymous Citizen")
    location = Column(String(255), default="City Ward")
    category = Column(String(100), default="civic_infrastructure")
    goal = Column(Text, nullable=True)
    status = Column(String(50), default="NEW") # NEW, ANALYZED, IN_PROGRESS, REPLANNED, RESOLUTION_CANDIDATE, RESOLVED
    assumed_authority = Column(String(100), nullable=True)
    workflow_name = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

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
    status = Column(String(50), default="PENDING") # PENDING, READY, IN_PROGRESS, COMPLETED, BLOCKED, HUMAN_APPROVAL_REQUIRED, INVALIDATED
    dependencies_json = Column(Text, default="[]")
    required_evidence_json = Column(Text, default="[]")
    submitted_evidence_json = Column(Text, default="[]")
    is_replanned = Column(Boolean, default=False)
    invalidated = Column(Boolean, default=False)
    invalidated_reason = Column(Text, nullable=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0)

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
    submitted_by = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
