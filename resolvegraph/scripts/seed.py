import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from resolvegraph.apps.api.app.core.database import SessionLocal, init_db
from resolvegraph.apps.api.app.services.case_service import CaseService
import json

def seed_database():
    print("Initializing database tables...")
    init_db()
    session = SessionLocal()
    service = CaseService(session)

    seed_file = os.path.join(BASE_DIR, "resolvegraph", "data", "grievances.json")
    with open(seed_file, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print(f"Seeding {len(cases)} realistic synthetic cases...")
    for c in cases:
        cid = c["id"]
        # Check if already exists
        detail = None
        try:
            detail = service.get_case_detail(cid)
        except Exception:
            pass

        if not detail:
            case = service.create_case(
                complaint_text=c["complaint"],
                title=c["title"],
                citizen_name=c["citizen_name"],
                location=c["location"],
                category=c["category"]
            )
            # Update ID to match seed ID
            case.id = cid
            session.commit()
            service.analyze_case(cid, force_offline=True)
            print(f"  + Seeded and planned: {cid} - {c['title']}")
        else:
            print(f"  * Already present: {cid}")

    session.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
