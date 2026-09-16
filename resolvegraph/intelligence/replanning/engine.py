import copy
from typing import Dict, Any, List, Tuple
from ..planning.dag_builder import DAGBuilder
from ..planning.scheduler import TaskScheduler

class ReplanningEngine:
    """
    Dynamic Replanning Engine:
    When new evidence is submitted (e.g. jurisdiction confirmation, asset survey,
    contradictory inspection result), this engine:
    1. Identifies affected claims and tasks
    2. Invalidates obsolete tasks
    3. Generates new replacement tasks with updated authority
    4. Re-wires DAG dependencies
    5. Re-computes topological readiness
    6. Produces an auditable replan diff
    """

    def __init__(self):
        self.dag_builder = DAGBuilder()

    def process_new_evidence(
        self,
        case_id: str,
        current_tasks: List[Dict[str, Any]],
        evidence_type: str,
        evidence_content: str,
        submitted_by: str
    ) -> Dict[str, Any]:
        """
        Evaluates new evidence against active tasks and executes dynamic replanning.
        """
        content_lower = evidence_content.lower()
        tasks = copy.deepcopy(current_tasks)

        invalidated_tasks: List[str] = []
        new_tasks: List[Dict[str, Any]] = []
        replan_reason = ""
        authority_changed = False
        new_authority = None
        old_authority = None

        # Check for Jurisdiction Evidence
        if "pwd" in content_lower and ("belongs to pwd" in content_lower or "trunk infrastructure" in content_lower or "pwd jurisdiction" in content_lower):
            replan_reason = "New official cadastral survey evidence confirms asset belongs to PWD trunk network"
            old_authority = "Municipality"
            new_authority = "PWD"
            authority_changed = True
        elif "municipality" in content_lower and ("belongs to municipality" in content_lower or "municipal asset" in content_lower):
            replan_reason = "New revenue order confirms municipal jurisdiction over drain asset"
            old_authority = "PWD"
            new_authority = "Municipality"
            authority_changed = True

        if authority_changed and new_authority and old_authority:
            # Find tasks assigned to old_authority that represent physical execution or inspection
            for t in tasks:
                if t.get("authority") == old_authority and not t.get("invalidated"):
                    # If this task was physical execution/repair and was based on the old assumption
                    if any(k in t.get("title", "").lower() for k in ["repair", "execute", "desilting", "reconstruction"]):
                        t["status"] = "INVALIDATED"
                        t["invalidated"] = True
                        t["invalidated_reason"] = f"Jurisdiction shifted to {new_authority} based on verified cadastral evidence"
                        invalidated_tasks.append(t["id"])

                        # Create the new replanned replacement task
                        new_task_id = f"T{len(tasks) + len(new_tasks) + 1}"
                        new_task = {
                            "id": new_task_id,
                            "key": f"{t['key']}_replanned_{new_authority.lower()}",
                            "case_id": case_id,
                            "title": f"Execute Physical Desilting & Repair Work [{new_authority} Division]",
                            "authority": new_authority,
                            "risk_level": "MEDIUM",
                            "requires_human_approval": False,
                            "approval_rule_id": "RULE-OPS-04",
                            "approval_authority_required": f"Superintending Engineer ({new_authority})",
                            "status": "READY",  # Ready because jurisdiction is now confirmed!
                            "dependencies": [d for d in t.get("dependencies", [])],
                            "required_evidence": [
                                f"{new_authority} Technical Work Order",
                                "Post-Desilting High-Res Inspection Photos",
                                "Flow Clearance Velocity Signoff"
                            ],
                            "submitted_evidence": [
                                {
                                    "title": "Cadastral Survey Demarcation Order",
                                    "content": evidence_content,
                                    "submitted_by": submitted_by
                                }
                            ],
                            "is_replanned": True,
                            "invalidated": False,
                            "invalidated_reason": None,
                            "order_index": len(tasks) + len(new_tasks)
                        }
                        new_tasks.append(new_task)

            # Rewire downstream dependencies:
            # If downstream tasks (like citizen_outcome_verification) depended on the invalidated task,
            # update them to depend on the new task!
            if new_tasks:
                replanned_id_map = {invalidated_tasks[0]: new_tasks[0]["id"]}
                for t in tasks:
                    new_deps = []
                    for dep in t.get("dependencies", []):
                        if dep in replanned_id_map:
                            new_deps.append(replanned_id_map[dep])
                        else:
                            new_deps.append(dep)
                    t["dependencies"] = new_deps

        all_updated_tasks = tasks + new_tasks

        # Recalculate topological scheduling
        all_updated_tasks = TaskScheduler.recalculate_task_states(all_updated_tasks)

        # Regenerate React Flow nodes and edges
        nodes, edges = self.dag_builder.generate_graph_elements(all_updated_tasks)

        plan_changed = len(invalidated_tasks) > 0 or len(new_tasks) > 0

        return {
            "plan_changed": plan_changed,
            "replan_reason": replan_reason if plan_changed else "Evidence recorded without plan alteration",
            "invalidated_tasks": invalidated_tasks,
            "new_tasks": [t["id"] for t in new_tasks],
            "tasks": all_updated_tasks,
            "nodes": nodes,
            "edges": edges,
            "evidence_item": {
                "type": evidence_type,
                "content": evidence_content,
                "submitted_by": submitted_by
            }
        }
