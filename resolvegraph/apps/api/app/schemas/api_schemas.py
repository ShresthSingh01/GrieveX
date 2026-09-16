from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import datetime

class GrievanceCreateRequest(BaseModel):
    title: Optional[str] = None
    complaint_text: str
    citizen_name: Optional[str] = "Anonymous Citizen"
    location: Optional[str] = "City Ward"
    category: Optional[str] = "civic_infrastructure"
    force_offline: Optional[bool] = False

class ClaimItem(BaseModel):
    id: str
    text: str
    category: str
    confidence: float

class AuthorityItem(BaseModel):
    id: str
    name: str
    role: str
    department: str
    confidence: float

class ConflictItem(BaseModel):
    id: str
    claim_text: str
    party_a: str
    party_b: str
    description: str
    status: str
    resolution_notes: Optional[str] = None

class MissingInfoItem(BaseModel):
    id: str
    field_name: str
    description: str
    importance: str
    action_required: str
    status: str
    provided_value: Optional[str] = None

class TaskItem(BaseModel):
    id: str
    key: str
    title: str
    authority: str
    risk_level: str
    requires_human_approval: bool
    approval_rule_id: Optional[str] = None
    approval_authority_required: Optional[str] = None
    status: str
    dependencies: List[str]
    required_evidence: List[str]
    submitted_evidence: List[Dict[str, Any]]
    is_replanned: bool
    invalidated: bool
    invalidated_reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime.datetime] = None

class EvidenceSubmitRequest(BaseModel):
    task_id: Optional[str] = None
    evidence_type: str = "DOCUMENT"
    title: str
    content: str
    submitted_by: str = "Field Officer"

class TaskCompleteRequest(BaseModel):
    evidence_title: str
    evidence_content: str
    submitted_by: str = "Field Officer"

class ApprovalRequest(BaseModel):
    officer_name: str = "Executive Magistrate / Nodal Officer"
    officer_role: str = "Appellate Review Authority"
    decision: str = "APPROVED" # APPROVED, REJECTED
    notes: Optional[str] = "Verified administrative sanction and approved execution."

class ReplanRequest(BaseModel):
    reason: str
    new_authority: Optional[str] = None
    actor: str = "Nodal Officer"

class ProvideMissingInfoRequest(BaseModel):
    field_name: str
    value: str
    submitted_by: str = "Citizen"

class AuditEventItem(BaseModel):
    id: int
    case_id: str
    event_type: str
    description: str
    reason: Optional[str] = None
    actor: str
    metadata: Dict[str, Any] = {}
    created_at: datetime.datetime

class CaseDetailResponse(BaseModel):
    id: str
    title: str
    complaint_text: str
    citizen_name: str
    location: str
    category: str
    goal: Optional[str] = None
    status: str
    assumed_authority: Optional[str] = None
    workflow_name: Optional[str] = None
    claims: List[ClaimItem] = []
    authorities: List[AuthorityItem] = []
    conflicts: List[ConflictItem] = []
    missing_info: List[MissingInfoItem] = []
    tasks: List[TaskItem] = []
    audit_events: List[AuditEventItem] = []
    ready_tasks_count: int = 0
    created_at: datetime.datetime
    updated_at: datetime.datetime

class GraphResponse(BaseModel):
    case_id: str
    workflow_name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    active_tasks_count: int
    ready_tasks_count: int
    parallel_execution_enabled: bool = True

class VerificationChecklistResponse(BaseModel):
    case_id: str
    recommendation: str
    can_close: bool
    checklist: List[Dict[str, Any]]
    blocking_reasons: List[str]
    summary: str
