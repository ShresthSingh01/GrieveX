import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.models import (
    CaseModel, ClaimModel, AuthorityModel, TaskModel,
    EvidenceModel, EvidenceLinkModel, ConflictModel,
    MissingInfoModel, AuditEventModel, AssumptionModel,
    PlanVersionModel
)
from ..core.state_machine import transition_case, transition_task, can_transition_case
from .resolution_debt import ResolutionDebtCalculator
from .....intelligence.extraction.extractor import GrievanceExtractor
from .....intelligence.planning.dag_builder import DAGBuilder
from .....intelligence.planning.scheduler import TaskScheduler
from .....intelligence.replanning.engine import ReplanningEngine
from .....intelligence.verification.closure import ClosureVerificationEngine

def utc_now():
    return datetime.now(timezone.utc)

class CaseService:
    def __init__(self, db: Session):
        self.db = db
        self.extractor = GrievanceExtractor()
        self.dag_builder = DAGBuilder()
        self.replanning_engine = ReplanningEngine()
        self.debt_calculator = ResolutionDebtCalculator()

    def create_case(
        self,
        complaint_text: str,
        title: Optional[str] = None,
        citizen_name: str = "Anonymous Citizen",
        location: str = "City Ward",
        category: str = "civic_infrastructure"
    ) -> CaseModel:
        case_id = f"GRV-{str(uuid.uuid4())[:6].upper()}"
        if not title:
            first_sentence = complaint_text.split(".")[0].strip()
            title = first_sentence[:80] if len(first_sentence) > 5 else "Public Grievance Case"

        case = CaseModel(
            id=case_id,
            title=title,
            complaint_text=complaint_text,
            citizen_name=citizen_name,
            location=location,
            category=category,
            status="NEW"
        )
        self.db.add(case)
        self.db.commit()

        self._record_audit(case_id, "CASE_CREATED", f"Citizen grievance registered: '{title}'", "Citizen Submission", "CITIZEN")
        return case

    def analyze_case(self, case_id: str, force_offline: bool = False) -> CaseModel:
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        # 1. State transition: NEW -> ANALYZED (or ANALYZING -> ANALYZED)
        transition_case(case, "ANALYZED")

        # 2. Extract structured claims, authorities, conflicts
        extraction = self.extractor.extract(case.complaint_text, force_offline=force_offline, case_id=case.id)

        case.goal = extraction.goal
        if extraction.authorities:
            case.assumed_authority = extraction.authorities[0].name

        # Clean old extractions if re-analyzing
        self.db.query(ClaimModel).filter(ClaimModel.case_id == case_id).delete()
        self.db.query(AuthorityModel).filter(AuthorityModel.case_id == case_id).delete()
        self.db.query(ConflictModel).filter(ConflictModel.case_id == case_id).delete()
        self.db.query(MissingInfoModel).filter(MissingInfoModel.case_id == case_id).delete()
        self.db.query(TaskModel).filter(TaskModel.case_id == case_id).delete()
        self.db.query(AssumptionModel).filter(AssumptionModel.case_id == case_id).delete()
        self.db.query(PlanVersionModel).filter(PlanVersionModel.case_id == case_id).delete()

        # 3. Persist Claims
        for c in extraction.claims:
            claim_rec = ClaimModel(
                id=f"{case_id}-{c.id}",
                case_id=case_id,
                text=c.text,
                category=c.category or "factual_claim",
                confidence=c.confidence
            )
            self.db.add(claim_rec)

        # 4. Persist Authorities
        for a in extraction.authorities:
            auth_rec = AuthorityModel(
                id=f"{case_id}-{a.id}",
                case_id=case_id,
                name=a.name,
                role=a.role,
                department=a.department,
                confidence=a.confidence
            )
            self.db.add(auth_rec)

        # 5. Persist Conflicts
        for cf in extraction.conflicts:
            conf_rec = ConflictModel(
                id=f"{case_id}-{cf.id}",
                case_id=case_id,
                claim_text=cf.claim_text,
                party_a=cf.party_a,
                party_b=cf.party_b,
                description=cf.description,
                status="UNRESOLVED"
            )
            self.db.add(conf_rec)

        # 6. Persist Missing Information
        for m in extraction.missing_information:
            miss_rec = MissingInfoModel(
                id=f"{case_id}-{m.id}",
                case_id=case_id,
                field_name=m.field_name,
                description=m.description,
                importance=m.importance,
                action_required=m.action_required,
                status="PENDING"
            )
            self.db.add(miss_rec)

        # 7. Persist First-Class Assumptions
        primary_auth = case.assumed_authority or "Municipal Administration"
        assump1 = AssumptionModel(
            id=f"ASM-{case_id}-1",
            case_id=case_id,
            statement=f"Primary statutory jurisdiction for resolution resides with {primary_auth}.",
            source="RESOLUTION_COMPILER",
            confidence=0.90,
            status="ACTIVE"
        )
        self.db.add(assump1)

        # 8. Build Deterministic DAG Plan
        dag_plan = self.dag_builder.build_dag(case_id, extraction, assumed_authority=case.assumed_authority)
        case.workflow_name = dag_plan.get("workflow_name", "Resolution Plan")

        for t in dag_plan.get("tasks", []):
            task_rec = TaskModel(
                id=f"{case_id}-{t['id']}",
                case_id=case_id,
                key=t["key"],
                title=t["title"],
                authority=t["authority"],
                risk_level=t["risk_level"],
                requires_human_approval=t["requires_human_approval"],
                approval_rule_id=t["approval_rule_id"],
                approval_authority_required=t["approval_authority_required"],
                status=t["status"],
                dependencies_json=json.dumps(t["dependencies"]),
                required_evidence_json=json.dumps(t["required_evidence"]),
                submitted_evidence_json=json.dumps(t["submitted_evidence"]),
                is_replanned=t["is_replanned"],
                invalidated=t["invalidated"],
                order_index=t["order_index"]
            )
            self.db.add(task_rec)

        # 9. Create Plan Version 1 (First-class versioning)
        pv1 = PlanVersionModel(
            id=f"PV-{case_id}-1",
            case_id=case_id,
            version_number=1,
            reason="Initial deterministic resolution DAG compilation",
            created_by="RESOLUTION_COMPILER",
            status="ACTIVE",
            graph_json=json.dumps(dag_plan),
            task_diff_json=json.dumps({
                "changed": [],
                "preserved": [t["key"] for t in dag_plan.get("tasks", [])],
                "added": [t["key"] for t in dag_plan.get("tasks", [])],
                "removed": []
            })
        )
        self.db.add(pv1)

        transition_case(case, "IN_PROGRESS")
        self.db.commit()

        # Audit Event
        self._record_audit(
            case_id,
            "GRIEVANCE_ANALYZED_AND_PLANNED",
            f"Extracted {len(extraction.claims)} claims, {len(extraction.authorities)} authorities. Generated Plan V1 with {len(dag_plan.get('tasks', []))} tasks.",
            f"Mode: {extraction.extractor_mode}",
            "INTELLIGENCE_ENGINE",
            {"workflow": case.workflow_name, "plan_version": 1}
        )

        return case

    def get_case_detail(self, case_id: str) -> Dict[str, Any]:
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        claims = self.db.query(ClaimModel).filter(ClaimModel.case_id == case_id).all()
        authorities = self.db.query(AuthorityModel).filter(AuthorityModel.case_id == case_id).all()
        conflicts = self.db.query(ConflictModel).filter(ConflictModel.case_id == case_id).all()
        missing_info = self.db.query(MissingInfoModel).filter(MissingInfoModel.case_id == case_id).all()
        assumptions = self.db.query(AssumptionModel).filter(AssumptionModel.case_id == case_id).all()
        tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        audit_events = self.db.query(AuditEventModel).filter(AuditEventModel.case_id == case_id).order_by(AuditEventModel.created_at.desc()).all()
        latest_plan = self.db.query(PlanVersionModel).filter(PlanVersionModel.case_id == case_id).order_by(PlanVersionModel.version_number.desc()).first()

        task_dicts = [self._task_model_to_dict(t) for t in tasks]
        ready_count = len([t for t in task_dicts if t["status"] == "READY"])

        debt_info = self.debt_calculator.calculate(case_id, self.db)

        return {
            "id": case.id,
            "title": case.title,
            "complaint_text": case.complaint_text,
            "citizen_name": case.citizen_name,
            "location": case.location,
            "category": case.category,
            "goal": case.goal,
            "status": case.status,
            "workflow_name": case.workflow_name,
            "assumed_authority": case.assumed_authority,
            "active_plan_version": latest_plan.version_number if latest_plan else 1,
            "resolution_debt_score": debt_info["total_debt_score"],
            "can_close": debt_info["can_close"],
            "claims": [
                {"id": c.id, "text": c.text, "category": c.category, "confidence": c.confidence}
                for c in claims
            ],
            "authorities": [
                {"id": a.id, "name": a.name, "role": a.role, "department": a.department, "confidence": a.confidence}
                for a in authorities
            ],
            "conflicts": [
                {"id": cf.id, "claim_text": cf.claim_text, "party_a": cf.party_a, "party_b": cf.party_b, "description": cf.description, "status": cf.status, "resolution_notes": cf.resolution_notes}
                for cf in conflicts
            ],
            "missing_info": [
                {"id": m.id, "field_name": m.field_name, "description": m.description, "importance": m.importance, "action_required": m.action_required, "status": m.status, "provided_value": m.provided_value}
                for m in missing_info
            ],
            "assumptions": [
                {"id": asm.id, "statement": asm.statement, "status": asm.status, "confidence": asm.confidence, "invalidated_by_evidence_id": asm.invalidated_by_evidence_id}
                for asm in assumptions
            ],
            "tasks": task_dicts,
            "audit_events": [
                {
                    "id": ev.id,
                    "case_id": ev.case_id,
                    "event_type": ev.event_type,
                    "description": ev.description,
                    "reason": ev.reason,
                    "actor": ev.actor,
                    "metadata": json.loads(ev.metadata_json or "{}"),
                    "created_at": ev.created_at.isoformat() if ev.created_at else None
                }
                for ev in audit_events
            ],
            "ready_tasks_count": ready_count,
            "total_tasks_count": len(tasks),
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "updated_at": case.updated_at.isoformat() if case.updated_at else None
        }

    def complete_task(self, case_id: str, task_id: str, evidence_title: str, evidence_content: str, submitted_by: str) -> Dict[str, Any]:
        full_task_id = task_id if task_id.startswith(case_id) else f"{case_id}-{task_id}"
        task = self.db.query(TaskModel).filter(TaskModel.id == full_task_id, TaskModel.case_id == case_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found for case {case_id}")

        if task.status == "INVALIDATED":
            raise ValueError(f"Cannot complete invalidated task: {task.title}")

        # 1. State transition
        transition_task(task, "COMPLETED")

        # 2. Compute SHA-256 evidence hash
        sha256_hash = hashlib.sha256(evidence_content.encode("utf-8")).hexdigest()
        submitted = task.submitted_evidence
        evidence_entry = {
            "title": evidence_title,
            "content": evidence_content,
            "submitted_by": submitted_by,
            "sha256": sha256_hash,
            "timestamp": utc_now().isoformat()
        }
        submitted.append(evidence_entry)
        task.submitted_evidence = submitted

        # 3. Record in evidence table with SHA-256
        ev_id = f"EV-{str(uuid.uuid4())[:8]}"
        ev_model = EvidenceModel(
            id=ev_id,
            case_id=case_id,
            task_id=full_task_id,
            evidence_type="TASK_COMPLETION",
            title=evidence_title,
            content=evidence_content,
            sha256=sha256_hash,
            mime_type="text/plain",
            source_type="TEXT",
            submitted_by=submitted_by
        )
        self.db.add(ev_model)

        # 4. Record Evidence Provenance Link
        ev_link = EvidenceLinkModel(
            id=f"LNK-{str(uuid.uuid4())[:8]}",
            evidence_id=ev_id,
            entity_type="TASK",
            entity_id=full_task_id,
            relationship="completes",
            confidence=1.0
        )
        self.db.add(ev_link)

        # 5. Recalculate downstream task statuses
        all_tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        task_dicts = [self._task_model_to_dict(t) for t in all_tasks]

        short_dicts = []
        for td in task_dicts:
            d = dict(td)
            d["id"] = d["id"].replace(f"{case_id}-", "")
            d["dependencies"] = [x.replace(f"{case_id}-", "") for x in d["dependencies"]]
            short_dicts.append(d)

        updated_shorts = TaskScheduler.recalculate_task_states(short_dicts)

        # Apply updated statuses back to DB
        for st in updated_shorts:
            t_full = f"{case_id}-{st['id']}"
            t_obj = next((x for x in all_tasks if x.id == t_full), None)
            if t_obj and not t_obj.invalidated and t_obj.status != "COMPLETED":
                if t_obj.status != st["status"]:
                    try:
                        transition_task(t_obj, st["status"])
                    except Exception:
                        t_obj.status = st["status"]

        self.db.commit()

        # Audit Event
        self._record_audit(
            case_id,
            "TASK_COMPLETED",
            f"Task '{task.title}' completed by {submitted_by}. Evidence hash: {sha256_hash[:12]}...",
            "Prerequisites verified, dependent tasks updated.",
            submitted_by,
            {"task_id": full_task_id, "sha256": sha256_hash}
        )

        return {"success": True, "task_id": task_id, "new_status": "COMPLETED", "sha256": sha256_hash}

    def approve_task(self, case_id: str, task_id: str, officer_name: str, officer_role: str, decision: str, notes: str) -> Dict[str, Any]:
        full_task_id = task_id if task_id.startswith(case_id) else f"{case_id}-{task_id}"
        task = self.db.query(TaskModel).filter(TaskModel.id == full_task_id, TaskModel.case_id == case_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        if decision == "APPROVED":
            task.approved_by = f"{officer_name} ({officer_role})"
            task.approved_at = utc_now()
            transition_task(task, "READY")
            self.db.commit()

            self._record_audit(
                case_id,
                "HUMAN_APPROVAL_GRANTED",
                f"Officer {officer_name} approved high-risk task: '{task.title}'",
                notes,
                officer_name,
                {"role": officer_role, "rule_id": task.approval_rule_id}
            )
            return {"success": True, "task_id": task_id, "status": "READY", "approved_by": task.approved_by}
        else:
            task.status = "BLOCKED"
            self.db.commit()
            self._record_audit(
                case_id,
                "HUMAN_APPROVAL_REJECTED",
                f"Officer {officer_name} REJECTED high-risk task: '{task.title}'",
                notes,
                officer_name
            )
            return {"success": True, "task_id": task_id, "status": "BLOCKED"}

    def submit_evidence(self, case_id: str, evidence_type: str, title: str, content: str, submitted_by: str, task_id: Optional[str] = None) -> Dict[str, Any]:
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        ev_id = f"EV-{str(uuid.uuid4())[:8]}"
        sha256_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        ev = EvidenceModel(
            id=ev_id,
            case_id=case_id,
            task_id=task_id,
            evidence_type=evidence_type,
            title=title,
            content=content,
            sha256=sha256_hash,
            mime_type="text/plain",
            source_type="DOCUMENT",
            submitted_by=submitted_by
        )
        self.db.add(ev)

        # 1. Fetch current task list
        all_tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        task_dicts = [self._task_model_to_dict(t) for t in all_tasks]

        short_dicts = []
        for td in task_dicts:
            d = dict(td)
            d["id"] = d["id"].replace(f"{case_id}-", "")
            d["dependencies"] = [x.replace(f"{case_id}-", "") for x in d["dependencies"]]
            short_dicts.append(d)

        # 2. Trigger Replanning Engine evaluation
        replan_res = self.replanning_engine.process_new_evidence(
            case_id=case_id,
            current_tasks=short_dicts,
            evidence_type=evidence_type,
            evidence_content=f"{title}: {content}",
            submitted_by=submitted_by
        )

        # 3. If plan changed: Invalidate assumption and create new Plan Version
        if replan_res.get("plan_changed"):
            case.status = "REPLANNED"

            # Invalidate initial jurisdictional assumption with provenance link
            active_assump = self.db.query(AssumptionModel).filter(
                AssumptionModel.case_id == case_id,
                AssumptionModel.status == "ACTIVE"
            ).all()
            for asm in active_assump:
                asm.status = "INVALIDATED"
                asm.invalidated_at = utc_now()
                asm.invalidated_by_evidence_id = ev_id

                # Evidence link
                link = EvidenceLinkModel(
                    id=f"LNK-{str(uuid.uuid4())[:8]}",
                    evidence_id=ev_id,
                    entity_type="ASSUMPTION",
                    entity_id=asm.id,
                    relationship="invalidates",
                    confidence=0.98
                )
                self.db.add(link)

            # Update existing tasks & add newly spawned tasks
            new_tasks_added = []
            for st in replan_res.get("tasks", []):
                full_tid = f"{case_id}-{st['id']}"
                existing = next((x for x in all_tasks if x.id == full_tid), None)
                if existing:
                    existing.status = st["status"]
                    existing.invalidated = st.get("invalidated", False)
                    existing.invalidated_reason = st.get("invalidated_reason")
                    existing.dependencies = [f"{case_id}-{d}" for d in st.get("dependencies", [])]
                else:
                    new_t = TaskModel(
                        id=full_tid,
                        case_id=case_id,
                        key=st["key"],
                        title=st["title"],
                        authority=st["authority"],
                        risk_level=st["risk_level"],
                        requires_human_approval=st["requires_human_approval"],
                        approval_rule_id=st["approval_rule_id"],
                        approval_authority_required=st["approval_authority_required"],
                        status=st["status"],
                        dependencies_json=json.dumps([f"{case_id}-{d}" for d in st.get("dependencies", [])]),
                        required_evidence_json=json.dumps(st.get("required_evidence", [])),
                        submitted_evidence_json=json.dumps(st.get("submitted_evidence", [])),
                        is_replanned=True,
                        invalidated=False,
                        order_index=st.get("order_index", len(all_tasks) + 1)
                    )
                    self.db.add(new_t)
                    new_tasks_added.append(st["key"])

            # Supersede previous active plan version and create Plan Version N+1
            prev_versions = self.db.query(PlanVersionModel).filter(
                PlanVersionModel.case_id == case_id
            ).all()
            for pv in prev_versions:
                pv.status = "SUPERSEDED"

            next_version_num = len(prev_versions) + 1
            new_pv = PlanVersionModel(
                id=f"PV-{case_id}-{next_version_num}",
                case_id=case_id,
                version_number=next_version_num,
                reason=replan_res.get("replan_reason"),
                trigger_evidence_id=ev_id,
                created_by=submitted_by,
                status="ACTIVE",
                graph_json=json.dumps(replan_res),
                task_diff_json=json.dumps({
                    "changed": replan_res.get("invalidated_tasks", []),
                    "preserved": [t.key for t in all_tasks if not t.invalidated],
                    "added": new_tasks_added,
                    "removed": []
                })
            )
            self.db.add(new_pv)

            # Mark related conflicts as RESOLVED if jurisdiction is confirmed
            conflicts = self.db.query(ConflictModel).filter(ConflictModel.case_id == case_id).all()
            for c in conflicts:
                if "jurisdiction" in c.claim_text.lower():
                    c.status = "RESOLVED"
                    c.resolution_notes = replan_res.get("replan_reason")

            self.db.commit()

            # Record Audit Event
            self._record_audit(
                case_id,
                "DYNAMIC_REPLANNING_EXECUTED",
                f"Dynamic replanning executed: {replan_res.get('replan_reason')}. Invalidated: {replan_res.get('invalidated_tasks')}, Created: {replan_res.get('new_tasks')}",
                replan_res.get("replan_reason"),
                submitted_by,
                {
                    "rule_id": replan_res.get("rule_id", "RULE-JUR-01"),
                    "plan_version": next_version_num,
                    "trigger_evidence_id": ev_id,
                    "sha256": sha256_hash
                }
            )
        else:
            self.db.commit()
            self._record_audit(
                case_id,
                "EVIDENCE_RECORDED",
                f"New evidence uploaded: '{title}' by {submitted_by}",
                "Plan remains valid",
                submitted_by,
                {"evidence_id": ev_id, "sha256": sha256_hash}
            )

        replan_res["evidence_id"] = ev_id
        replan_res["sha256"] = sha256_hash
        return replan_res

    def get_resolution_debt(self, case_id: str) -> Dict[str, Any]:
        return self.debt_calculator.calculate(case_id, self.db)

    def get_plan_versions(self, case_id: str) -> List[Dict[str, Any]]:
        versions = self.db.query(PlanVersionModel).filter(
            PlanVersionModel.case_id == case_id
        ).order_by(PlanVersionModel.version_number.asc()).all()

        return [
            {
                "id": v.id,
                "version_number": v.version_number,
                "reason": v.reason,
                "trigger_evidence_id": v.trigger_evidence_id,
                "status": v.status,
                "created_by": v.created_by,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "task_diff": json.loads(v.task_diff_json or "{}")
            }
            for v in versions
        ]

    def verify_closure(self, case_id: str) -> Dict[str, Any]:
        tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).all()
        conflicts = self.db.query(ConflictModel).filter(ConflictModel.case_id == case_id).all()
        missing_info = self.db.query(MissingInfoModel).filter(MissingInfoModel.case_id == case_id).all()

        task_dicts = [self._task_model_to_dict(t) for t in tasks]
        conflict_dicts = [{"id": c.id, "status": c.status} for c in conflicts]
        missing_dicts = [{"id": m.id, "status": m.status} for m in missing_info]

        verification_result = ClosureVerificationEngine.evaluate_closure_readiness(
            case_id, task_dicts, conflict_dicts, missing_dicts
        )

        debt_report = self.debt_calculator.calculate(case_id, self.db)
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()

        # Strict Resolution Debt enforcement: If resolution debt > 0, closure is strictly denied
        if not debt_report["can_close"]:
            verification_result["can_close"] = False
            verification_result["recommendation"] = "DO_NOT_CLOSE"
            reasons = verification_result.get("blocking_reasons", [])
            for item in debt_report["debt_items"]:
                reasons.append(f"Resolution Debt: {item['title']}")
            verification_result["blocking_reasons"] = list(set(reasons))

        checklist = verification_result.get("checklist", [])
        passed_gates = [c["criterion"] for c in checklist if c.get("passed")]
        failed_gates = [c["criterion"] for c in checklist if not c.get("passed")]

        if verification_result.get("can_close"):
            case.status = "RESOLVED"
            self._record_audit(
                case_id,
                "CASE_VERIFIED_AND_RESOLVED",
                "Case achieved zero resolution debt and passed all statutory verification criteria.",
                "Formal closure authorized.",
                "Grievance Officer",
                {
                    "rule_id": "RULE-CLOSURE-VERIFIED",
                    "passed_gates": passed_gates,
                    "resolution_debt": 0
                }
            )
        else:
            case.status = "RESOLUTION_CANDIDATE" if any(t["status"] == "COMPLETED" for t in task_dicts) else case.status
            self._record_audit(
                case_id,
                "CLOSURE_VERIFICATION_REJECTED",
                f"Closure rejected: {'; '.join(verification_result.get('blocking_reasons', []))}",
                "Premature closure prevented by zero-debt policy",
                "VERIFICATION_ENGINE",
                {
                    "rule_id": "RULE-CLOSURE-GATE-FAILED",
                    "failed_gates": failed_gates,
                    "debt_score": debt_report["total_debt_score"],
                    "blocking_reasons": verification_result.get("blocking_reasons", [])
                }
            )

        self.db.commit()
        return verification_result

    def generate_resolution_certificate(self, case_id: str) -> Dict[str, Any]:
        """
        Generates canonical, cryptographically hashed (SHA-256) resolution certificate.
        Derives solely from actual database records (claims, tasks, evidence, audit logs).
        """
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        claims = self.db.query(ClaimModel).filter(ClaimModel.case_id == case_id).all()
        tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id, TaskModel.status == "COMPLETED").all()
        evidence = self.db.query(EvidenceModel).filter(EvidenceModel.case_id == case_id).all()
        plans = self.db.query(PlanVersionModel).filter(PlanVersionModel.case_id == case_id).all()

        certificate_payload = {
            "certificate_type": "OFFICIAL_RESOLUTION_CERTIFICATE",
            "case_id": case.id,
            "title": case.title,
            "citizen_name": case.citizen_name,
            "location": case.location,
            "category": case.category,
            "status": case.status,
            "claims_count": len(claims),
            "completed_tasks": [t.title for t in tasks],
            "evidence_hashes": [e.sha256 for e in evidence if e.sha256],
            "total_plan_versions": len(plans),
            "certified_at": utc_now().isoformat()
        }

        canonical_string = json.dumps(certificate_payload, sort_keys=True)
        certificate_hash = hashlib.sha256(canonical_string.encode("utf-8")).hexdigest()

        certificate_payload["certificate_hash"] = certificate_hash
        return certificate_payload

    def resolve_missing_info(self, case_id: str, field_name: str, value: str, submitted_by: str) -> Dict[str, Any]:
        miss = self.db.query(MissingInfoModel).filter(
            MissingInfoModel.case_id == case_id,
            MissingInfoModel.field_name == field_name
        ).first()
        if not miss:
            miss = self.db.query(MissingInfoModel).filter(MissingInfoModel.case_id == case_id).first()

        if miss:
            miss.status = "PROVIDED"
            miss.provided_value = value
            self.db.commit()

            self._record_audit(
                case_id,
                "MISSING_INFORMATION_RESOLVED",
                f"Citizen/Officer submitted required data for '{miss.field_name}': {value}",
                "Unblocked case progress",
                submitted_by
            )
            return {"success": True, "field_name": miss.field_name, "status": "PROVIDED"}
        return {"success": False, "message": "Missing info record not found"}

    def get_graph(self, case_id: str) -> Dict[str, Any]:
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        task_dicts = [self._task_model_to_dict(t) for t in tasks]

        nodes = []
        edges = []

        ready_count = len([t for t in task_dicts if t["status"] == "READY"])
        active_count = len([t for t in task_dicts if t["status"] in ["READY", "IN_PROGRESS", "HUMAN_APPROVAL_REQUIRED"]])

        for i, t in enumerate(task_dicts):
            nodes.append({
                "id": t["id"],
                "data": {
                    "label": t["title"],
                    "authority": t["authority"],
                    "risk_level": t["risk_level"],
                    "status": t["status"],
                    "requires_approval": t["requires_human_approval"],
                    "invalidated": t.get("invalidated", False)
                },
                "position": {"x": 100 + (i % 3) * 280, "y": 80 + (i // 3) * 160}
            })

            for dep in t.get("dependencies", []):
                dep_id = dep if dep.startswith(case_id) else f"{case_id}-{dep}"
                edges.append({
                    "id": f"e-{dep_id}-{t['id']}",
                    "source": dep_id,
                    "target": t["id"],
                    "animated": t["status"] in ["READY", "IN_PROGRESS"]
                })

        return {
            "case_id": case_id,
            "workflow_name": case.workflow_name or "Resolution Plan",
            "nodes": nodes,
            "edges": edges,
            "active_tasks_count": active_count,
            "ready_tasks_count": ready_count,
            "parallel_execution_enabled": True
        }

    def _task_model_to_dict(self, t: TaskModel) -> Dict[str, Any]:
        return {
            "id": t.id,
            "key": t.key,
            "title": t.title,
            "authority": t.authority,
            "risk_level": t.risk_level,
            "requires_human_approval": t.requires_human_approval,
            "approval_rule_id": t.approval_rule_id,
            "approval_authority_required": t.approval_authority_required,
            "status": t.status,
            "dependencies": t.dependencies,
            "required_evidence": t.required_evidence,
            "submitted_evidence": t.submitted_evidence,
            "is_replanned": t.is_replanned,
            "invalidated": t.invalidated,
            "invalidated_reason": t.invalidated_reason,
            "approved_by": t.approved_by,
            "approved_at": t.approved_at.isoformat() if t.approved_at else None,
            "order_index": t.order_index
        }

    def _record_audit(self, case_id: str, event_type: str, description: str, reason: str, actor: str, metadata: dict = None):
        ev = AuditEventModel(
            case_id=case_id,
            event_type=event_type,
            description=description,
            reason=reason,
            actor=actor,
            metadata_json=json.dumps(metadata or {})
        )
        self.db.add(ev)
        self.db.commit()
