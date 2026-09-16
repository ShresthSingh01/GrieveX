from typing import Dict, Any, List

class ClosureVerificationEngine:
    """
    Evidence-based Resolution Verification Engine.
    Ensures that grievances are NOT closed merely because departmental tasks
    were clicked 'complete', but verifies documentary proof and citizen outcome.
    """

    @staticmethod
    def evaluate_closure_readiness(
        case_id: str,
        tasks: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]],
        missing_info: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates 5 critical conditions for closure:
        1. All non-invalidated tasks are COMPLETED
        2. No unresolved conflicts exist
        3. No pending blocking missing information
        4. No pending human approvals
        5. Physical citizen outcome verification evidence is verified
        """
        checklist = []
        can_close = True
        blocking_reasons = []

        # 1. Check Task Completion
        active_tasks = [t for t in tasks if not t.get("invalidated")]
        incomplete_tasks = [t for t in active_tasks if t.get("status") != "COMPLETED"]
        tasks_complete = len(incomplete_tasks) == 0

        checklist.append({
            "criterion": "All Planned Execution Tasks Completed",
            "passed": tasks_complete,
            "details": f"{len(active_tasks) - len(incomplete_tasks)}/{len(active_tasks)} tasks completed." if active_tasks else "No tasks defined"
        })
        if not tasks_complete:
            can_close = False
            blocking_reasons.append(f"{len(incomplete_tasks)} execution tasks are still pending or blocked.")

        # 2. Check Unresolved Conflicts
        unresolved_conflicts = [c for c in conflicts if c.get("status") != "RESOLVED"]
        conflicts_resolved = len(unresolved_conflicts) == 0
        checklist.append({
            "criterion": "All Inter-Departmental Conflicts Resolved",
            "passed": conflicts_resolved,
            "details": f"{len(unresolved_conflicts)} active conflict(s) remaining." if unresolved_conflicts else "No outstanding departmental disputes."
        })
        if not conflicts_resolved:
            can_close = False
            blocking_reasons.append("Unresolved inter-departmental jurisdiction dispute remains open.")

        # 3. Check Blocking Missing Information
        unresolved_missing = [m for m in missing_info if m.get("status") != "RESOLVED"]
        missing_cleared = len(unresolved_missing) == 0
        checklist.append({
            "criterion": "All Critical Identification Data Submitted",
            "passed": missing_cleared,
            "details": f"{len(unresolved_missing)} required item(s) missing." if unresolved_missing else "All necessary identifiers and records submitted."
        })
        if not missing_cleared:
            can_close = False
            blocking_reasons.append("Critical reference or asset information has not been provided.")

        # 4. Check Pending Human Approvals
        pending_approvals = [t for t in active_tasks if t.get("status") == "HUMAN_APPROVAL_REQUIRED"]
        approvals_clear = len(pending_approvals) == 0
        checklist.append({
            "criterion": "All High-Risk Human Approval Gates Cleared",
            "passed": approvals_clear,
            "details": f"{len(pending_approvals)} task(s) awaiting authorized officer signoff." if pending_approvals else "No pending high-risk approval gates."
        })
        if not approvals_clear:
            can_close = False
            blocking_reasons.append("High-risk action requires competent human officer authorization.")

        # 5. Check Citizen Outcome Evidence
        has_outcome_evidence = False
        outcome_evidence_title = ""
        for t in active_tasks:
            if "outcome" in t.get("title", "").lower() or "satisfaction" in t.get("title", "").lower() or "final" in t.get("title", "").lower():
                submitted = t.get("submitted_evidence", [])
                if submitted:
                    has_outcome_evidence = True
                    outcome_evidence_title = submitted[0].get("title", "Outcome Confirmation")
                    break

        checklist.append({
            "criterion": "Ground Citizen Outcome Verification Evidence Provided",
            "passed": has_outcome_evidence,
            "details": f"Verified via: {outcome_evidence_title}" if has_outcome_evidence else "Missing independent on-site outcome verification or citizen satisfaction statement."
        })
        if not has_outcome_evidence:
            can_close = False
            blocking_reasons.append("Repair claimed, but citizen outcome verification evidence is absent. (DO NOT CLOSE PREMATURELY)")

        recommendation = "CLOSE_RECOMMENDED" if can_close else "DO_NOT_CLOSE"

        return {
            "case_id": case_id,
            "recommendation": recommendation,
            "can_close": can_close,
            "checklist": checklist,
            "blocking_reasons": blocking_reasons,
            "summary": "Case is fully verified and ready for formal administrative closure." if can_close else "Case CANNOT be closed yet. Required resolution conditions remain unfulfilled."
        }
