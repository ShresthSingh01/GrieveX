import os
import sys
import pytest

# Add resolvegraph to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from resolvegraph.apps.api.app.core.database import Base, SessionLocal, engine
from resolvegraph.apps.api.app.services.case_service import CaseService
from resolvegraph.intelligence.extraction.extractor import GrievanceExtractor
from resolvegraph.intelligence.verification.closure import ClosureVerificationEngine

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_01_simple_grievance_extraction_and_dag(db_session):
    service = CaseService(db_session)
    complaint = "The pole-mounted LED streetlight outside the working women's hostel has been non-functional for 3 weeks, leaving the alley completely dark and unsafe at night."
    case = service.create_case(complaint_text=complaint, title="Broken Streetlight", citizen_name="Pooja Hegde")
    assert case.id.startswith("GRV-")

    # Analyze case
    analyzed = service.analyze_case(case.id, force_offline=True)
    assert analyzed.status == "IN_PROGRESS"
    assert analyzed.goal is not None

    detail = service.get_case_detail(case.id)
    assert len(detail["claims"]) >= 1
    assert len(detail["tasks"]) >= 3

    # Parallel ready count
    graph = service.get_graph(case.id)
    assert len(graph["nodes"]) == len(detail["tasks"])
    assert len(graph["edges"]) >= 2

def test_02_complex_drainage_dispute_and_parallel_tasks(db_session):
    service = CaseService(db_session)
    complaint = (
        "My house at 42 Rajendra Nagar is repeatedly flooded during every rain because the main arterial stormwater drain outside is severely blocked with debris. "
        "The Municipality ward officer claims the arterial drain falls under PWD jurisdiction and refuses to clear it, while PWD local office has not responded to multiple visits. "
        "The backflow is now causing structural dampness and severe property damage to my boundary wall."
    )
    case = service.create_case(
        complaint_text=complaint,
        title="Severe Residential Flooding & Blocked Arterial Drain",
        citizen_name="Ramesh Verma"
    )

    analyzed = service.analyze_case(case.id, force_offline=True)
    detail = service.get_case_detail(case.id)

    # Must detect multiple authorities
    auth_names = [a["name"] for a in detail["authorities"]]
    assert "Municipality" in auth_names or "PWD" in auth_names

    # Must detect conflict
    assert len(detail["conflicts"]) >= 1
    assert "jurisdiction" in detail["conflicts"][0]["claim_text"].lower()

    # Must detect missing info
    assert len(detail["missing_info"]) >= 1

    # Check task readiness
    ready_tasks = [t for t in detail["tasks"] if t["status"] == "READY"]
    assert len(ready_tasks) >= 1

def test_03_high_risk_human_approval_gate(db_session):
    service = CaseService(db_session)
    complaint = "The municipal enforcement squad demolished our shed. We demand financial compensation of 12 Lakh Rupees."
    case = service.create_case(complaint_text=complaint, title="Demolition Compensation Demand")
    service.analyze_case(case.id, force_offline=True)

    detail = service.get_case_detail(case.id)
    high_risk_tasks = [t for t in detail["tasks"] if t["risk_level"] == "HIGH"]
    assert len(high_risk_tasks) >= 1

    # Attempting to approve as authorized officer
    target_task = high_risk_tasks[0]
    app_res = service.approve_task(
        case_id=case.id,
        task_id=target_task["id"],
        officer_name="District Collector K. Raman",
        officer_role="Executive Magistrate",
        decision="APPROVED",
        notes="Financial audit complete, sanction approved."
    )
    assert app_res["success"] is True
    assert app_res["status"] == "READY"

def test_04_dynamic_replanning_on_new_evidence(db_session):
    service = CaseService(db_session)
    complaint = "House flooded because of drain. Municipality says it belongs to PWD. PWD has not responded."
    case = service.create_case(complaint_text=complaint, title="Drain Dispute Flooding")
    service.analyze_case(case.id, force_offline=True)

    initial_detail = service.get_case_detail(case.id)
    initial_task_count = len(initial_detail["tasks"])

    # Inject new evidence that PWD is responsible
    replan_res = service.submit_evidence(
        case_id=case.id,
        evidence_type="CADASTRAL_GAZETTE_SURVEY",
        title="Cadastral Jurisdiction Order No. 441/2026",
        content="PWD State Highway Division Executive Engineer confirms by gazette survey that arterial storm drain asset belongs to PWD Trunk Infrastructure.",
        submitted_by="Revenue Tehsildar"
    )

    assert replan_res["plan_changed"] is True
    assert len(replan_res["invalidated_tasks"]) >= 1
    assert len(replan_res["new_tasks"]) >= 1

    updated_detail = service.get_case_detail(case.id)
    # The old municipal repair task must now be INVALIDATED
    inv_task = next((t for t in updated_detail["tasks"] if t["invalidated"]), None)
    assert inv_task is not None
    assert inv_task["status"] == "INVALIDATED"

    # The new PWD repair task must be present and correctly wired to dependencies
    new_pwd_task = next((t for t in updated_detail["tasks"] if "PWD" in t["authority"] and t["is_replanned"]), None)
    assert new_pwd_task is not None
    assert new_pwd_task["status"] in ["READY", "BLOCKED"]
    assert len(new_pwd_task["dependencies"]) >= 1

def test_05_evidence_based_closure_prevents_premature_close(db_session):
    service = CaseService(db_session)
    complaint = "Streetlight broken."
    case = service.create_case(complaint_text=complaint, title="Broken Streetlight")
    service.analyze_case(case.id, force_offline=True)

    # Try to verify before any tasks are done
    verif = service.verify_closure(case.id)
    assert verif["can_close"] is False
    assert verif["recommendation"] == "DO_NOT_CLOSE"
    assert len(verif["blocking_reasons"]) >= 1
