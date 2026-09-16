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

        # Rules matrix for dynamic replanning across multi-agency scenarios
        REPLAN_RULES = [
            {
                "rule_id": "RULE-JUR-PWD",
                "keywords": ["pwd", "trunk", "public works", "arterial", "cadastral"],
                "old_authority": "Municipality",
                "new_authority": "PWD",
                "reason": "Official cadastral survey/demarcation confirms asset belongs to PWD Trunk Network"
            },
            {
                "rule_id": "RULE-JUR-MUN",
                "keywords": ["municipality", "municipal", "ward", "colony drain", "nagar nigam"],
                "old_authority": "PWD",
                "new_authority": "Municipality",
                "reason": "Revenue order confirms municipal ULB jurisdiction over localized drain asset"
            },
            {
                "rule_id": "RULE-JUR-ELEC",
                "keywords": ["electric", "bescom", "discom", "power", "transformer", "pole", "wire"],
                "old_authority": "Municipality",
                "new_authority": "Electricity Board",
                "reason": "Electrical utility hazard identified; jurisdiction transferred to Electricity DISCOM"
            },
            {
                "rule_id": "RULE-JUR-HIGHWAY",
                "keywords": ["nhai", "highway", "state highway", "bypass", "expressway"],
                "old_authority": "Municipality",
                "new_authority": "Highway Authority",
                "reason": "Right-of-way inspection confirms asset belongs to National/State Highway Authority"
            },
            {
                "rule_id": "RULE-JUR-REVENUE",
                "keywords": ["collectorate", "revenue", "tehsildar", "land survey", "encroachment"],
                "old_authority": "Municipality",
                "new_authority": "District Collectorate",
                "reason": "Encroachment dispute transferred to District Collectorate Revenue Division"
            }
        ]

        matched_rule = None
        for rule in REPLAN_RULES:
            if any(kw in content_lower for kw in rule["keywords"]):
                matched_rule = rule
                break

        if matched_rule:
            replan_reason = matched_rule["reason"]
            old_authority = matched_rule["old_authority"]
            new_authority = matched_rule["new_authority"]
            authority_changed = True
        elif "pwd" in content_lower:
            replan_reason = "Cadastral survey evidence confirms asset belongs to PWD trunk network"
            old_authority = "Municipality"
            new_authority = "PWD"
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
            "rule_id": matched_rule.get("rule_id", "RULE-JUR-01") if matched_rule else "RULE-JUR-01",
            "replan_reason": replan_reason if plan_changed else "Evidence recorded without plan alteration",
            "old_authority": old_authority,
            "new_authority": new_authority,
            "shift": f"{old_authority} → {new_authority}" if authority_changed else None,
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

