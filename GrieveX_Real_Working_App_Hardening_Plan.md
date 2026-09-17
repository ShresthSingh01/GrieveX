# GrieveX — Real-Working App Hardening & Productionization Plan

## Objective

Make GrieveX / ResolveGraph a genuinely working application with **no fake live behavior, no mocked production integrations, no hard-coded metrics, and no silent simulation fallback**.

The engineering rule is:

> **AI interprets and proposes. Deterministic software controls state, authorization, workflow transitions, evidence requirements, safety gates, verification, and auditability.**

---

## 1. Current Problems Found

The repository already has a strong foundation: FastAPI, Next.js, persistence, claim/authority/conflict/missing-information extraction, deterministic DAG planning, scheduling, evidence, human approval, replanning, closure verification, audit events, and graph visualization.

The biggest credibility issues are:

1. Demo/reset execution can explicitly force offline extraction.
2. The evaluation endpoint contains hard-coded benchmark values.
3. The extractor can use seed/cache/offline paths before live AI.
4. Replanning is primarily rule/keyword driven rather than evidence/graph driven.
5. A task DAG does not fully represent the reasoning chain from claim to outcome.
6. Assumptions are not first-class persistent objects.
7. Plan versions and plan diffs need to become first-class.
8. Impact radius and minimum-change replanning need explicit implementation.
9. Resolution debt is not yet a formal closure metric.
10. A resolution certificate needs to be generated from actual evidence and audit records.
11. Evidence needs real file storage, hashing, extraction, and provenance.
12. Authentication/authorization must be backend-enforced for officer actions.
13. External government APIs must never be faked or claimed as integrated when unavailable.
14. State transitions, concurrency, idempotency, retries, and observability need production hardening.

---

# 2. Definition of "REAL"

A feature is real only when:

- input comes from a real user or configured external source;
- the backend validates it;
- executable logic produces the result;
- the result is persisted;
- the frontend reads persisted state;
- failures are visible;
- the behavior is covered by tests;
- mutations create audit events;
- external integrations are explicitly marked unavailable if not configured.

Never present these as live:

- seeded cases;
- hard-coded scores;
- pre-generated AI output;
- fake department responses;
- fake officer identities;
- fake SMS/email delivery;
- random progress;
- fake timestamps;
- mock government API calls;
- silent offline AI fallback.

Test fixtures may exist, but **must never enter the production execution path**.

---

# 3. P0 — Remove Fake/Simulation Behavior

## 3.1 Separate execution modes

Use:

```text
APP_MODE=production|development|test
AI_MODE=live|offline
```

Production must use:

```text
APP_MODE=production
AI_MODE=live
```

If live AI credentials are missing in production:

```text
FAIL FAST
```

Do not silently fall back to deterministic extraction.

Offline extraction is allowed only for explicit development/test workflows.

## 3.2 Separate seed data

Keep fixtures under:

```text
tests/fixtures/
```

or equivalent test-only directories.

Do not load seeded grievances from production routes.

A `/demo/reset-seed` endpoint must either be removed from production or be unavailable when `APP_MODE=production`.

---

# 4. P0 — Delete Hard-Coded Evaluation Metrics

The current evaluation route contains fixed values such as:

```text
dependency_accuracy = 100%
conflict_detection_f1 = 0.96
dynamic_replanning_accuracy = 100%
human_escalation_precision = 100%
```

These must be removed.

Build:

```text
intelligence/evaluation/
├── datasets/
├── metrics.py
├── runner.py
└── reports/
```

Calculate metrics from a versioned dataset.

Required metrics:

### Extraction
- claim precision/recall
- authority precision/recall
- conflict precision/recall
- missing-information precision/recall

### Planning
- dependency accuracy
- task completeness
- invalid DAG rate
- invalid dependency rate

### Replanning
- correct invalidation rate
- replacement accuracy
- unaffected-task preservation rate
- dependency consistency after replan

### Safety
- unsafe autonomous execution rate
- human-gate precision
- human-gate recall

### Closure
- false closure rate
- evidence completeness
- verification completeness

Every result must contain:

```json
{
  "metric": "dependency_accuracy",
  "value": 0.94,
  "sample_count": 200,
  "dataset_version": "v1.0",
  "generated_at": "..."
}
```

Never show a percentage without its dataset/sample context.

