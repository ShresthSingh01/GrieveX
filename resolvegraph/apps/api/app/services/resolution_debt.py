from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models.models import (
    CaseModel, TaskModel, ConflictModel, MissingInfoModel,
    AssumptionModel, EvidenceModel
)

class ResolutionDebtCalculator:
    """
    Computes formal, measurable Resolution Debt for a case.
    A case CANNOT be closed until total resolution debt is 0.
    """

    def calculate(self, case_id: str, db: Session) -> Dict[str, Any]:
        case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        debt_items: List[Dict[str, Any]] = []

        # 1. Check for unresolved conflicts
        conflicts = db.query(ConflictModel).filter(
            ConflictModel.case_id == case_id,
            ConflictModel.status == "UNRESOLVED"
        ).all()
        for c in conflicts:
            debt_items.append({
                "source_type": "CONFLICT",
                "source_id": c.id,
                "title": f"Unresolved jurisdictional conflict between {c.party_a} and {c.party_b}",
                "severity": "BLOCKING",
                "weight": 25
            })

        # 2. Check for pending blocking missing information
        missing = db.query(MissingInfoModel).filter(
            MissingInfoModel.case_id == case_id,
            MissingInfoModel.status == "PENDING"
        ).all()
        for m in missing:
            debt_items.append({
                "source_type": "MISSING_INFO",
                "source_id": m.id,
                "title": f"Missing critical identifier/document: {m.field_name}",
                "severity": m.importance or "BLOCKING",
                "weight": 20 if m.importance == "BLOCKING" else 10
            })

        # 3. Check for invalidated assumptions that need resolution/replanning
        invalidated_assumptions = db.query(AssumptionModel).filter(
            AssumptionModel.case_id == case_id,
            AssumptionModel.status == "INVALIDATED"
        ).all()
        for a in invalidated_assumptions:
            debt_items.append({
                "source_type": "INVALIDATED_ASSUMPTION",
                "source_id": a.id,
                "title": f"Premise invalidated by evidence: {a.statement[:70]}...",
                "severity": "HIGH",
                "weight": 20
            })

        # 4. Check for tasks requiring human approval
        pending_approvals = db.query(TaskModel).filter(
            TaskModel.case_id == case_id,
            TaskModel.status == "HUMAN_APPROVAL_REQUIRED"
        ).all()
        for t in pending_approvals:
            debt_items.append({
                "source_type": "PENDING_APPROVAL",
                "source_id": t.id,
                "title": f"High-risk action requires supervisory signoff: {t.title}",
                "severity": "CRITICAL",
                "weight": 30
            })

        # 5. Check for incomplete non-invalidated tasks
        incomplete_tasks = db.query(TaskModel).filter(
            TaskModel.case_id == case_id,
            TaskModel.status.in_(["PENDING", "BLOCKED", "READY", "IN_PROGRESS"]),
            TaskModel.invalidated == False
        ).all()
        for t in incomplete_tasks:
            debt_items.append({
                "source_type": "INCOMPLETE_TASK",
                "source_id": t.id,
                "title": f"Unexecuted resolution task: {t.title}",
                "severity": "MEDIUM" if t.risk_level != "HIGH" else "HIGH",
                "weight": 15
            })

        # 6. Check for outcome verification evidence
        has_verification_evidence = db.query(EvidenceModel).filter(
            EvidenceModel.case_id == case_id,
            EvidenceModel.evidence_type.in_(["VERIFICATION_REPORT", "CITIZEN_CONFIRMATION", "INSPECTION_CERTIFICATE"])
        ).first() is not None

        if not has_verification_evidence:
            debt_items.append({
                "source_type": "MISSING_VERIFICATION",
                "source_id": f"{case_id}-VERIF",
                "title": "No independent closure or citizen outcome verification evidence submitted",
                "severity": "BLOCKING",
                "weight": 25
            })

        total_debt_score = sum(item["weight"] for item in debt_items)
        can_close = (len(debt_items) == 0)

        return {
            "case_id": case_id,
            "can_close": can_close,
            "total_debt_score": total_debt_score,
            "active_debt_items_count": len(debt_items),
            "debt_items": debt_items,
            "status": "CLEAR" if can_close else "UNCLEARED_DEBT"
        }
