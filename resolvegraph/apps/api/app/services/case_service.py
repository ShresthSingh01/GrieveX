import json
import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.models import (
    CaseModel, ClaimModel, AuthorityModel, TaskModel,
    EvidenceModel, ConflictModel, MissingInfoModel, AuditEventModel
)
from .....intelligence.extraction.extractor import GrievanceExtractor
from .....intelligence.planning.dag_builder import DAGBuilder
from .....intelligence.planning.scheduler import TaskScheduler
from .....intelligence.replanning.engine import ReplanningEngine
from .....intelligence.verification.closure import ClosureVerificationEngine

class CaseService:
    def __init__(self, db: Session):
        self.db = db
        self.extractor = GrievanceExtractor()
        self.dag_builder = DAGBuilder()
        self.replanning_engine = ReplanningEngine()

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
            # Generate clean title from first sentence
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

        # Record Audit Event
        self._record_audit(case_id, "CASE_CREATED", f"Citizen grievance registered: '{title}'", "Citizen Submission", "CITIZEN")
        return case

    def analyze_case(self, case_id: str, force_offline: bool = False) -> CaseModel:
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        # 1. LLM / Offline Extraction
        extraction = self.extractor.extract(case.complaint_text, force_offline=force_offline, case_id=case.id)

        case.goal = extraction.goal
        case.status = "ANALYZED"
        if extraction.authorities:
            case.assumed_authority = extraction.authorities[0].name

        # Clean old extractions if re-analyzing
        self.db.query(ClaimModel).filter(ClaimModel.case_id == case_id).delete()
        self.db.query(AuthorityModel).filter(AuthorityModel.case_id == case_id).delete()
        self.db.query(ConflictModel).filter(ConflictModel.case_id == case_id).delete()
        self.db.query(MissingInfoModel).filter(MissingInfoModel.case_id == case_id).delete()
        self.db.query(TaskModel).filter(TaskModel.case_id == case_id).delete()

        # 2. Persist Claims
        for c in extraction.claims:
            claim_rec = ClaimModel(
                id=f"{case_id}-{c.id}",
                case_id=case_id,
                text=c.text,
                category=c.category or "factual_claim",
                confidence=c.confidence
            )
            self.db.add(claim_rec)

        # 3. Persist Authorities
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

        # 4. Persist Conflicts
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

        # 5. Persist Missing Information
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

        # 6. Build Deterministic DAG Plan
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

        case.status = "IN_PROGRESS"
        self.db.commit()

        # Audit Event
        self._record_audit(
            case_id,
            "GRIEVANCE_ANALYZED_AND_PLANNED",
            f"Extracted {len(extraction.claims)} claims, {len(extraction.authorities)} authorities. Generated DAG with {len(dag_plan.get('tasks', []))} tasks.",
            f"Mode: {extraction.extractor_mode}",
            "INTELLIGENCE_ENGINE",
            {"workflow": case.workflow_name}
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
        tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_index_asc() if hasattr(TaskModel, 'order_index_asc') else self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        audit_events = self.db.query(AuditEventModel).filter(AuditEventModel.case_id == case_id).order_by(AuditEventModel.created_at.desc()).all()

        task_dicts = [self._task_model_to_dict(t) for t in tasks]
        ready_count = len([t for t in task_dicts if t["status"] == "READY"])

        return {
            "id": case.id,
            "title": case.title,
            "complaint_text": case.complaint_text,
            "citizen_name": case.citizen_name,
            "location": case.location,
            "category": case.category,
            "goal": case.goal,
            "status": case.status,
            "assumed_authority": case.assumed_authority,
            "workflow_name": case.workflow_name,
            "claims": [{"id": c.id, "text": c.text, "category": c.category, "confidence": c.confidence} for c in claims],
            "authorities": [{"id": a.id, "name": a.name, "role": a.role, "department": a.department, "confidence": a.confidence} for a in authorities],
            "conflicts": [{"id": cf.id, "claim_text": cf.claim_text, "party_a": cf.party_a, "party_b": cf.party_b, "description": cf.description, "status": cf.status, "resolution_notes": cf.resolution_notes} for cf in conflicts],
            "missing_info": [{"id": m.id, "field_name": m.field_name, "description": m.description, "importance": m.importance, "action_required": m.action_required, "status": m.status, "provided_value": m.provided_value} for m in missing_info],
            "tasks": task_dicts,
            "audit_events": [
                {
                    "id": a.id,
                    "case_id": a.case_id,
                    "event_type": a.event_type,
                    "description": a.description,
                    "reason": a.reason,
                    "actor": a.actor,
                    "metadata": json.loads(a.metadata_json or "{}"),
                    "created_at": a.created_at
                }
                for a in audit_events
            ],
            "ready_tasks_count": ready_count,
            "created_at": case.created_at,
            "updated_at": case.updated_at
        }

    def get_graph(self, case_id: str) -> Dict[str, Any]:
        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        task_dicts = [self._task_model_to_dict(t) for t in tasks]

        # Use DAGBuilder to calculate React Flow layout
        # Strip case_id prefix for cleaner UI node labels
        for t in task_dicts:
            t["id"] = t["id"].replace(f"{case_id}-", "")
            t["dependencies"] = [d.replace(f"{case_id}-", "") for d in t["dependencies"]]

        nodes, edges = self.dag_builder.generate_graph_elements(task_dicts)
        ready_count = len([t for t in task_dicts if t["status"] == "READY"])

        return {
            "case_id": case_id,
            "workflow_name": case.workflow_name or "Resolution Graph",
            "nodes": nodes,
            "edges": edges,
            "active_tasks_count": len([t for t in task_dicts if not t.get("invalidated")]),
            "ready_tasks_count": ready_count,
            "parallel_execution_enabled": True
        }

    def complete_task(self, case_id: str, task_id: str, evidence_title: str, evidence_content: str, submitted_by: str) -> Dict[str, Any]:
        full_task_id = task_id if task_id.startswith(case_id) else f"{case_id}-{task_id}"
        task = self.db.query(TaskModel).filter(TaskModel.id == full_task_id, TaskModel.case_id == case_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        if task.invalidated:
            raise ValueError(f"Cannot complete invalidated task: {task.invalidated_reason}")

        if task.status == "HUMAN_APPROVAL_REQUIRED":
            raise ValueError(f"Task {task_id} requires human approval before completion.")

        # 1. Update task state
        task.status = "COMPLETED"
        submitted = task.submitted_evidence
        evidence_entry = {
            "title": evidence_title,
            "content": evidence_content,
            "submitted_by": submitted_by,
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        submitted.append(evidence_entry)
        task.submitted_evidence = submitted

        # 2. Record in evidence table
        ev_model = EvidenceModel(
            id=f"EV-{str(uuid.uuid4())[:8]}",
            case_id=case_id,
            task_id=full_task_id,
            evidence_type="TASK_COMPLETION",
            title=evidence_title,
            content=evidence_content,
            submitted_by=submitted_by
        )
        self.db.add(ev_model)

        # 3. Recalculate downstream task statuses
        all_tasks = self.db.query(TaskModel).filter(TaskModel.case_id == case_id).order_by(TaskModel.order_index).all()
        task_dicts = [self._task_model_to_dict(t) for t in all_tasks]

        # Use normalized short IDs for scheduler evaluation
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
                t_obj.status = st["status"]

        self.db.commit()

        # Audit Event
        self._record_audit(
            case_id,
            "TASK_COMPLETED",
            f"Task '{task.title}' completed by {submitted_by}. Evidence submitted: '{evidence_title}'",
            "Prerequisites verified, dependent tasks updated.",
            submitted_by
        )

        return {"success": True, "task_id": task_id, "new_status": "COMPLETED"}

    def approve_task(self, case_id: str, task_id: str, officer_name: str, officer_role: str, decision: str, notes: str) -> Dict[str, Any]:
        full_task_id = task_id if task_id.startswith(case_id) else f"{case_id}-{task_id}"
        task = self.db.query(TaskModel).filter(TaskModel.id == full_task_id, TaskModel.case_id == case_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        if decision == "APPROVED":
            task.approved_by = f"{officer_name} ({officer_role})"
            task.approved_at = datetime.datetime.utcnow()
            task.status = "READY"
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
        ev = EvidenceModel(
            id=ev_id,
            case_id=case_id,
            task_id=task_id,
            evidence_type=evidence_type,
            title=title,
            content=content,
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

        # 3. If plan changed, sync DB models
        if replan_res.get("plan_changed"):
            case.status = "REPLANNED"
            # Update existing tasks
            for st in replan_res.get("tasks", []):
                full_tid = f"{case_id}-{st['id']}"
                existing = next((x for x in all_tasks if x.id == full_tid), None)
                if existing:
                    existing.status = st["status"]
                    existing.invalidated = st.get("invalidated", False)
                    existing.invalidated_reason = st.get("invalidated_reason")
                    existing.dependencies = [f"{case_id}-{d}" for d in st.get("dependencies", [])]
                else:
                    # New task added by replanner
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
                "New evidence received altering case state",
                submitted_by,
                {
                    "invalidated_tasks": replan_res.get("invalidated_tasks"),
                    "new_tasks": replan_res.get("new_tasks")
                }
            )
        else:
            self.db.commit()
            self._record_audit(
                case_id,
                "EVIDENCE_RECORDED",
                f"New evidence uploaded: '{title}' by {submitted_by}",
                "Plan remains valid",
                submitted_by
            )

        return replan_res

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

        case = self.db.query(CaseModel).filter(CaseModel.id == case_id).first()
        if verification_result.get("can_close"):
            case.status = "RESOLVED"
            self._record_audit(
                case_id,
                "CASE_VERIFIED_AND_RESOLVED",
                "Case achieved evidence-based resolution and passed all closure criteria.",
                "Formal closure authorized.",
                "Grievance Officer"
            )
        else:
            case.status = "RESOLUTION_CANDIDATE" if any(t["status"] == "COMPLETED" for t in task_dicts) else case.status
            self._record_audit(
                case_id,
                "CLOSURE_VERIFICATION_REJECTED",
                f"Closure rejected: {'; '.join(verification_result.get('blocking_reasons', []))}",
                "Premature closure prevented by policy checks",
                "VERIFICATION_ENGINE"
            )

        self.db.commit()
        return verification_result

    def resolve_missing_info(self, case_id: str, field_name: str, value: str, submitted_by: str) -> Dict[str, Any]:
        miss = self.db.query(MissingInfoModel).filter(
            MissingInfoModel.case_id == case_id,
            MissingInfoModel.field_name == field_name
        ).first()
        if not miss:
            # Fallback by case id only
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
            "approved_at": t.approved_at,
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