---

# 5. P0 — Make Live AI Actually Live

The production pipeline must be:

```text
Citizen complaint
      ↓
Input validation
      ↓
Live AI extraction
      ↓
Strict JSON/schema validation
      ↓
Semantic validation
      ↓
Risk/policy validation
      ↓
Database transaction
```

The model must return structured fields:

```text
goal
claims[]
authorities[]
conflicts[]
missing_information[]
assumptions[]
risk_signals[]
```

Use strict Pydantic/JSON-schema validation.

Malformed AI output must fail safely.

AI output must never directly mutate the database.

---

# 6. P0 — Explicit State Machine

Create an explicit case state machine.

### Case states

```text
NEW
ANALYZING
ANALYZED
IN_PROGRESS
WAITING_FOR_CITIZEN
WAITING_FOR_AUTHORITY
WAITING_FOR_APPROVAL
REPLANNING
READY_FOR_CLOSURE
CLOSED
FAILED
```

### Task states

```text
BLOCKED
READY
IN_PROGRESS
HUMAN_APPROVAL_REQUIRED
COMPLETED
INVALIDATED
FAILED
```

Every transition must be validated by backend code.

For example:

```text
INVALIDATED → COMPLETED
```

must be rejected.

Frontend must never decide case/task state.

---

# 7. P0 — Real Authentication + Authorization

Do not use officer names as identity.

Implement:

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

Use secure password hashing and signed/session-based authentication.

Roles:

```text
CITIZEN
OFFICER
SUPERVISOR
ADMIN
AUDITOR
```

Every protected action must verify:

```text
authenticated user
        ↓
role
        ↓
permission
        ↓
approval rule
        ↓
task
```

Human approval must be impossible from the UI alone.

Persist:

```text
approved_by_user_id
approved_by_role
approved_at
decision
notes
```

---

# 8. P0 — Real Evidence Pipeline

Support:

- PDF
- image
- text
- structured form input

Use:

```text
POST /cases/{id}/evidence
```

Persist:

```text
Evidence
--------
id
case_id
task_id
file_name
mime_type
storage_key
sha256
extracted_text
source_type
submitted_by
created_at
```

The system must store the actual file or a real object-storage reference.

Do not store only the filename.

Validate:

- MIME type
- extension
- file size
- content
- malicious uploads

---

# 9. P1 — Resolution Compiler

Upgrade the current:

```text
Complaint → Extraction → DAG
```

into:

```text
Complaint
   ↓
Semantic Extraction
   ↓
Resolution Compiler
   ↓
Obligation Graph
   ↓
Constrained Plan
   ↓
Executable DAG
```

The compiler translates citizen language into machine-checkable resolution obligations.

This should be the core product abstraction.

---

# 10. P1 — Obligation Graph

Do not represent the case only as tasks.

Use:

```text
CLAIM
  ↓
EVIDENCE
  ↓
OBLIGATION
  ↓
TASK
  ↓
DECISION
  ↓
OUTCOME
```

Example:

```text
Claim:
"Drainage overflow damaged my property."

↓
Obligation:
"Determine responsible authority."

↓
Task:
"Inspect drainage asset."

↓
Evidence:
"Inspection report."

↓
Decision:
"PWD responsible."

↓
Outcome:
"Repair verified."
```

Every task must have a traceable reason chain.

---

# 11. P1 — First-Class Assumptions

Add:

```text
Assumption
-----------
id
case_id
statement
source
confidence
status
created_at
invalidated_at
invalidated_by_evidence_id
```

Statuses:

```text
ACTIVE
CONFIRMED
INVALIDATED
UNKNOWN
```

Example:

```text
Assumption:
Municipality is responsible.

New evidence:
PWD inspection report.

Result:
Assumption → INVALIDATED
```

This should trigger plan-validity analysis.

---

# 12. P1 — Plan Versioning

Never overwrite the previous plan.

Add:

```text
PlanVersion
-----------
id
case_id
version_number
reason
trigger_evidence_id
created_by
created_at
status
graph_json
```

Example:

```text
PLAN V1
   ↓
NEW EVIDENCE
   ↓
V1 INVALIDATED
   ↓
PLAN V2
```

The UI must show what changed between versions.

---

# 13. P1 — Evidence Provenance Graph

