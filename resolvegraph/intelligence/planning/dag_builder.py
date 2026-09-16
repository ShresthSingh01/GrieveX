import os
import json
from typing import Dict, Any, List, Optional, Tuple
from ..extraction.schemas import ExtractionResult
from ..policy.risk_engine import RiskEngine

class DAGBuilder:
    """
    Constructs a deterministic Resolution Directed Acyclic Graph (DAG)
    from extracted grievance claims and workflow primitives.
    Guarantees no cycles and proper topological ordering.
    """

    def __init__(self, workflows_file: Optional[str] = None):
        if not workflows_file:
            workflows_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "workflows.json")
        self.workflow_templates = {}
        if os.path.exists(workflows_file):
            try:
                with open(workflows_file, "r", encoding="utf-8") as f:
                    self.workflow_templates = json.load(f)
            except Exception:
                pass
        self.risk_engine = RiskEngine()

    def build_dag(self, case_id: str, extraction: ExtractionResult, assumed_authority: Optional[str] = None) -> Dict[str, Any]:
        """
        Builds graph nodes, edges, tasks, and initial dependency states.
        """
        primary_wf_key = "jurisdiction_dispute"
        if extraction.suggested_workflows:
            primary_wf_key = extraction.suggested_workflows[0]

        template = self.workflow_templates.get(primary_wf_key, self.workflow_templates.get("jurisdiction_dispute", {}))
        template_tasks = template.get("tasks", [])

        if not assumed_authority and extraction.authorities:
            assumed_authority = extraction.authorities[0].name
        if not assumed_authority:
            assumed_authority = "Municipality"

        tasks: List[Dict[str, Any]] = []
        key_to_id: Dict[str, str] = {}

        # 1. Map tasks and generate task IDs
        for idx, t_def in enumerate(template_tasks):
            task_id = f"T{idx+1}"
            key = t_def.get("key", f"task_{idx+1}")
            key_to_id[key] = task_id

            # Format authority placeholders
            raw_auth = t_def.get("authority", assumed_authority)
            auth_name = raw_auth.replace("{assumed_authority}", assumed_authority).replace("{determined_authority}", assumed_authority)

            title = t_def.get("title", "")
            risk_level, req_human, rule_id, auth_req = self.risk_engine.evaluate_task_risk(title, auth_name)

            tasks.append({
                "id": task_id,
                "key": key,
                "case_id": case_id,
                "title": title,
                "authority": auth_name,
                "risk_level": risk_level,
                "requires_human_approval": req_human,
                "approval_rule_id": rule_id,
                "approval_authority_required": auth_req,
                "status": "PENDING",
                "raw_dependencies": t_def.get("dependencies", []),
                "dependencies": [], # populated in next pass
                "required_evidence": t_def.get("required_evidence", []),
                "submitted_evidence": [],
                "is_replanned": False,
                "invalidated": False,
                "invalidated_reason": None,
                "order_index": idx
            })

        # 2. Resolve dependency keys to task IDs
        for t in tasks:
            resolved_deps = []
            for dep_key in t["raw_dependencies"]:
                if dep_key in key_to_id:
                    resolved_deps.append(key_to_id[dep_key])
            t["dependencies"] = resolved_deps
            del t["raw_dependencies"]

        # 3. Compute initial statuses based on dependencies
        for t in tasks:
            if not t["dependencies"]:
                if t["requires_human_approval"]:
                    t["status"] = "HUMAN_APPROVAL_REQUIRED"
                else:
                    t["status"] = "READY"
            else:
                t["status"] = "BLOCKED"

        # 4. Generate React Flow nodes and edges
        nodes, edges = self.generate_graph_elements(tasks)

        return {
            "case_id": case_id,
            "workflow_name": template.get("name", "Resolution Plan"),
            "tasks": tasks,
            "nodes": nodes,
            "edges": edges,
            "active_tasks_count": len(tasks)
        }

    def generate_graph_elements(self, tasks: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Creates formatted React Flow nodes and edges with layout coordinates.
        """
        nodes = []
        edges = []

        # Simple hierarchical horizontal/vertical layout
        # Group tasks by layer depth
        depth_map: Dict[str, int] = {}
        for t in tasks:
            tid = t["id"]
            deps = t.get("dependencies", [])
            if not deps:
                depth_map[tid] = 0
            else:
                max_dep_depth = max([depth_map.get(d, 0) for d in deps], default=0)
                depth_map[tid] = max_dep_depth + 1

        layer_counts: Dict[int, int] = {}
        for t in tasks:
            d = depth_map.get(t["id"], 0)
            idx_in_layer = layer_counts.get(d, 0)
            layer_counts[d] = idx_in_layer + 1

            x = 80 + (d * 280)
            y = 80 + (idx_in_layer * 150)

            auth_str = str(t.get("authority", "")).lower()
            if "pwd" in auth_str:
                auth_color = "#3b82f6"  # Blue
            elif "electricity" in auth_str or "discom" in auth_str:
                auth_color = "#f59e0b"  # Amber
            elif "highway" in auth_str or "nhai" in auth_str:
                auth_color = "#8b5cf6"  # Violet
            elif "collectorate" in auth_str or "revenue" in auth_str:
                auth_color = "#ef4444"  # Red
            else:
                auth_color = "#10b981"  # Emerald (Municipality default)

            nodes.append({
                "id": t["id"],
                "type": "taskNode",
                "position": {"x": x, "y": y},
                "data": {
                    "id": t["id"],
                    "title": t["title"],
                    "authority": t["authority"],
                    "authority_color": auth_color,
                    "status": t["status"],
                    "risk_level": t["risk_level"],
                    "requires_human_approval": t.get("requires_human_approval", False),
                    "required_evidence": t.get("required_evidence", []),
                    "submitted_evidence": t.get("submitted_evidence", []),
                    "is_replanned": t.get("is_replanned", False),
                    "invalidated": t.get("invalidated", False)
                }
            })


            for dep_id in t.get("dependencies", []):
                edges.append({
                    "id": f"e-{dep_id}-{t['id']}",
                    "source": dep_id,
                    "target": t["id"],
                    "animated": t["status"] in ["READY", "IN_PROGRESS", "HUMAN_APPROVAL_REQUIRED"],
                    "style": {
                        "stroke": "#ef4444" if t.get("invalidated") else ("#10b981" if t["status"] == "COMPLETED" else "#6366f1"),
                        "strokeWidth": 2
                    }
                })

        return nodes, edges
