from typing import List, Dict, Any

class TaskScheduler:
    """
    Evaluates topological dependencies and recalculates task readiness states.
    Allows independent tasks to execute in parallel without sequential bottlenecks.
    """

    @staticmethod
    def recalculate_task_states(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Updates each task's status based on completion of prerequisite dependencies.
        Returns the updated task list.
        """
        completed_task_ids = {t["id"] for t in tasks if t.get("status") == "COMPLETED"}

        for t in tasks:
            # Completed, Invalidated, or In Progress tasks retain their terminal/active state
            if t.get("invalidated") or t.get("status") in ["COMPLETED", "IN_PROGRESS"]:
                continue

            deps = t.get("dependencies", [])
            # All prerequisite dependencies are satisfied if all deps are in completed_task_ids
            deps_satisfied = all(dep in completed_task_ids for dep in deps)

            if deps_satisfied:
                if t.get("requires_human_approval") and t.get("status") != "HUMAN_APPROVAL_REQUIRED":
                    # If human approval has not been granted yet
                    if not t.get("approved_by"):
                        t["status"] = "HUMAN_APPROVAL_REQUIRED"
                    else:
                        t["status"] = "READY"
                elif not t.get("requires_human_approval"):
                    t["status"] = "READY"
            else:
                t["status"] = "BLOCKED"

        return tasks

    @staticmethod
    def get_ready_tasks(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Returns all tasks that are currently READY to be worked on in parallel."""
        return [t for t in tasks if t.get("status") == "READY"]

    @staticmethod
    def get_parallel_ready_count(tasks: List[Dict[str, Any]]) -> int:
        """Counts how many tasks can execute simultaneously right now."""
        return len([t for t in tasks if t.get("status") in ["READY", "IN_PROGRESS"]])