Add:

```text
EvidenceLink
------------
evidence_id
entity_type
entity_id
relationship
confidence
created_at
```

Examples:

```text
EV-102 → supports → CLAIM-07
EV-102 → invalidates → ASSUMPTION-03
CLAIM-07 → triggers → OBLIGATION-02
```

This creates explainability from evidence instead of a generic AI explanation.

---

# 14. P1 — Impact Radius

When new evidence arrives, do not blindly rebuild the entire case.

Calculate:

```text
New Evidence
   ↓
Affected Claims
   ↓
Affected Assumptions
   ↓
Affected Obligations
   ↓
Affected Tasks
   ↓
Affected Decisions
```

Persist:

```json
{
  "claims": [],
  "assumptions": [],
  "obligations": [],
  "tasks": [],
  "decisions": []
}
```

Everything outside the impact radius should remain unchanged unless a dependency requires otherwise.

---

# 15. P1 — Minimum-Change Replanning

The replan objective should be:

```text
Minimize:

changed tasks
+ invalidated work
+ coordination cost
+ risk

Subject to:

new evidence
policy rules
dependencies
authority constraints
citizen goal
human approval requirements
```

Return a structured diff:

```text
Previous Plan
Changed Nodes
Preserved Nodes
Removed Nodes
New Nodes
Reason
Trigger Evidence
```

Example:

```text
PLAN V1 → PLAN V2

Changed:
- authority assignment
- inspection task

Preserved:
- evidence verification
- citizen notification

Reason:
New inspection evidence invalidated the original authority assumption.
```

---

# 16. P1 — Resolution Debt

Create a measurable unresolved-work state.

Debt can come from:

```text
missing critical evidence
unresolved conflict
invalid assumption
pending approval
incomplete task
unverified outcome
stale/invalid plan
```

Represent it as structured items, not only one magic number:

```text
ResolutionDebtItem
------------------
case_id
source_type
source_id
severity
status
created_at
resolved_at
```

Calculate:

```text
resolution_debt = sum(active debt items)
```

Weights must be configuration/policy, not UI constants.

Closure must require:

```text
resolution_debt == 0
AND mandatory obligations satisfied
AND required evidence present
AND required approvals complete
AND outcome verified
AND active plan valid
```

---

# 17. P1 — Resolution Certificate

Generate the certificate from actual database records.

Include:

```text
Case ID
Citizen Goal
Claims
Evidence
Authorities
Obligations
Completed Tasks
Human Decisions
Outcome
Verification Evidence
Plan Versions
Audit Summary
Closed By
Closed At
Certificate Hash
```

Hash the canonical certificate payload with SHA-256.

Do not add blockchain merely for presentation.

---

# 18. P1 — Real External Integration Boundary

Never claim:

```text
Municipality API connected
PWD API connected
Government system integrated
```

unless an actual authenticated API exists.

Create:

```text
connectors/
├── base.py
├── municipality.py
├── pwd.py
├── registry.py
```

Interface example:

```python
class AuthorityConnector:
    async def create_task(...): ...
    async def get_task(...): ...
    async def submit_evidence(...): ...
    async def get_status(...): ...
```

If no external authority API is available, use the application's **real internal officer workspace** and explicitly state:

```text
External connector: NOT CONFIGURED
```

That is better than faking an integration.

---

# 19. P1 — Real Notifications

Where configured, use real:

```text
email
SMS
in-app notification
```

Persist:

```text
Notification
------------
id
case_id
recipient
channel
event
status
provider_message_id
sent_at
error
```

Only show "sent" after the provider confirms success.

---

# 20. P1 — Background Jobs

Long operations should use background jobs:

```text
API
 ↓
Queue
 ↓
Worker
 ↓
AI/OCR/Connector
 ↓
Database
 ↓
SSE/WebSocket
 ↓
Frontend
```

Persist:

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
RETRYING
```

Retries must be bounded and idempotent.

---

# 21. P1 — Idempotency

Important mutations must accept an idempotency key:

```text
submit evidence
complete task
approve task
create external task
send notification
```

Duplicate requests must not duplicate side effects.

---

# 22. P1 — Concurrency Protection

Use:

- database transactions;
- optimistic locking/version numbers;
- row locks where required;
- backend state validation.

Example:

```text
Task version 7

