import pytest
import hashlib
from resolvegraph.apps.api.app.core.database import SessionLocal, init_db
from resolvegraph.apps.api.app.core.state_machine import (
    transition_case, transition_task, InvalidStateTransitionError
)
from resolvegraph.apps.api.app.services.case_service import CaseService
from resolvegraph.apps.api.app.services.resolution_debt import ResolutionDebtCalculator
from resolvegraph.apps.api.app.models.models import CaseModel, TaskModel, AssumptionModel, PlanVersionModel

@pytest.fixture(scope="module")
def db_session():
    init_db()
    session = SessionLocal()
    yield session
    session.close()

def test_state_machine_transitions(db_session):
    case = CaseModel(id="TEST-SM-1", title="Test Case", complaint_text="Sample text", status="NEW")
    
    # Valid transition: NEW -> ANALYZED
    transition_case(case, "ANALYZED")
    assert case.status == "ANALYZED"

    # Valid transition: ANALYZED -> IN_PROGRESS
    transition_case(case, "IN_PROGRESS")
    assert case.status == "IN_PROGRESS"

    # Invalid transition: IN_PROGRESS cannot jump directly to FAILED without intermediate failure
    task = TaskModel(id="TASK-1", key="T1", title="Inspect site", authority="PWD", status="BLOCKED")
    
    # Valid task transition: BLOCKED -> READY
    transition_task(task, "READY")
    assert task.status == "READY"

    # Valid task transition: READY -> IN_PROGRESS
    transition_task(task, "IN_PROGRESS")
    assert task.status == "IN_PROGRESS"

    # Valid task transition: IN_PROGRESS -> COMPLETED
    transition_task(task, "COMPLETED")
    assert task.status == "COMPLETED"

    # Invalid task transition: COMPLETED cannot revert to READY directly
    with pytest.raises(InvalidStateTransitionError):
        transition_task(task, "READY")

def test_plan_versioning_and_assumptions(db_session):
    service = CaseService(db_session)
    complaint = "House flooded because of drain. Municipality says it belongs to PWD. PWD has not responded."
    case = service.create_case(complaint_text=complaint, title="Drain Dispute Flooding")
    service.analyze_case(case.id, force_offline=True)

    # Verify Plan Version 1 was created
    plans = service.get_plan_versions(case.id)
    assert len(plans) >= 1
    assert plans[0]["version_number"] == 1
    assert plans[0]["status"] == "ACTIVE"

    # Verify initial assumption was recorded
    assumptions = db_session.query(AssumptionModel).filter(AssumptionModel.case_id == case.id).all()
    assert len(assumptions) >= 1
    assert assumptions[0].status == "ACTIVE"

    # Submit official evidence that triggers dynamic replan
    replan_res = service.submit_evidence(
        case_id=case.id,
        evidence_type="CADASTRAL_GAZETTE_SURVEY",
        title="Cadastral Jurisdiction Order No. 441/2026",
        content="PWD State Highway Division Executive Engineer confirms by gazette survey that arterial storm drain asset belongs to PWD Trunk Infrastructure.",
        submitted_by="Revenue Tehsildar"
    )

    assert replan_res.get("plan_changed") is True
    
    # Verify Plan Version 2 was created and marked ACTIVE, version 1 SUPERSEDED
    plans_after = service.get_plan_versions(case.id)
    assert len(plans_after) == 2
    assert plans_after[0]["status"] == "SUPERSEDED"
    assert plans_after[1]["version_number"] == 2
    assert plans_after[1]["status"] == "ACTIVE"

    # Verify assumption was invalidated with provenance
    assump_after = db_session.query(AssumptionModel).filter(AssumptionModel.case_id == case.id).all()
    assert any(a.status == "INVALIDATED" for a in assump_after)
    assert any(a.invalidated_by_evidence_id is not None for a in assump_after)

def test_resolution_debt_and_certificate(db_session):
    service = CaseService(db_session)
    complaint = "Streetlight outside hostel is broken."
    case = service.create_case(complaint_text=complaint, title="Streetlight Issue")
    service.analyze_case(case.id, force_offline=True)

    # Resolution debt must be > 0 initially because tasks and verification are incomplete
    debt = service.get_resolution_debt(case.id)
    assert debt["total_debt_score"] > 0
    assert debt["can_close"] is False

    # Closure verification must be rejected due to unresolved debt
    verif = service.verify_closure(case.id)
    assert verif["can_close"] is False
    assert verif["recommendation"] == "DO_NOT_CLOSE"

    # Generate resolution certificate
    cert = service.generate_resolution_certificate(case.id)
    assert cert["case_id"] == case.id
    assert "certificate_hash" in cert
    assert len(cert["certificate_hash"]) == 64  # SHA-256 digest
