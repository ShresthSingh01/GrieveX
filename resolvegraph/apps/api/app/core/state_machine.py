from typing import Dict, List

class InvalidStateTransitionError(ValueError):
    def __init__(self, current_status: str, target_status: str, entity_type: str = "Entity"):
        super().__init__(
            f"Invalid {entity_type} state transition: Cannot transition from '{current_status}' to '{target_status}'."
        )
        self.current_status = current_status
        self.target_status = target_status
        self.entity_type = entity_type

# Allowed Case State Transitions
CASE_TRANSITIONS: Dict[str, List[str]] = {
    "NEW": ["ANALYZING", "ANALYZED"],
    "ANALYZING": ["ANALYZED", "FAILED"],
    "ANALYZED": ["IN_PROGRESS", "REPLANNING"],
    "IN_PROGRESS": [
        "WAITING_FOR_CITIZEN",
        "WAITING_FOR_AUTHORITY",
        "WAITING_FOR_APPROVAL",
        "REPLANNING",
        "READY_FOR_CLOSURE",
        "RESOLUTION_CANDIDATE",
        "CLOSED",
        "RESOLVED"
    ],
    "WAITING_FOR_CITIZEN": ["IN_PROGRESS", "FAILED"],
    "WAITING_FOR_AUTHORITY": ["IN_PROGRESS", "REPLANNING", "FAILED"],
    "WAITING_FOR_APPROVAL": ["IN_PROGRESS", "FAILED"],
    "REPLANNING": ["IN_PROGRESS", "ANALYZED", "FAILED"],
    "READY_FOR_CLOSURE": ["CLOSED", "RESOLVED", "IN_PROGRESS"],
    "RESOLUTION_CANDIDATE": ["CLOSED", "RESOLVED", "IN_PROGRESS"],
    "CLOSED": [],
    "RESOLVED": [],
    "FAILED": ["ANALYZING", "NEW", "IN_PROGRESS"],
}

# Allowed Task State Transitions
TASK_TRANSITIONS: Dict[str, List[str]] = {
    "PENDING": ["BLOCKED", "READY", "HUMAN_APPROVAL_REQUIRED", "INVALIDATED"],
    "BLOCKED": ["READY", "INVALIDATED"],
    "READY": ["IN_PROGRESS", "HUMAN_APPROVAL_REQUIRED", "INVALIDATED", "COMPLETED"],
    "IN_PROGRESS": ["COMPLETED", "FAILED", "HUMAN_APPROVAL_REQUIRED", "INVALIDATED"],
    "HUMAN_APPROVAL_REQUIRED": ["IN_PROGRESS", "READY", "COMPLETED", "FAILED", "INVALIDATED"],
    "COMPLETED": ["INVALIDATED"], # A completed task can only be replaced/invalidated via an approved replan
    "INVALIDATED": [],
    "FAILED": ["READY", "IN_PROGRESS"],
}

def can_transition_case(current_status: str, target_status: str) -> bool:
    if current_status == target_status:
        return True
    return target_status in CASE_TRANSITIONS.get(current_status, [])

def transition_case(case, target_status: str) -> str:
    current = getattr(case, "status", None)
    if not can_transition_case(current, target_status):
        raise InvalidStateTransitionError(current, target_status, entity_type="Case")
    case.status = target_status
    return target_status

def can_transition_task(current_status: str, target_status: str) -> bool:
    if current_status == target_status:
        return True
    return target_status in TASK_TRANSITIONS.get(current_status, [])

def transition_task(task, target_status: str) -> str:
    current = getattr(task, "status", None)
    if not can_transition_task(current, target_status):
        raise InvalidStateTransitionError(current, target_status, entity_type="Task")
    task.status = target_status
    return target_status