Officer A:
7 → 8

Officer B:
tries to update version 7

→ conflict
```

Never silently overwrite state.

---

# 23. P1 — Append-Only Audit

Audit events should not be editable/deletable by normal application logic.

Event types:

```text
CASE_CREATED
CASE_ANALYZED
PLAN_CREATED
EVIDENCE_SUBMITTED
ASSUMPTION_INVALIDATED
REPLAN_TRIGGERED
TASK_CREATED
TASK_COMPLETED
APPROVAL_GRANTED
APPROVAL_REJECTED
CONFLICT_DETECTED
CONFLICT_RESOLVED
OUTCOME_VERIFIED
CERTIFICATE_CREATED
CASE_CLOSED
```

Persist:

```text
actor
timestamp
case_id
event_type
reason
metadata
previous_event_hash
event_hash
```

This makes audit tampering detectable.

---

# 24. P1 — Correct Time Handling

Use timezone-aware timestamps.

Database:

```text
UTC
```

Application:

```python
datetime.now(timezone.utc)
```

Frontend:

```text
convert UTC → user/local timezone
```

Do not use naive UTC timestamps.

---

# 25. P1 — API Contract

Minimum production API:

```text
POST   /auth/login

POST   /cases
GET    /cases
GET    /cases/{id}

POST   /cases/{id}/analyze
GET    /cases/{id}/graph

POST   /cases/{id}/evidence
GET    /cases/{id}/evidence

POST   /cases/{id}/tasks/{task_id}/complete
POST   /cases/{id}/tasks/{task_id}/approve

POST   /cases/{id}/replan
GET    /cases/{id}/plans
GET    /cases/{id}/plans/{version}

GET    /cases/{id}/impact-radius
GET    /cases/{id}/resolution-debt

POST   /cases/{id}/verify-outcome
POST   /cases/{id}/close

GET    /cases/{id}/certificate
GET    /cases/{id}/audit
```

Every mutation needs:

- authentication;
- authorization;
- validation;
- transaction;
- structured error response;
- audit event.

---

# 26. Frontend Rule

The frontend displays state.

It does not own business logic.

Correct:

```text
UI
 ↓
API
 ↓
Authorization
 ↓
State validation
 ↓
Transaction
 ↓
Audit event
 ↓
UI refresh
```

Incorrect:

```text
button clicked
 ↓
frontend marks task completed
```

---

# 27. Structured Error Handling

Use:

```json
{
  "error": {
    "code": "PLAN_INVALID",
    "message": "Submitted evidence invalidated the active plan.",
    "details": {},
    "request_id": "..."
  }
}
```

Distinguish:

```text
VALIDATION_ERROR
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
AI_UNAVAILABLE
AI_INVALID_OUTPUT
DATABASE_ERROR
EXTERNAL_CONNECTOR_UNAVAILABLE
CONFLICT
TIMEOUT
PLAN_INVALID
STATE_TRANSITION_INVALID
```

Never hide failures behind success responses.

---

# 28. DAG Safety

Before saving a plan:

```text
1. validate node IDs
2. validate dependencies
3. detect cycles
4. validate authorities
5. validate required evidence
6. validate risk gates
7. calculate initial states
8. persist plan version
```

A cyclic plan must never execute.

---

# 29. Security

Required before production:

```text
[ ] authentication
[ ] authorization
[ ] input validation
[ ] file validation
[ ] file size limits
[ ] malware scanning
[ ] secure CORS
[ ] rate limiting
[ ] secret management
[ ] audit logging
[ ] PII minimization
[ ] dependency scanning
[ ] HTTPS
```

Never log passwords, tokens, or unnecessary sensitive citizen data.

---

# 30. Privacy

Separate:

```text
Citizen identity
Case reasoning
Evidence
Audit
```

Use internal IDs.

Use anonymized/synthetic citizen data for hackathon demonstrations unless real data is authorized.

---

# 31. Testing

## Unit

Test:

- AI schema validation;
- DAG validation;
- scheduler;
- state machine;
- risk gates;
- resolution debt;
- impact radius;
- minimum-change replanning;
- certificate hashing.

## Integration

Test:

```text
create case
→ analyze
→ upload evidence
→ complete task
→ submit contradictory evidence
→ replan
→ approve
→ verify
→ close
```

## End-to-end

Use a real browser workflow:

```text
Citizen submits new grievance
↓
Live AI analysis
↓
Plan generated
↓
Officer receives task
↓
Officer uploads evidence
↓
Evidence invalidates assumption
↓
Impact radius calculated
↓
Plan V2 generated
↓
Human approval
↓
Outcome evidence
↓
Resolution Debt = 0
↓
Certificate generated
↓
Case closed
```

---

# 32. Golden Regression Scenario

Create one deterministic regression scenario containing:

- multiple claims;
- disputed authority;
- missing information;
- initial evidence;
- later contradictory evidence.

Expected:

```text
V1 created
↓
Tasks become READY
↓
New evidence submitted
↓
Specific assumption INVALIDATED
↓
Impact radius calculated
↓
Affected tasks changed
↓
Unaffected tasks preserved
↓
V2 created
↓
High-risk action blocked
↓
Authorized officer approves
↓
Outcome evidence submitted
↓
Resolution Debt = 0
↓
Certificate generated
↓
Case CLOSED
```

Run this in CI on every relevant change.

---

# 33. CI/CD

Pipeline:

```text
push
 ↓
