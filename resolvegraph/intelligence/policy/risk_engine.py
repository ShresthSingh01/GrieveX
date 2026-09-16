import json
import os
from typing import Dict, Any, Tuple

class RiskEngine:
    """
    Deterministic Policy and Risk Engine.
    Assigns risk level (LOW, MEDIUM, HIGH) and human approval requirements
    based on formal administrative rules, never LLM guesswork.
    """

    def __init__(self, policy_file: str = None):
        if not policy_file:
            policy_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "policies.json")
        self.rules = []
        if os.path.exists(policy_file):
            try:
                with open(policy_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.rules = data.get("risk_rules", [])
            except Exception:
                pass

        if not self.rules:
            # Fallback default hard-coded policy rules
            self.rules = [
                {
                    "rule_id": "RULE-FIN-01",
                    "keywords": ["compensation", "sanction", "disbursement", "arrears", "damage"],
                    "risk_level": "HIGH",
                    "requires_human_approval": True,
                    "authority_required": "District Magistrate Office / Competent Officer"
                },
                {
                    "rule_id": "RULE-JUR-02",
                    "keywords": ["determine responsibility", "jurisdiction", "ownership", "demarcation"],
                    "risk_level": "HIGH",
                    "requires_human_approval": True,
                    "authority_required": "Joint Revenue Committee / SDM"
                },
                {
                    "rule_id": "RULE-CLS-03",
                    "keywords": ["closure", "outcome verification", "final verification"],
                    "risk_level": "HIGH",
                    "requires_human_approval": True,
                    "authority_required": "Grievance Redressal Officer"
                },
                {
                    "rule_id": "RULE-OPS-04",
                    "keywords": ["repair", "reconstruction", "desilting", "joint inspection"],
                    "risk_level": "MEDIUM",
                    "requires_human_approval": False,
                    "authority_required": "Designated Departmental Nodal Officer"
                }
            ]

    def evaluate_task_risk(self, task_title: str, task_authority: str = "") -> Tuple[str, bool, str, str]:
        """
        Returns: (risk_level, requires_human_approval, matched_rule_id, authority_required)
        """
        title_lower = task_title.lower()

        for rule in self.rules:
            for kw in rule.get("keywords", []):
                if kw in title_lower:
                    return (
                        rule.get("risk_level", "MEDIUM"),
                        rule.get("requires_human_approval", False),
                        rule.get("rule_id", "DEFAULT"),
                        rule.get("authority_required", "Competent Officer")
                    )

        # Default fallback is LOW for non-consequential informational tasks
        return ("LOW", False, "RULE-INF-05", "Automated Field Inspector")
