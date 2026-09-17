import os
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.models import CaseModel, AuthorityModel
from ..schemas.api_schemas import (
    GrievanceCreateRequest,
    CaseDetailResponse,
    GraphResponse,
    TaskCompleteRequest,
    EvidenceSubmitRequest,
    ApprovalRequest,
    ReplanRequest,
    ProvideMissingInfoRequest,
    VerificationChecklistResponse
)
from ..services.case_service import CaseService

router = APIRouter(prefix="/api/grievances", tags=["Grievances"])

@router.get("", response_model=List[Dict[str, Any]])
def list_grievances(db: Session = Depends(get_db)):
    """List all registered cases with their status and workflow"""
    cases = db.query(CaseModel).order_by(CaseModel.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "citizen_name": c.citizen_name,
            "location": c.location,
            "category": c.category,
            "status": c.status,
            "workflow_name": c.workflow_name,
            "created_at": c.created_at
        }
        for c in cases
    ]

@router.post("", response_model=Dict[str, Any])
def create_grievance(payload: GrievanceCreateRequest, db: Session = Depends(get_db)):
    """Submit a new complex citizen grievance"""
    service = CaseService(db)
    case = service.create_case(
        complaint_text=payload.complaint_text,
        title=payload.title,
        citizen_name=payload.citizen_name or "Anonymous Citizen",
        location=payload.location or "City Ward",
        category=payload.category or "civic_infrastructure"
    )
    return {"success": True, "case_id": case.id, "status": case.status, "message": "Grievance registered"}

@router.post("/{case_id}/analyze", response_model=Dict[str, Any])
def analyze_grievance(
    case_id: str,
    force_offline: bool = Query(False, description="Use 0-token offline rule engine to guarantee no quota exhaustion"),
    db: Session = Depends(get_db)
):
    """Deconstructs complaint, extracts claims/authorities/conflicts, and generates Resolution DAG"""
    service = CaseService(db)
    try:
        case = service.analyze_case(case_id, force_offline=force_offline)
        return {
            "success": True,
            "case_id": case.id,
            "status": case.status,
            "workflow_name": case.workflow_name,
            "message": "Grievance deconstructed and Resolution DAG generated successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{case_id}", response_model=CaseDetailResponse)
def get_grievance(case_id: str, db: Session = Depends(get_db)):
    """Full case view including claims, authorities, conflicts, missing info, tasks, and audit log"""
    service = CaseService(db)
    try:
        return service.get_case_detail(case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{case_id}/graph", response_model=GraphResponse)
def get_resolution_graph(case_id: str, db: Session = Depends(get_db)):
    """Returns React Flow formatted nodes and dependency edges derived from actual DB state"""
    service = CaseService(db)
    try:
        return service.get_graph(case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{case_id}/tasks")
def get_tasks(case_id: str, db: Session = Depends(get_db)):
    """List all resolution tasks with their current readiness statuses"""
    service = CaseService(db)
    detail = service.get_case_detail(case_id)
    return detail.get("tasks", [])

@router.post("/{case_id}/tasks/{task_id}/complete")
def complete_task(case_id: str, task_id: str, payload: TaskCompleteRequest, db: Session = Depends(get_db)):
    """Complete a task with documentary proof, updating downstream dependency readiness"""
    service = CaseService(db)
    try:
        return service.complete_task(
            case_id=case_id,
            task_id=task_id,
            evidence_title=payload.evidence_title,
            evidence_content=payload.evidence_content,
            submitted_by=payload.submitted_by
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{case_id}/approve/{task_id}")
def approve_high_risk_task(case_id: str, task_id: str, payload: ApprovalRequest, db: Session = Depends(get_db)):
    """Human Authority Gate: Officer approves or rejects high-risk action"""
    service = CaseService(db)
    try:
        return service.approve_task(
            case_id=case_id,
            task_id=task_id,
            officer_name=payload.officer_name,
            officer_role=payload.officer_role,
            decision=payload.decision,
            notes=payload.notes or "Approved by officer"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{case_id}/evidence")
def submit_new_evidence(case_id: str, payload: EvidenceSubmitRequest, db: Session = Depends(get_db)):
    """Inject new evidence into case; automatically triggers Dynamic Replanning if assumptions change"""
    service = CaseService(db)
    try:
        return service.submit_evidence(
            case_id=case_id,
            evidence_type=payload.evidence_type,
            title=payload.title,
            content=payload.content,
            submitted_by=payload.submitted_by,
            task_id=payload.task_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{case_id}/verify", response_model=VerificationChecklistResponse)
def verify_closure_readiness(case_id: str, db: Session = Depends(get_db)):
    """Enforces evidence-based closure rules: prevents premature closure without citizen outcome proof"""
    service = CaseService(db)
    try:
        return service.verify_closure(case_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{case_id}/missing-info")
def provide_missing_info(case_id: str, payload: ProvideMissingInfoRequest, db: Session = Depends(get_db)):
    """Submit required identification (e.g. PPO number or cadastral asset ID) to unblock case"""
    service = CaseService(db)
    return service.resolve_missing_info(
        case_id=case_id,
        field_name=payload.field_name,
        value=payload.value,
        submitted_by=payload.submitted_by
    )

@router.get("/{case_id}/resolution-debt")
def get_resolution_debt(case_id: str, db: Session = Depends(get_db)):
    """Formal, measurable resolution debt scorecard; case closure requires total debt == 0"""
    service = CaseService(db)
    try:
        return service.get_resolution_debt(case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{case_id}/plans")
def get_plan_versions(case_id: str, db: Session = Depends(get_db)):
    """Returns immutable history of all generated and replanned resolution DAG versions"""
    service = CaseService(db)
    return service.get_plan_versions(case_id)

@router.get("/{case_id}/certificate")
def get_resolution_certificate(case_id: str, db: Session = Depends(get_db)):
    """Generates canonical, cryptographically verifiable resolution certificate with SHA-256 digest"""
    service = CaseService(db)
    try:
        return service.generate_resolution_certificate(case_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