lint
 ↓
type check
 ↓
unit tests
 ↓
integration tests
 ↓
security scan
 ↓
migration check
 ↓
backend build
 ↓
frontend build
 ↓
E2E
 ↓
deploy
```

A failing quality gate must block deployment.

---

# 34. Observability

Add:

```text
structured logs
request IDs
trace IDs
latency
error rates
AI latency
AI token/cost metrics
job metrics
database metrics
```

This is essential for diagnosing real failures during a live demo.

---

# 35. Recommended Repository Structure

```text
resolvegraph/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── auth/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── policies/
│   │   │   ├── connectors/
│   │   │   └── workers/
│   │   └── tests/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── features/
│       └── tests/
├── intelligence/
│   ├── extraction/
│   ├── compiler/
│   ├── obligations/
│   ├── planning/
│   ├── replanning/
│   ├── verification/
│   ├── evidence/
│   └── evaluation/
├── migrations/
├── docs/
├── docker/
└── .github/
    └── workflows/
```

---

# 36. Implementation Order

Do not rewrite everything simultaneously.

## Phase 1 — Credibility blockers

1. remove hard-coded metrics;
2. separate production/dev/test;
3. disable silent offline fallback;
4. remove fake integration claims;
5. fix timestamps;
6. enforce AI schemas.

## Phase 2 — Core intelligence

7. state machine;
8. plan versioning;
9. assumptions;
10. obligations;
11. evidence provenance;
12. impact radius;
13. minimum-change replanning;
14. resolution debt;
15. resolution certificate.

## Phase 3 — Real users/data

16. authentication;
17. RBAC;
18. real file upload;
19. real evidence processing;
20. real officer workflow;
21. real notifications where configured.

## Phase 4 — Reliability

22. transactions;
23. optimistic locking;
24. idempotency;
25. background jobs;
26. bounded retries;
27. structured errors;
28. observability.

## Phase 5 — Proof

29. unit tests;
30. integration tests;
31. golden E2E test;
32. real evaluation dataset;
33. CI quality gates;
34. deployment.

---

# 37. Flagship No-Simulation Demo

Use a completely new grievance.

### Step 1 — Citizen

Enter a new complex grievance manually.

### Step 2 — Live AI

Show real analysis.

### Step 3 — Resolution Compiler

Show:

```text
Goal
Claims
Authorities
Missing Information
Assumptions
Obligations
```

### Step 4 — Plan V1

Show the executable DAG.

### Step 5 — Real Evidence

Upload a real PDF/image/text document.

### Step 6 — Evidence Reasoning

Show:

```text
Evidence received
↓
Content extracted
↓
Relevant fact identified
↓
Assumption invalidated
```

### Step 7 — Impact Radius

Show exactly which graph elements are affected.

### Step 8 — Minimum-Change Replan

Show:

```text
PLAN V1 → PLAN V2
```

with changed and preserved work.

### Step 9 — Human Gate

Show a genuinely blocked high-risk action.

Authorized officer logs in and approves it.

### Step 10 — Outcome

Submit real verification evidence.

### Step 11 — Resolution Debt

Show:

```text
Resolution Debt: 0
```

### Step 12 — Certificate

Generate the certificate from actual database records.

---

# 38. Final Acceptance Checklist

## Real Input

- [ ] New complaint works without seed data.
- [ ] Live AI is actually invoked.
- [ ] Production cannot silently switch to offline AI.

## Intelligence

- [ ] Structured AI output.
- [ ] Invalid output rejected.
- [ ] Claims persisted.
- [ ] Assumptions persisted.
- [ ] Obligations persisted.

## Planning

- [ ] Valid DAG generated.
- [ ] Cycles rejected.
- [ ] Dependencies validated.
- [ ] Plan versions persisted.

## Evidence

- [ ] Real files uploaded.
- [ ] File content actually processed.
- [ ] SHA-256 stored.
- [ ] Provenance links stored.

## Replanning

- [ ] New evidence can invalidate assumptions.
- [ ] Impact radius calculated.
- [ ] Only affected work changes where possible.
- [ ] Previous plans remain auditable.

## Safety

- [ ] High-risk actions blocked.
- [ ] Human approval backend-enforced.
- [ ] Unauthorized approval rejected.

## Closure

- [ ] Missing critical evidence blocks closure.
- [ ] Conflicts block closure.
- [ ] Invalid assumptions block closure.
- [ ] Unverified outcome blocks closure.
- [ ] Resolution Debt must reach zero.
- [ ] Certificate generated from real records.

## Evaluation

- [ ] No hard-coded benchmark values.
- [ ] Dataset version stored.
- [ ] Sample count stored.
- [ ] Metrics reproducible.

## Reliability

- [ ] Duplicate requests protected.
- [ ] Concurrent updates protected.
- [ ] Failures visible.
- [ ] Secrets excluded from source control.
- [ ] CI passes.

---

# 39. Final Architecture

```text
Citizen
   │
   ▼
Grievance Input
   │
   ▼
Live AI Extraction
   │
   ▼
Resolution Compiler
   │
   ▼
Obligation Graph
Claim → Evidence → Obligation → Task → Decision → Outcome
   │
   ▼
Constrained Planner
   │
   ▼
Executable DAG V1
   │
   ▼
Authority Workspace
   │
   ▼
New Evidence
   │
   ▼
Plan Validity Check
   ├── VALID ────────────────┐
   │                         │
   └── INVALID               │
        │                    │
        ▼                    │
   Impact Radius             │
        │                    │
        ▼                    │
   Minimum-Change Replanner  │
        │                    │
        ▼                    │
   Plan V2+ ─────────────────┘
             │
             ▼
      Risk / Human Gate
             │
             ▼
      Outcome Verification
             │
             ▼
      Resolution Debt
             │
          Debt = 0
             │
             ▼
      Resolution Certificate
             │
             ▼
           CLOSED
```

---

# 40. The Core Differentiator

Do not sell the product as:

> "An AI agent for grievances."

The stronger engineering identity is:

> **GrieveX maintains a verifiable resolution state.**

The key chain is:

```text
Natural-language grievance
        ↓
Resolution Compiler
        ↓
Obligation Graph
        ↓
Assumption-aware Plan
        ↓
Executable DAG
        ↓
Evidence
        ↓
Impact Radius
        ↓
Minimum-Change Replanning
        ↓
Resolution Debt
        ↓
Resolution Certificate
```

That makes the product about **resolution intelligence**, not merely complaint classification or chatbot interaction.

---

# 41. Team Rule

Before showing any feature to judges, ask:

> **Can we demonstrate the exact API request, database record, algorithmic decision, evidence, and audit event that produced this screen?**

If yes, keep it.

If the answer is:

> "It is mocked for the demo."

then either implement it for real or explicitly label it as a future integration/test fixture.

A smaller genuinely executable system is more credible than a larger simulated one.

---

## Definition of Done

```text
REAL INPUT
   +
REAL AI
   +
REAL DATABASE
   +
REAL EVIDENCE
   +
REAL PLAN
   +
REAL REPLANNING
   +
REAL AUTHORIZATION
   +
REAL VERIFICATION
   +
REAL AUDIT
   +
REAL METRICS
   +
REAL TESTS
   =
CREDIBLE WORKING MVP
```

Anything outside this definition must be clearly labeled as a prototype boundary or future integration.
